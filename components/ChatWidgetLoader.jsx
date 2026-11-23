"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

// Carga el chat flotante cuando el navegador está libre, para no competir con
// el contenido principal durante la primera pintura de la página.
export default function ChatWidgetLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  return ready ? <ChatWidget /> : null;
}
