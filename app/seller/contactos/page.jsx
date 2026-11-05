"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, MessageCircle, Plus, Save, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useAppContext } from "@/context/AppContext";
import PageHeader from "@/components/seller/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import {
  formatContactPhone,
  isValidContactPhone,
  normalizeContactPhone,
  whatsappHref,
} from "@/lib/contacts";

const MIGRATION_FILE = "20261104171600_whatsapp_contacts.sql";
const inputClass = "mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-base text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 sm:text-sm";

function ContactCard({ contact, index, total, busy, disabled, onMove, onDelete, onSaved }) {
  const { getToken } = useAppContext();
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);
  const [saving, setSaving] = useState(false);

  const normalizedPhone = normalizeContactPhone(phone);
  const phoneValid = isValidContactPhone(phone);
  const dirty = name.trim() !== contact.name || normalizedPhone !== contact.phone;

  const save = async () => {
    if (!name.trim()) {
      toast.error("El nombre del contacto no puede quedar vacío.");
      return;
    }
    if (!phoneValid) {
      toast.error("Ingresa un celular de Ecuador de 10 dígitos (ej. 0984617873).");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        "/api/contacts",
        { id: contact.id, name: name.trim(), phone: normalizedPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo guardar el contacto.");
      onSaved(data.contact);
      toast.success("Contacto actualizado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar el contacto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`rounded-2xl border border-brand-line bg-white p-3 shadow-sm transition hover:shadow-md sm:p-4 ${busy === contact.id ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-sand text-[10px] font-semibold text-brand-muted">{index + 1}</span>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#25D366]/10 text-[#128C7E]">
            <FaWhatsapp size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-ink">{contact.name}</p>
            <a
              href={whatsappHref(contact.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#128C7E] hover:underline"
            >
              {formatContactPhone(contact.phone)}
            </a>
            <p className="mt-1 text-[11px] leading-4 text-brand-muted">Se muestra en la sección Contacto de Nosotros.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:pt-1">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={disabled || index === 0 || busy !== ""}
            aria-label={`Subir ${contact.name}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none"
          >
            <ArrowUp size={16} /><span className="md:hidden">Subir</span>
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={disabled || index === total - 1 || busy !== ""}
            aria-label={`Bajar ${contact.name}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-ink transition hover:border-brand-accent hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none"
          >
            <ArrowDown size={16} /><span className="md:hidden">Bajar</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(contact)}
            disabled={disabled || busy !== ""}
            aria-label={`Eliminar ${contact.name}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-line text-xs font-medium text-brand-sale transition hover:border-brand-sale hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10 sm:flex-none"
          >
            <Trash2 size={16} /><span className="md:hidden">Eliminar</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-brand-line pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block min-w-0 text-xs font-medium text-brand-charcoal">
          Nombre o área
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} disabled={disabled} className={inputClass} />
        </label>

        <label className="block min-w-0 text-xs font-medium text-brand-charcoal">
          Número de WhatsApp
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={18}
            placeholder="0984617873"
            disabled={disabled}
            aria-invalid={!phoneValid}
            className={`${inputClass} ${phoneValid ? "" : "border-brand-sale focus:border-brand-sale focus:ring-brand-sale/10"}`}
          />
          <span className={`mt-1 block text-[11px] leading-4 ${phoneValid ? "text-brand-muted" : "text-brand-sale"}`}>
            {phoneValid ? `Se abrirá wa.me/593${normalizedPhone.replace(/^0/, "")}` : "Celular de Ecuador de 10 dígitos."}
          </span>
        </label>

        <button
          type="button"
          onClick={save}
          disabled={disabled || !dirty || !phoneValid || saving || busy !== ""}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save size={16} /> {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </li>
  );
}

export default function ContactsPage() {
  const { authLoading, getToken, isSeller } = useAppContext();
  const confirm = useConfirm();
  const [contacts, setContacts] = useState(null);
  const [pendingMigration, setPendingMigration] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadContacts = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/contacts");
      if (!data.success) throw new Error(data.message || "No se pudieron cargar los contactos.");
      setContacts(data.contacts);
      setPendingMigration(Boolean(data.pending));
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "No se pudieron cargar los contactos.");
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadContacts, 0);
    return () => clearTimeout(timeout);
  }, [loadContacts]);

  const addContact = async (event) => {
    event.preventDefault();
    if (!name.trim() || !isValidContactPhone(phone)) {
      toast.error("Ingresa un nombre y un celular de Ecuador de 10 dígitos.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/contacts",
        { name: name.trim(), phone: normalizeContactPhone(phone) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) throw new Error(data.message || "No se pudo agregar el contacto.");

      setName("");
      setPhone("");
      setPendingMigration(false);
      toast.success("Contacto agregado. Ya aparece en Nosotros.");
      await loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo agregar el contacto.");
    } finally {
      setSaving(false);
    }
  };

  const saveContact = (updated) => {
    setContacts((current) => current?.map((item) => item.id === updated.id ? { ...item, ...updated } : item) || current);
  };

  const moveContact = async (index, step) => {
    if (!contacts) return;
    const target = index + step;
    if (target < 0 || target >= contacts.length) return;
    const order = contacts.map((item) => item.id);
    [order[index], order[target]] = [order[target], order[index]];

    setBusy("order");
    try {
      const token = await getToken();
      const { data } = await axios.patch("/api/contacts", { order }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo actualizar el orden.");
      setContacts(data.contacts);
      toast.success("Orden actualizado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo actualizar el orden.");
    } finally {
      setBusy("");
    }
  };

  const deleteContact = async (contact) => {
    const accepted = await confirm({
      title: `¿Eliminar el contacto ${contact.name}?`,
      message: "Se quitará de la sección Contacto de Nosotros.",
      confirmText: "Sí, eliminar",
    });
    if (!accepted) return;

    setBusy(contact.id);
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/contacts", {
        data: { id: contact.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "No se pudo eliminar el contacto.");
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      toast.success(data.message || "Contacto eliminado.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo eliminar el contacto.");
    } finally {
      setBusy("");
    }
  };

  const addPhoneValid = isValidContactPhone(phone);

  if (authLoading) {
    return <main className="flex-1 p-6 text-sm text-brand-muted">Verificando acceso...</main>;
  }
  if (!isSeller) {
    return <main className="flex-1 p-6"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-brand-sale">No tienes permiso para administrar los contactos.</p></main>;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex-1 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          eyebrow="Administración · Contenido"
          title="Contactos"
          description="Administra los números de WhatsApp que se muestran en la sección Contacto de Nosotros. Puedes cambiar el nombre, el número y su orden."
        />

        <form onSubmit={addContact} className="mt-6 rounded-2xl border border-brand-line bg-white p-4 shadow-sm sm:p-5">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            <MessageCircle size={15} className="text-brand-accent" /> Nuevo contacto de WhatsApp
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-start">
            <label className="block text-xs font-medium text-brand-charcoal">
              Nombre o área
              <input
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. COMPEL"
                disabled={pendingMigration}
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-medium text-brand-charcoal">
              Número de WhatsApp
              <input
                required
                type="tel"
                inputMode="tel"
                maxLength={18}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ej. 0984617873"
                disabled={pendingMigration}
                aria-invalid={phone.length > 0 && !addPhoneValid}
                className={`${inputClass} ${phone.length > 0 && !addPhoneValid ? "border-brand-sale focus:border-brand-sale focus:ring-brand-sale/10" : ""}`}
              />
              <span className={`mt-1 block text-[11px] leading-4 ${phone.length > 0 && !addPhoneValid ? "text-brand-sale" : "text-brand-muted"}`}>
                {addPhoneValid ? `Se abrirá wa.me/593${normalizeContactPhone(phone).replace(/^0/, "")}` : "Celular de Ecuador de 10 dígitos."}
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || pendingMigration || !name.trim() || !addPhoneValid}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50 md:mt-6 md:w-auto"
            >
              <Plus size={17} /> {saving ? "Agregando..." : "Agregar contacto"}
            </button>
          </div>
        </form>

        {pendingMigration && (
          <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Falta crear la tabla de contactos.</p>
            <p className="mt-1 text-xs leading-5">Aplica la migración <code className="rounded bg-white px-1 py-0.5">{MIGRATION_FILE}</code> en Supabase para poder agregar, editar y ordenar los números. Mientras tanto se muestran los contactos de ejemplo en la tienda.</p>
          </div>
        )}

        <section className="mt-6" aria-labelledby="contacts-list-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <FaWhatsapp size={19} className="shrink-0 text-[#128C7E]" aria-hidden="true" />
              <h2 id="contacts-list-title" className="truncate font-display text-xl text-brand-ink">Números de WhatsApp</h2>
              {contacts?.length ? <span className="shrink-0 rounded-full bg-brand-sand px-2 py-0.5 text-[10px] font-semibold text-brand-muted">{contacts.length}</span> : null}
            </div>
            <p className="text-[11px] text-brand-muted">El orden se refleja en la sección Contacto de Nosotros.</p>
          </div>

          {loadError ? (
            <div role="alert" className="mt-3 rounded-2xl border border-red-200 bg-white p-5 text-sm text-brand-sale shadow-sm">
              <p>{loadError}</p>
              <button type="button" onClick={loadContacts} className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-brand-line px-4 text-xs font-semibold text-brand-charcoal transition hover:border-brand-sale hover:text-brand-sale">
                Reintentar
              </button>
            </div>
          ) : contacts === null ? (
            <p className="mt-3 rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted shadow-sm">Cargando contactos...</p>
          ) : contacts.length ? (
            <ol className="mt-3 space-y-3">
              {contacts.map((contact, index) => (
                <ContactCard
                  key={`${contact.id}-${contact.updated_at || ""}`}
                  contact={contact}
                  index={index}
                  total={contacts.length}
                  busy={busy}
                  disabled={pendingMigration}
                  onMove={moveContact}
                  onDelete={deleteContact}
                  onSaved={saveContact}
                />
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center">
              <FaWhatsapp size={26} className="mx-auto text-brand-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-brand-ink">Aún no hay contactos</p>
              <p className="mt-1 text-xs text-brand-muted">Agrega el primero desde el formulario de arriba y aparecerá en Nosotros.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
