"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  CheckCircle2,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";

const STATUS_OPTIONS = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "closed", label: "Cerrado" },
];

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function StatCard({ label, value, icon: Icon, tone = "text-brand-accent" }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</p>
        <Icon size={17} className={tone} aria-hidden="true" />
      </div>
      <p className="mt-2 font-display text-3xl text-brand-ink">{value}</p>
    </div>
  );
}

export default function ChatInboxPage() {
  const { authLoading, getToken, isSeller } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("leads");
  const [busyLead, setBusyLead] = useState("");

  const load = useCallback(async () => {
    if (!isSeller) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const { data: response } = await axios.get("/api/seller/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.success) throw new Error(response.message || "No se pudo cargar la bandeja.");
      setData(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "No se pudo cargar la bandeja.");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSeller]);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const updateLead = async (leadId, status) => {
    setBusyLead(leadId);
    try {
      const token = await getToken();
      const { data: response } = await axios.patch(
        "/api/seller/chat",
        { leadId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.success) throw new Error(response.message || "No se pudo actualizar la solicitud.");
      setData((current) => {
        if (!current) return current;
        const previous = current.leads.find((lead) => lead.id === leadId);
        const wasNew = previous?.status === "new";
        const isNew = status === "new";
        return {
          ...current,
          leads: current.leads.map((lead) => (lead.id === leadId ? response.lead : lead)),
          stats: {
            ...current.stats,
            newLeads: Math.max(0, current.stats.newLeads + (wasNew ? -1 : 0) + (isNew ? 1 : 0)),
          },
        };
      });
      toast.success("Solicitud actualizada.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || requestError.message || "No se pudo actualizar la solicitud.");
    } finally {
      setBusyLead("");
    }
  };

  if (authLoading) {
    return <main className="flex-1 p-6 text-sm text-brand-muted">Verificando acceso...</main>;
  }
  if (!isSeller) {
    return (
      <main className="flex-1 p-6">
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-brand-sale">
          No tienes permiso para ver la bandeja del asistente.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <PageHeader
        eyebrow="Administración · Asistente IA"
        title="Leads y feedback"
        description="Revisa las solicitudes de asesoría, el estado de contacto y las opiniones de los clientes sobre el asistente virtual."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-brand-line bg-white p-1" role="tablist" aria-label="Bandeja del asistente">
          {[
            { id: "leads", label: "Solicitudes", count: data?.stats?.leads },
            { id: "feedback", label: "Feedback", count: (data?.stats?.feedbackUp || 0) + (data?.stats?.feedbackDown || 0) },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === item.id ? "bg-brand-accent text-white" : "text-brand-charcoal hover:bg-brand-sand"
              }`}
            >
              {item.label}
              {item.count != null && <span className="ml-1.5 text-[11px] opacity-80">({item.count})</span>}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      {error ? (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-sm text-brand-sale">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-3 font-semibold underline underline-offset-2">
            Intentar de nuevo
          </button>
        </div>
      ) : loading && !data ? (
        <p className="mt-6 rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted">Cargando bandeja...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Solicitudes" value={data?.stats?.leads ?? 0} icon={Inbox} />
            <StatCard label="Nuevas" value={data?.stats?.newLeads ?? 0} icon={CheckCircle2} tone="text-amber-600" />
            <StatCard label="Conversaciones" value={data?.stats?.conversations ?? 0} icon={MessageSquare} />
            <StatCard label="Feedback útil" value={data?.stats?.feedbackUp ?? 0} icon={ThumbsUp} tone="text-brand-success" />
            <StatCard label="Feedback negativo" value={data?.stats?.feedbackDown ?? 0} icon={ThumbsDown} tone="text-brand-sale" />
          </div>

          <section className="mt-6" aria-label="Embudo de actividad del asistente">
            <h2 className="text-sm font-semibold text-brand-ink">Actividad del asistente</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Mensajes" value={data?.stats?.messageSent ?? 0} icon={MessageSquare} />
              <StatCard label="Recomendaciones" value={data?.stats?.productImpressions ?? 0} icon={Inbox} />
              <StatCard label="Clics en productos" value={data?.stats?.productClicks ?? 0} icon={CheckCircle2} />
              <StatCard label="Añadidos al carrito" value={data?.stats?.addToCart ?? 0} icon={Inbox} />
              <StatCard label="Asesorías solicitadas" value={data?.stats?.leadEvents ?? 0} icon={UserRound} />
              <StatCard label="Derivaciones" value={data?.stats?.handoffs ?? 0} icon={Phone} />
            </div>
            <p className="mt-2 text-[11px] text-brand-muted">
              Conteos de los últimos 90 días; no equivalen a usuarios únicos ni a conversiones de compra.
            </p>
          </section>

          {tab === "leads" ? (
            <section className="mt-6" aria-label="Solicitudes de asesoría">
              {data?.leads?.length ? (
                <div className="space-y-3">
                  {data.leads.map((lead) => (
                    <article key={lead.id} className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-brand-ink">
                            <UserRound size={16} className="text-brand-accent" /> {lead.name}
                          </p>
                          {lead.company && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-muted">
                              <Building2 size={13} /> {lead.company}
                            </p>
                          )}
                        </div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                          Estado
                          <select
                            value={lead.status}
                            onChange={(event) => updateLead(lead.id, event.target.value)}
                            disabled={busyLead === lead.id}
                            className="mt-1 block min-w-32 rounded-lg border border-brand-line bg-white px-2.5 py-1.5 text-xs font-medium text-brand-ink outline-none focus:border-brand-accent disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-charcoal">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-brand-accent hover:underline">
                            <Mail size={13} /> {lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-brand-accent hover:underline">
                            <Phone size={13} /> {lead.phone}
                          </a>
                        )}
                        <span className="text-brand-muted">{formatDate(lead.created_at)}</span>
                      </div>

                      {(lead.interest || lead.volume) && (
                        <p className="mt-3 text-xs text-brand-charcoal">
                          {lead.interest && <><span className="font-semibold">Interés:</span> {lead.interest}</>}
                          {lead.interest && lead.volume && " · "}
                          {lead.volume && <><span className="font-semibold">Volumen:</span> {lead.volume}</>}
                        </p>
                      )}
                      {lead.message && (
                        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-brand-sand/50 p-3 text-xs leading-5 text-brand-charcoal">
                          {lead.message}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center text-sm text-brand-muted">
                  Aún no hay solicitudes de asesoría.
                </p>
              )}
            </section>
          ) : (
            <section className="mt-6" aria-label="Feedback del asistente">
              {data?.feedback?.length ? (
                <div className="space-y-3">
                  {data.feedback.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm md:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            item.rating === "up"
                              ? "bg-brand-success/10 text-brand-success"
                              : "bg-red-50 text-brand-sale"
                          }`}
                        >
                          {item.rating === "up" ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                          {item.rating === "up" ? "Útil" : "No útil"}
                        </span>
                        <span className="text-[11px] text-brand-muted">{formatDate(item.created_at)}</span>
                      </div>
                      {item.comment && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-brand-charcoal">{item.comment}</p>
                      )}
                      {item.message_excerpt && (
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-brand-muted">
                          Respuesta: {item.message_excerpt}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center text-sm text-brand-muted">
                  Aún no hay opiniones sobre el asistente.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
