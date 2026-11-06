"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Activity,
  Ban,
  Eye,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { describeReferrer, describeUserAgent, isValidIp } from "@/lib/visits";

const MIGRATION_FILE = "20261106120000_site_visits.sql";
const RANGE_OPTIONS = [
  { days: 1, label: "24 h" },
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];
const inputClass =
  "w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10";

const dateFormatter = new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" });

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function timeAgo(value) {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - date) / 1000));
  if (seconds < 60) return "hace un momento";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

function StatCard({ label, value, note, icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "bg-brand-accent-soft text-brand-accent",
    danger: "bg-red-50 text-brand-sale",
    success: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</p>
          <p className="mt-2 font-display text-2xl leading-none text-brand-ink">{value}</p>
          {note && <p className="mt-2 text-[11px] leading-4 text-brand-muted">{note}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone] || tones.accent}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function BlockModal({ target, reason, busy, onChange, onClose, onSubmit }) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Bloquear dirección IP">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm" />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="relative w-full max-w-md rounded-2xl border border-brand-line bg-white p-5 shadow-2xl"
      >
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-sale">
          <Ban size={15} /> Bloquear acceso
        </p>
        <h2 className="mt-2 font-display text-xl text-brand-ink">{target.ip}</h2>
        <p className="mt-1 text-xs leading-5 text-brand-muted">
          Se registraron {target.count} {target.count === 1 ? "visita" : "visitas"} desde esta dirección en el periodo seleccionado.
        </p>

        <label className="mt-4 block text-xs font-medium text-brand-charcoal">
          Motivo (opcional)
          <input
            value={reason}
            onChange={(event) => onChange(event.target.value)}
            maxLength={200}
            placeholder="Ej. Tráfico repetido sin conversión"
            className={`${inputClass} mt-2`}
          />
        </label>

        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
          Una IP puede ser compartida por varias personas (oficina, operador móvil o red pública). Bloquéala solo si estás seguro.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-line px-4 text-sm font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-sale px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Ban size={16} /> {busy ? "Bloqueando..." : "Bloquear IP"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VisitsPage() {
  const { authLoading, getToken, isSeller } = useAppContext();
  const confirm = useConfirm();

  const [visits, setVisits] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [days, setDays] = useState(7);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pendingMigration, setPendingMigration] = useState(false);
  const [busy, setBusy] = useState("");
  const [clearing, setClearing] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [reason, setReason] = useState("");

  const loadVisits = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
        const { data } = await axios.get("/api/visits", {
          params: { days, limit: 300, search: search || undefined },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data.success) {
          if (data.code === "MIGRATION_REQUIRED") setPendingMigration(true);
          throw new Error(data.message || "No se pudieron cargar las visitas.");
        }
        setVisits(data.visits || []);
        setBlocked(data.blocked || []);
        setPendingMigration(false);
        setError("");
      } catch (requestError) {
        if (requestError.response?.data?.code === "MIGRATION_REQUIRED") setPendingMigration(true);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "No se pudieron cargar las visitas."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days, getToken, search]
  );

  useEffect(() => {
    if (authLoading || !isSeller) return undefined;
    const timeout = setTimeout(() => loadVisits(), 0);
    return () => clearTimeout(timeout);
  }, [authLoading, isSeller, loadVisits]);

  useEffect(() => {
    if (authLoading || !isSeller) return undefined;
    const interval = setInterval(() => loadVisits({ silent: true }), 60000);
    return () => clearInterval(interval);
  }, [authLoading, isSeller, loadVisits]);

  const blockedSet = useMemo(() => new Set(blocked.map((item) => item.ip)), [blocked]);

  const stats = useMemo(() => {
    const uniqueIps = new Set(visits.map((visit) => visit.ip));
    const pathCounts = new Map();
    for (const visit of visits) pathCounts.set(visit.path, (pathCounts.get(visit.path) || 0) + 1);
    const topPath = [...pathCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total: visits.length,
      unique: uniqueIps.size,
      blocked: blocked.length,
      topPath: topPath ? topPath[0] : "—",
      topPathCount: topPath ? topPath[1] : 0,
    };
  }, [visits, blocked]);

  const topIps = useMemo(() => {
    const map = new Map();
    for (const visit of visits) {
      const entry = map.get(visit.ip) || { ip: visit.ip, count: 0, last: visit.created_at, paths: new Set() };
      entry.count += 1;
      if (new Date(visit.created_at).getTime() > new Date(entry.last).getTime()) entry.last = visit.created_at;
      entry.paths.add(visit.path);
      map.set(visit.ip, entry);
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((entry) => ({ ...entry, pathCount: entry.paths.size }));
  }, [visits]);

  const openBlock = (ip) => {
    const target = topIps.find((entry) => entry.ip === ip) || {
      ip,
      count: visits.filter((visit) => visit.ip === ip).length,
    };
    setReason("");
    setBlockTarget(target);
  };

  const handleActionError = (actionError, fallback) => {
    if (actionError.response?.data?.code === "MIGRATION_REQUIRED") setPendingMigration(true);
    toast.error(actionError.response?.data?.message || actionError.message || fallback);
  };

  const submitBlock = async () => {
    if (!blockTarget || !isValidIp(blockTarget.ip)) return;
    setBusy(blockTarget.ip);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/blocked-ips",
        { ip: blockTarget.ip, reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo bloquear la IP.");
      toast.success(data.message || "IP bloqueada.");
      setBlockTarget(null);
      setReason("");
      await loadVisits({ silent: true });
    } catch (actionError) {
      handleActionError(actionError, "No se pudo bloquear la IP.");
    } finally {
      setBusy("");
    }
  };

  const unblock = async (ip) => {
    const accepted = await confirm({
      title: `¿Desbloquear la IP ${ip}?`,
      message: "Esta dirección podrá volver a entrar al sitio.",
      confirmText: "Sí, desbloquear",
    });
    if (!accepted) return;

    setBusy(ip);
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/blocked-ips", {
        data: { ip },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo desbloquear la IP.");
      toast.success(data.message || "IP desbloqueada.");
      await loadVisits({ silent: true });
    } catch (actionError) {
      handleActionError(actionError, "No se pudo desbloquear la IP.");
    } finally {
      setBusy("");
    }
  };

  const clearVisits = async (keepDays) => {
    const accepted = await confirm({
      title: keepDays ? `¿Borrar visitas de más de ${keepDays} días?` : "¿Borrar todo el historial de visitas?",
      message: keepDays
        ? "Se eliminarán los registros antiguos. Las IPs bloqueadas se conservan."
        : "Se eliminarán todos los registros de visitas. Las IPs bloqueadas se conservan.",
      confirmText: "Sí, borrar",
    });
    if (!accepted) return;

    setClearing(true);
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/visits", {
        params: keepDays ? { days: keepDays } : {},
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo limpiar el historial.");
      toast.success(data.message || "Historial actualizado.");
      await loadVisits({ silent: true });
    } catch (actionError) {
      handleActionError(actionError, "No se pudo limpiar el historial.");
    } finally {
      setClearing(false);
    }
  };

  if (authLoading) {
    return <main className="flex-1 p-6 text-sm text-brand-muted">Verificando acceso...</main>;
  }
  if (!isSeller) {
    return (
      <main className="flex-1 p-6">
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-brand-sale">
          No tienes permiso para ver el monitoreo del sitio.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          eyebrow="Administración · Monitoreo"
          title="Visitas al sitio"
          description="Revisa desde qué direcciones IP se entra a la página, qué rutas se visitan y bloquea el tráfico repetitivo que no genere valor."
          actions={
            <button
              type="button"
              onClick={() => loadVisits({ silent: true })}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-line bg-white px-4 text-sm font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-40"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualizar
            </button>
          }
        />

        {pendingMigration && (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Falta aplicar la migración de la base de datos.</p>
            <p className="mt-1">
              Ejecuta el archivo <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">{MIGRATION_FILE}</code> en el
              SQL Editor de Supabase para activar el registro de visitas y el bloqueo de IPs.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-brand-sale">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visitas registradas"
            value={stats.total.toLocaleString("es-EC")}
            note="Máximo 300 registros del periodo"
            icon={Activity}
          />
          <StatCard
            label="IPs únicas"
            value={stats.unique.toLocaleString("es-EC")}
            note="Direcciones distintas detectadas"
            icon={Users}
            tone="success"
          />
          <StatCard
            label="IPs bloqueadas"
            value={stats.blocked.toLocaleString("es-EC")}
            note="No pueden abrir la tienda"
            icon={Ban}
            tone="danger"
          />
          <StatCard
            label="Ruta más visitada"
            value={stats.topPath}
            note={stats.topPathCount ? `${stats.topPathCount} visitas` : "Sin datos"}
            icon={Eye}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setDays(option.days)}
                aria-pressed={days === option.days}
                className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition ${
                  days === option.days
                    ? "bg-brand-accent text-white shadow-sm shadow-brand-accent/25"
                    : "bg-brand-sand/70 text-brand-charcoal hover:bg-brand-sand"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
              }}
              className="relative min-w-0 sm:w-64"
            >
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar IP o ruta..."
                className={`${inputClass} pl-9`}
              />
            </form>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="min-h-10 rounded-lg border border-brand-line px-3 text-xs font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <section className="min-w-0 rounded-2xl border border-brand-line bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-line px-4 py-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <Globe2 size={16} className="text-brand-accent" /> Registro de visitas
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => clearVisits(30)}
                  disabled={clearing}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-brand-line px-2.5 text-[11px] font-medium text-brand-charcoal transition hover:border-brand-sale hover:text-brand-sale disabled:opacity-40"
                >
                  <Trash2 size={13} /> Borrar +30 días
                </button>
                <button
                  type="button"
                  onClick={() => clearVisits(0)}
                  disabled={clearing}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-brand-line px-2.5 text-[11px] font-medium text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 size={13} /> Borrar todo
                </button>
              </div>
            </div>

            {loading ? (
              <p role="status" className="px-4 py-10 text-center text-sm text-brand-muted">
                Cargando visitas...
              </p>
            ) : visits.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-brand-muted">
                No hay visitas registradas en este periodo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-line text-[10px] uppercase tracking-[0.14em] text-brand-muted">
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">IP</th>
                      <th className="px-4 py-3 font-semibold">Ruta</th>
                      <th className="px-4 py-3 font-semibold">Origen</th>
                      <th className="px-4 py-3 font-semibold">Dispositivo</th>
                      <th className="px-4 py-3 font-semibold">Ubicación</th>
                      <th className="px-4 py-3 text-right font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((visit) => {
                      const isBlocked = blockedSet.has(visit.ip);
                      const location = [visit.city, visit.country].filter(Boolean).join(", ");
                      return (
                        <tr key={visit.id} className="border-b border-brand-line/70 last:border-0 hover:bg-brand-sand/30">
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{formatDate(visit.created_at)}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand-ink">{visit.ip}</td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-xs text-brand-charcoal" title={visit.path}>
                            {visit.path}
                          </td>
                          <td className="px-4 py-3 text-xs text-brand-muted">{describeReferrer(visit.referrer)}</td>
                          <td className="px-4 py-3 text-xs text-brand-muted">{describeUserAgent(visit.user_agent)}</td>
                          <td className="px-4 py-3 text-xs text-brand-muted">
                            {location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} /> {location}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {isBlocked ? (
                              <button
                                type="button"
                                onClick={() => unblock(visit.ip)}
                                disabled={busy === visit.ip}
                                className="rounded-lg border border-brand-line px-2.5 py-1.5 text-[11px] font-medium text-brand-muted transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-40"
                              >
                                Desbloquear
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openBlock(visit.ip)}
                                disabled={busy === visit.ip}
                                className="rounded-lg border border-brand-line px-2.5 py-1.5 text-[11px] font-medium text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:opacity-40"
                              >
                                Bloquear
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <Activity size={16} className="text-brand-accent" /> Direcciones más activas
              </p>
              <p className="mt-1 text-[11px] leading-4 text-brand-muted">
                Si una IP entra muchas veces sin navegar ni comprar, considera bloquearla.
              </p>

              <ul className="mt-3 space-y-2">
                {topIps.length === 0 && <li className="text-xs text-brand-muted">Sin datos para el periodo.</li>}
                {topIps.map((entry) => {
                  const isBlocked = blockedSet.has(entry.ip);
                  return (
                    <li key={entry.ip} className="rounded-xl border border-brand-line bg-brand-sand/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold text-brand-ink">{entry.ip}</p>
                          <p className="mt-1 text-[11px] text-brand-muted">
                            {entry.count} {entry.count === 1 ? "visita" : "visitas"} · {entry.pathCount}{" "}
                            {entry.pathCount === 1 ? "ruta" : "rutas"} · {timeAgo(entry.last)}
                          </p>
                        </div>
                        {isBlocked ? (
                          <button
                            type="button"
                            onClick={() => unblock(entry.ip)}
                            disabled={busy === entry.ip}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-line bg-white px-2 py-1.5 text-[11px] font-medium text-brand-muted transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-40"
                          >
                            <ShieldCheck size={12} /> Desbloquear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBlock(entry.ip)}
                            disabled={busy === entry.ip}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-line bg-white px-2 py-1.5 text-[11px] font-medium text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:opacity-40"
                          >
                            <Ban size={12} /> Bloquear
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <Ban size={16} className="text-brand-sale" /> IPs bloqueadas
              </p>
              {blocked.length === 0 ? (
                <p className="mt-3 text-xs text-brand-muted">Todavía no has bloqueado ninguna dirección.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {blocked.map((item) => (
                    <li key={item.ip} className="rounded-xl border border-brand-line p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold text-brand-ink">{item.ip}</p>
                          <p className="mt-1 text-[11px] leading-4 text-brand-muted">
                            {item.reason || "Sin motivo registrado"} · {formatDate(item.created_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => unblock(item.ip)}
                          disabled={busy === item.ip}
                          className="shrink-0 rounded-lg border border-brand-line px-2 py-1.5 text-[11px] font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-40"
                        >
                          Desbloquear
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="rounded-2xl border border-brand-line bg-brand-sand/40 p-4 text-[11px] leading-5 text-brand-muted">
              El bloqueo se aplica a la dirección IP pública. Puede afectar a varias personas que compartan la misma
              conexión. La ubicación aproximada solo aparece cuando el sitio se publica en Vercel.
            </p>
          </div>
        </div>
      </div>

      <BlockModal
        target={blockTarget}
        reason={reason}
        busy={busy === blockTarget?.ip}
        onChange={setReason}
        onClose={() => setBlockTarget(null)}
        onSubmit={submitBlock}
      />
    </main>
  );
}
