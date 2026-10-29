"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  ShoppingBag,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  X,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { buildHandoffSummary, buildWhatsAppHandoffUrl } from "@/lib/ai/handoff";

const STORAGE_KEY = "compel-chat-messages-v1";
const OPEN_KEY = "compel-chat-open-v1";
const SESSION_KEY = "compel-chat-session-v1";
const CONSENT_KEY = "compel-chat-consent-v1";
const PRIVACY_URL = "/docs/Politica-de-Privacidad-COMPEL.pdf";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: "Hola 👋 Soy el asistente virtual de COMPEL. ¿Qué producto estás buscando?",
  products: [],
};

const INITIAL_SUGGESTIONS = [
  "¿Qué impresoras recomiendas?",
  "Necesito etiquetas para mi negocio",
  "Solicitar asesoría",
];

const VOLUME_OPTIONS = [
  { value: "", label: "Selecciona un rango" },
  { value: "1-10", label: "1 a 10 unidades" },
  { value: "11-50", label: "11 a 50 unidades" },
  { value: "51-200", label: "51 a 200 unidades" },
  { value: "200+", label: "Más de 200 unidades" },
  { value: "no-definido", label: "Aún no lo sé" },
];

const EMPTY_LEAD = {
  name: "",
  company: "",
  email: "",
  phone: "",
  interest: "",
  volume: "",
  message: "",
  website: "",
};

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPrice(value, currency = "$") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `${currency || "$"}${amount.toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function autoResize(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 112)}px`;
}

function formatAssistantContent(content) {
  return String(content || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*[*-]\s+/gm, "• ")
    .replace(/^\s*#{1,6}\s+/gm, "");
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5" aria-label="El asistente está escribiendo">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}

function ProductSuggestion({ product, currency, onNavigate, canAdd, onAdd, adding, signedIn }) {
  const subtitle = product.subcategoryName || product.categoryName;
  const canShowAdd = canAdd && product.inStock !== false && Number(product.stock) > 0;

  return (
    <div className="flex items-stretch gap-1 rounded-xl border border-brand-line bg-white transition hover:border-brand-accent hover:shadow-sm">
      <Link
        href={`/product/${product.id}`}
        onClick={() => onNavigate(product)}
        className="group flex min-w-0 flex-1 items-center gap-3 p-2.5"
      >
        <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-sand">
          {product.image ? (
            <Image src={product.image} alt="" fill sizes="48px" className="object-contain p-1" />
          ) : (
            <ShoppingBag size={18} className="text-brand-muted" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-brand-ink">{product.name}</span>
          {subtitle && (
            <span className="block truncate text-[10px] uppercase tracking-[0.12em] text-brand-muted">
              {subtitle}
            </span>
          )}
          {product.price != null ? (
            <span className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-brand-accent">
                {formatPrice(product.price, currency)}
              </span>
              {product.regularPrice != null && Number(product.regularPrice) > Number(product.price) && (
                <span className="text-[10px] text-brand-muted line-through">
                  {formatPrice(product.regularPrice, currency)}
                </span>
              )}
            </span>
          ) : (
            <span className="mt-0.5 block text-[10px] font-medium text-brand-muted">
              {signedIn ? "Precio no disponible por ahora" : "Inicia sesión para ver el precio"}
            </span>
          )}
        </span>
        <ChevronRight size={14} className="shrink-0 text-brand-line transition group-hover:text-brand-accent" />
      </Link>
      {canShowAdd && (
        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={adding}
          aria-label={`Añadir ${product.name} al carrito`}
          className="my-2 mr-2 inline-flex w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-brand-accent-soft text-[9px] font-semibold text-brand-accent transition hover:bg-brand-accent hover:text-white disabled:cursor-wait disabled:opacity-50"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
          Añadir
        </button>
      )}
    </div>
  );
}

function MessageFeedback({ message, sessionId, getToken, onTrack }) {
  const [sent, setSent] = useState(message.feedback || "");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (rating, text = "") => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      let token = null;
      try {
        token = await getToken();
      } catch {
        token = null;
      }

      const response = await fetch("/api/chat/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating,
          comment: text.trim() || undefined,
          sessionId,
          messageExcerpt: String(message.content || "").slice(0, 500),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo enviar tu opinión.");
      }
      setSent(rating);
      setShowComment(false);
      onTrack?.("feedback_submitted", { rating });
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar tu opinión.");
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return <p className="text-[10px] text-brand-muted">Gracias por tu opinión.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-brand-muted">¿Te sirvió?</span>
        <button
          type="button"
          onClick={() => submit("up")}
          disabled={saving}
          aria-label="La respuesta fue útil"
          className="grid h-6 w-6 place-items-center rounded-full border border-brand-line text-brand-muted transition hover:border-brand-success hover:text-brand-success disabled:opacity-40"
        >
          <ThumbsUp size={12} />
        </button>
        <button
          type="button"
          onClick={() => setShowComment(true)}
          disabled={saving}
          aria-label="La respuesta no fue útil"
          className="grid h-6 w-6 place-items-center rounded-full border border-brand-line text-brand-muted transition hover:border-brand-sale hover:text-brand-sale disabled:opacity-40"
        >
          <ThumbsDown size={12} />
        </button>
      </div>
      {showComment && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            placeholder="¿Qué podemos mejorar?"
            aria-label="Comentario sobre la respuesta"
            className="min-w-0 flex-1 rounded-lg border border-brand-line bg-white px-2.5 py-1.5 text-[11px] text-brand-ink outline-none focus:border-brand-accent"
          />
          <button
            type="button"
            onClick={() => submit("down", comment)}
            disabled={saving}
            className="rounded-lg bg-brand-accent px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40"
          >
            {saving ? "..." : "Enviar"}
          </button>
          <button
            type="button"
            onClick={() => setShowComment(false)}
            className="text-[10px] text-brand-muted underline underline-offset-2"
          >
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="text-[10px] text-brand-sale">{error}</p>}
    </div>
  );
}

function LeadForm({ onClose, defaultName, defaultEmail, defaultPhone, sessionId, getToken, onTrack }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_LEAD,
    name: defaultName || "",
    email: defaultEmail || "",
    phone: defaultPhone || "",
  }));
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Ingresa un correo o un teléfono de contacto.");
      return;
    }
    if (!consent) {
      setError("Debes aceptar ser contactado por COMPEL.");
      return;
    }

    setSaving(true);
    try {
      let token = null;
      try {
        token = await getToken();
      } catch {
        token = null;
      }

      const response = await fetch("/api/chat/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, consent: true, sessionId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo enviar la solicitud.");
      }
      setSent(true);
      onTrack?.("lead_submitted", { interest: form.interest ? "yes" : "no" });
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent";

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compel-lead-title"
    >
      <div className="flex items-center gap-2 border-b border-brand-line px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver al chat"
          className="grid h-9 w-9 place-items-center rounded-full text-brand-charcoal transition hover:bg-brand-sand"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h3 id="compel-lead-title" className="text-sm font-semibold text-brand-ink">
            Solicitar asesoría
          </h3>
          <p className="text-[11px] text-brand-muted">Un especialista te contactará.</p>
        </div>
      </div>

      {sent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-success/10 text-brand-success">
            <CheckCircle2 size={28} />
          </span>
          <h4 className="font-display text-2xl text-brand-ink">Solicitud recibida</h4>
          <p className="text-sm leading-6 text-brand-muted">
            Un asesor de COMPEL se pondrá en contacto contigo con la información que nos compartiste.
          </p>
          <a
            href={buildWhatsAppHandoffUrl("Solicitud de asesoría enviada desde el chat.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrack?.("handoff", { source: "lead_success" })}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-accent px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-accent-hover"
          >
            Continuar por WhatsApp
          </a>
          <button type="button" onClick={onClose} className="text-xs font-medium text-brand-accent underline underline-offset-2">
            Volver al chat
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-brand-charcoal">
                Nombre *
                <input required maxLength={80} value={form.name} onChange={update("name")} className={inputClass} />
              </label>
              <label className="text-xs font-medium text-brand-charcoal">
                Empresa
                <input maxLength={100} value={form.company} onChange={update("company")} className={inputClass} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-brand-charcoal">
                Correo
                <input type="email" maxLength={160} value={form.email} onChange={update("email")} className={inputClass} />
              </label>
              <label className="text-xs font-medium text-brand-charcoal">
                Teléfono
                <input type="tel" maxLength={40} value={form.phone} onChange={update("phone")} className={inputClass} />
              </label>
            </div>

            <label className="block text-xs font-medium text-brand-charcoal">
              ¿Qué necesitas?
              <input
                maxLength={200}
                value={form.interest}
                onChange={update("interest")}
                placeholder="Ej. impresoras Zebra, etiquetas, RFID..."
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-medium text-brand-charcoal">
              Volumen estimado
              <select value={form.volume} onChange={update("volume")} className={inputClass}>
                {VOLUME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-brand-charcoal">
              Mensaje
              <textarea
                rows={3}
                maxLength={1000}
                value={form.message}
                onChange={update("message")}
                placeholder="Cuéntanos tu caso de uso o lo que necesitas resolver."
                className={`${inputClass} resize-none`}
              />
            </label>

            <label className="flex items-start gap-2 text-[11px] leading-5 text-brand-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 accent-brand-accent"
              />
              Acepto que COMPEL me contacte por correo o teléfono para atender esta solicitud.
            </label>

            <input
              type="text"
              name="website"
              value={form.website}
              onChange={update("website")}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
          </div>

          <div className="border-t border-brand-line px-4 py-3">
            {error && <p className="mb-2 text-[11px] text-brand-sale">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {saving ? "Enviando..." : "Enviar solicitud"}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-brand-muted">
              Tus datos se usan solo para contactarte.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ChatWidget() {
  const { getToken, currency, user, userData, commerceEnabled, addToCart, cartItems } = useAppContext();
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [consent, setConsent] = useState(false);
  const [consentNoticeDismissed, setConsentNoticeDismissed] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [addingId, setAddingId] = useState("");

  const launcherRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const sessionIdRef = useRef("");
  const lastOpenRef = useRef(false);

  const canAddToCart = Boolean(user && commerceEnabled);
  const cart = useMemo(
    () => ({
      items: Object.entries(cartItems || {}).map(([id, quantity]) => ({ id, quantity })),
    }),
    [cartItems]
  );

  const track = useCallback((type, metadata = {}) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    try {
      fetch("/api/chat/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type, metadata }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // La analítica nunca debe interrumpir el chat.
    }
  }, []);

  useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = makeId();
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
      sessionIdRef.current = sessionId;
      const savedConsent = sessionStorage.getItem(CONSENT_KEY);
      setConsent(savedConsent === "1");
      setConsentNoticeDismissed(savedConsent === "1" || savedConsent === "0");

      const saved = savedConsent === "1" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (savedConsent !== "1") sessionStorage.removeItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed
            .filter((message) => message?.content?.trim() || message?.products?.length)
            .map((message) => ({
              ...message,
              id: message.id || makeId(),
              streaming: false,
              error: undefined,
            }));
          if (clean.length) setMessages(clean);
        }
      }
      if (sessionStorage.getItem(OPEN_KEY) === "1") setOpen(true);
    } catch {
      // sessionStorage puede no estar disponible en modo privado.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || loading) return;
    try {
      if (!consent) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      const clean = messages
        .filter((message) => message.content?.trim() || message.products?.length)
        .map(({ streaming, error, ...message }) => message)
        .slice(-30);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignorar errores de almacenamiento.
    }
  }, [messages, hydrated, loading, consent]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      // Ignorar errores de almacenamiento.
    }
  }, [open, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (open && !lastOpenRef.current) track("chat_open");
    else if (!open && lastOpenRef.current) track("chat_close");
    lastOpenRef.current = open;
  }, [open, hydrated, track]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, loading]);

  const chooseConsent = useCallback((saveConversation) => {
    setConsent(saveConversation);
    setConsentNoticeDismissed(true);
    try {
      sessionStorage.setItem(CONSENT_KEY, saveConversation ? "1" : "0");
      if (!saveConversation) sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar errores de almacenamiento.
    }
  }, []);

  const closeChat = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (launcherRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (leadOpen) setLeadOpen(false);
        else closeChat();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeChat, leadOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const startStream = useCallback(
    async (history) => {
      const assistantId = makeId();
      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", products: [], streaming: true },
      ]);
      setQuickReplies([]);
      setHandoff(null);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let token = null;
        try {
          token = await getToken();
        } catch {
          token = null;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            sessionId: sessionIdRef.current,
            consent,
            cart,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const error = new Error(data?.message || "No se pudo conectar con el asistente.");
          error.isAssistantError = true;
          error.code = data?.code;
          throw error;
        }
        if (!response.body) {
          const error = new Error("Tu navegador no permite respuestas en streaming.");
          error.isAssistantError = true;
          throw error;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamCompleted = false;

        const applyEvent = (event) => {
          if (event.type === "done") {
            streamCompleted = true;
          } else if (event.type === "delta" && event.text) {
            setMessages((previous) =>
              previous.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + event.text }
                  : message
              )
            );
          } else if (event.type === "products") {
            const products = Array.isArray(event.products) ? event.products : [];
            setMessages((previous) =>
              previous.map((message) =>
                message.id === assistantId ? { ...message, products } : message
              )
            );
            if (products.length) {
              track("product_impression", { productIds: products.map((product) => product.id) });
            }
          } else if (event.type === "handoff") {
            setHandoff({ url: event.url, summary: event.summary });
            track("handoff", { source: "assistant" });
          } else if (event.type === "quickReplies") {
            setQuickReplies(Array.isArray(event.replies) ? event.replies.slice(0, 4) : []);
          }
        };

        const processFrame = (frame) => {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) return;
          let event;
          try {
            event = JSON.parse(dataLine.slice(5).trim());
          } catch {
            const error = new Error("La respuesta del asistente llegó en un formato inválido.");
            error.isAssistantError = true;
            error.code = "INVALID_STREAM";
            throw error;
          }
          if (event.type === "error") {
            const error = new Error(event.message || "No pude completar la respuesta.");
            error.isAssistantError = true;
            error.code = event.code;
            throw error;
          }
          applyEvent(event);
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";
          for (const frame of frames) processFrame(frame);
        }
        if (buffer.trim()) processFrame(buffer);
        if (!streamCompleted) {
          const error = new Error("La respuesta se interrumpió antes de completarse. Intenta de nuevo.");
          error.isAssistantError = true;
          error.code = "INCOMPLETE_STREAM";
          throw error;
        }

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  streaming: false,
                  content: message.content || "No pude generar una respuesta. Intenta de nuevo.",
                }
              : message
          )
        );
      } catch (error) {
        if (error.name === "AbortError") return;
        track("chat_error", { code: error.code || "AI_ERROR" });
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  streaming: false,
                  error: error.message || "No se pudo conectar con el asistente.",
                }
              : message
          )
        );
      } finally {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId ? { ...message, streaming: false } : message
          )
        );
        setLoading(false);
        abortRef.current = null;
      }
    },
    [getToken, consent, cart, track]
  );

  const sendMessage = useCallback(
    (textOverride) => {
      const text = String(textOverride ?? input).trim();
      if (!text || loading) return;

      const userMessage = { id: makeId(), role: "user", content: text };
      const history = [...messages, userMessage]
        .filter((message) => message.content?.trim())
        .slice(-20);

      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      track("message_sent", { length: text.length });
      startStream(history);
    },
    [input, loading, messages, startStream, track]
  );

  const startHandoff = useCallback(
    (source = "manual") => {
      const products = messages.flatMap((message) => message.products || []);
      const summary = buildHandoffSummary(messages, products);
      const url = buildWhatsAppHandoffUrl(summary);
      setHandoff({ url, summary });
      track("handoff", { source });
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [messages, track]
  );

  const handleSuggestion = useCallback(
    (suggestion) => {
      if (suggestion === "Solicitar asesoría") {
        setLeadOpen(true);
        return;
      }
      if (suggestion === "Hablar con un asesor") {
        startHandoff("quick_reply");
        return;
      }
      sendMessage(suggestion);
    },
    [sendMessage, startHandoff]
  );

  const addProduct = useCallback(
    async (product) => {
      setAddingId(product.id);
      try {
        const added = await addToCart(product.id, 1);
        if (added) track("add_to_cart", { productId: product.id });
      } finally {
        setAddingId("");
      }
    },
    [addToCart, track]
  );

  const handleProductClick = useCallback(
    (product) => {
      track("product_click", { productId: product.id });
      closeChat();
    },
    [closeChat, track]
  );

  const retry = useCallback(() => {
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
    if (lastUserIndex === -1) return;
    const history = messages
      .slice(0, lastUserIndex + 1)
      .filter((message) => message.content?.trim());
    startStream(history);
  }, [messages, startStream]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    const nextSession = makeId();
    sessionIdRef.current = nextSession;
    try {
      sessionStorage.setItem(SESSION_KEY, nextSession);
    } catch {
      // Ignorar errores de almacenamiento.
    }
    setMessages([INITIAL_MESSAGE]);
    setQuickReplies([]);
    setInput("");
    setHandoff(null);
    setLeadOpen(false);
    if (inputRef.current) inputRef.current.style.height = "auto";
    inputRef.current?.focus();
  }, []);

  const onInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const lastAssistantId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant" && !message.streaming && message.content?.trim()) {
        return message.id;
      }
    }
    return "";
  }, [messages]);

  const suggestions = loading
    ? []
    : quickReplies.length
      ? quickReplies
      : messages.length <= 1
        ? INITIAL_SUGGESTIONS
        : [];

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Cerrar asistente COMPEL" : "Abrir asistente COMPEL"}
        aria-expanded={open}
        aria-controls="compel-chat-panel"
        className={`fixed bottom-6 right-24 z-[60] h-14 w-14 items-center justify-center rounded-full bg-brand-accent text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-brand-accent-hover ${
          open ? "hidden sm:flex" : "flex"
        }`}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Cerrar asistente COMPEL"
          onClick={closeChat}
          className="fixed inset-0 z-[75] cursor-default bg-brand-ink/30 backdrop-blur-[2px] sm:hidden"
        />
      )}

      {open && (
        <div
          id="compel-chat-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compel-chat-title"
          className="fixed inset-x-0 bottom-0 z-[80] flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl border border-brand-line bg-white shadow-[0_-20px_60px_-15px_rgba(11,13,18,0.35)] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,calc(100dvh-8rem))] sm:w-[380px] sm:rounded-3xl sm:shadow-[0_24px_60px_-12px_rgba(11,13,18,0.3)]"
        >
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand-accent to-brand-accent-hover px-4 py-3.5 text-white sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
              <Bot size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="compel-chat-title" className="truncate text-sm font-semibold sm:text-base">
                Asistente COMPEL
              </h2>
              <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Asesor virtual · responde en segundos
              </p>
            </div>
            <button
              type="button"
              onClick={newChat}
              aria-label="Nueva conversación"
              title="Nueva conversación"
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="Cerrar asistente"
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-busy={loading}
            className="flex-1 space-y-4 overflow-y-auto bg-[#F7F8FC] px-4 py-5 sm:px-5"
          >
            {!consentNoticeDismissed && (
              <div className="rounded-xl border border-brand-line bg-white p-3 text-[11px] leading-5 text-brand-muted">
                <p>
                  Para responder, procesamos tus mensajes con IA.                   Guardar la conversación hasta 90 días es opcional; si continúas sin aceptar, no guardaremos
                  el historial. Registramos eventos de uso sin incluir el texto del chat y los conservamos
                  hasta 90 días. No compartas datos sensibles.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => chooseConsent(true)}
                    className="rounded-full bg-brand-accent px-3 py-1.5 text-[10px] font-semibold text-white"
                  >
                    Aceptar y guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseConsent(false)}
                    className="text-[10px] font-medium text-brand-accent underline underline-offset-2"
                  >
                    Continuar sin guardar
                  </button>
                  <a
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-medium text-brand-accent underline underline-offset-2"
                  >
                    Política de privacidad
                  </a>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <span className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-accent-soft text-brand-accent">
                    <Bot size={14} />
                  </span>
                )}
                <div
                  className={`flex max-w-[86%] flex-col gap-2 ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-sm bg-brand-accent text-white"
                        : "rounded-tl-sm border border-brand-line bg-white text-brand-charcoal"
                    }`}
                  >
                    {message.content
                      ? message.role === "assistant"
                        ? formatAssistantContent(message.content)
                        : message.content
                      : message.streaming
                        ? <TypingDots />
                        : null}
                  </div>

                  {message.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-5 text-brand-sale">
                      <p>{message.error}</p>
                      <button
                        type="button"
                        onClick={retry}
                        className="mt-1 font-semibold underline underline-offset-2"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {message.products?.length > 0 && (
                    <div className="w-full space-y-2">
                      {message.products.map((product) => (
                        <ProductSuggestion
                          key={product.id}
                          product={product}
                          currency={currency}
                          onNavigate={handleProductClick}
                          canAdd={canAddToCart}
                          onAdd={addProduct}
                          adding={addingId === product.id}
                          signedIn={Boolean(user)}
                        />
                      ))}
                    </div>
                  )}

                  {message.role === "assistant" &&
                    message.id === lastAssistantId &&
                    messages.length > 1 &&
                    !message.error && (
                      <MessageFeedback
                        key={`feedback-${message.id}`}
                        message={message}
                        sessionId={sessionIdRef.current}
                        getToken={getToken}
                        onTrack={track}
                      />
                    )}
                </div>
              </div>
            ))}
          </div>

          {handoff && (
            <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3 sm:px-5">
              <p className="text-[11px] font-semibold text-emerald-900">
                ¿Quieres continuar con un asesor?
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={handoff.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("handoff", { source: "button" })}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-800"
                >
                  Abrir WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setHandoff(null)}
                  className="text-[11px] font-medium text-emerald-800 underline underline-offset-2"
                >
                  Ahora no
                </button>
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-brand-line bg-white px-4 pt-3 sm:px-5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-full border border-brand-line bg-brand-sand/60 px-3 py-1.5 text-[11px] font-medium text-brand-charcoal transition hover:border-brand-accent hover:bg-brand-accent-soft hover:text-brand-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-brand-line bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={2000}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  autoResize(event.target);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Escribe tu mensaje..."
                aria-label="Escribe tu mensaje para el asistente"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-brand-line bg-brand-sand/40 px-4 py-3 text-base leading-5 text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:bg-white sm:text-sm"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="Enviar mensaje"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-accent text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-4 text-brand-muted">
              Respuestas generadas con IA. Confirma precios y stock con un asesor.{" "}
              <button
                type="button"
                onClick={() => setLeadOpen(true)}
                className="font-medium text-brand-accent underline underline-offset-2"
              >
                Solicitar asesoría
              </button>
            </p>
          </div>

          {leadOpen && (
            <LeadForm
              onClose={() => setLeadOpen(false)}
              defaultName={userData?.name || user?.user_metadata?.name || ""}
              defaultEmail={user?.email || userData?.email || ""}
              defaultPhone={userData?.phone || ""}
              sessionId={sessionIdRef.current}
              getToken={getToken}
              onTrack={track}
            />
          )}
        </div>
      )}
    </>
  );
}
