"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { buildContacts, defaultContacts, formatContactPhone, whatsappHref } from "@/lib/contacts";

export default function WhatsAppContacts({ className = "" }) {
  const [contacts, setContacts] = useState(defaultContacts);

  useEffect(() => {
    let active = true;
    fetch("/api/contacts", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active || !data?.success) return;
        const next = buildContacts(data.contacts);
        if (next.length) setContacts(next);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!contacts.length) return null;

  return (
    <ul className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {contacts.map((contact) => (
        <li key={contact.id}>
          <a
            href={whatsappHref(contact.phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribir por WhatsApp al ${formatContactPhone(contact.phone)}`}
            className="group flex h-full items-center gap-4 rounded-xl border border-brand-line bg-white p-5 transition hover:-translate-y-1 hover:border-[#25D366] hover:shadow-lg focus:outline-none focus-visible:border-[#25D366] focus-visible:ring-2 focus-visible:ring-[#25D366]/20"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#25D366]/10 text-[#128C7E] transition group-hover:bg-[#25D366] group-hover:text-white">
              <FaWhatsapp size={24} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-brand-ink">{formatContactPhone(contact.phone)}</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#128C7E]">WhatsApp</span>
            </span>
            <ArrowUpRight
              size={17}
              className="shrink-0 text-brand-line transition group-hover:text-[#128C7E]"
              aria-hidden="true"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
