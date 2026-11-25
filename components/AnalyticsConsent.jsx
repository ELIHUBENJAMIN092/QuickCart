"use client";

import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useRef, useState } from "react";
import { COOKIE_CONSENT_CHANGE_EVENT, readConsent } from "@/lib/cookieConsent";

const GTM_ID = "GTM-MQTPNBLR";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function deleteCookie(name) {
  const host = window.location.hostname;
  const root = host.split(".").slice(-2).join(".");
  const domains = new Set(["", host, `.${host}`]);
  if (root && root !== host) domains.add(`.${root}`);

  for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
  }
}

function clearAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter(Boolean);

  for (const name of cookieNames) {
    // Cookies propias de Google Analytics / Google Ads y de medición antigua.
    if (/^(_ga|_gid|_gat|_gcl|_gac|__utm)/.test(name)) deleteCookie(name);
  }
}

function updateGoogleConsent(state) {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
  window.gtag("consent", "update", state);
}

export default function AnalyticsConsent() {
  const [consent, setConsent] = useState(null);
  const [resolved, setResolved] = useState(false);
  const wasEnabled = useRef(false);

  useEffect(() => {
    const apply = () => {
      const stored = readConsent();
      setConsent(
        stored
          ? { analytics: stored.analytics === true, marketing: stored.marketing === true }
          : { analytics: false, marketing: false },
      );
      setResolved(true);
    };

    apply();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, apply);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, apply);
  }, []);

  const analyticsAllowed = consent?.analytics === true;
  const marketingAllowed = consent?.marketing === true;
  const enabled = analyticsAllowed || marketingAllowed;

  useEffect(() => {
    if (!resolved) return;

    if (GA_ID) {
      // Bandera oficial de Google Analytics para detener la medición.
      window[`ga-disable-${GA_ID}`] = !analyticsAllowed;
    }

    const consentState = {
      ad_storage: marketingAllowed ? "granted" : "denied",
      ad_user_data: marketingAllowed ? "granted" : "denied",
      ad_personalization: marketingAllowed ? "granted" : "denied",
      analytics_storage: analyticsAllowed ? "granted" : "denied",
    };

    updateGoogleConsent(consentState);

    if (!enabled) {
      // Al retirar el consentimiento, además de desactivar GA, se borran las
      // cookies de medición que ya se hubieran creado en el navegador.
      clearAnalyticsCookies();

      // GTM y GA no se pueden "descargar" de una página ya abierta. Si antes
      // estaban activos, se recarga para que no quede ningún script de Google
      // ejecutándose tras el rechazo.
      if (wasEnabled.current) {
        wasEnabled.current = false;
        window.location.reload();
        return;
      }
    }

    wasEnabled.current = enabled;
  }, [resolved, enabled, analyticsAllowed, marketingAllowed]);

  if (!enabled) return null;

  const consentState = {
    ad_storage: marketingAllowed ? "granted" : "denied",
    ad_user_data: marketingAllowed ? "granted" : "denied",
    ad_personalization: marketingAllowed ? "granted" : "denied",
    analytics_storage: analyticsAllowed ? "granted" : "denied",
  };

  // El consentimiento se declara en el dataLayer antes de cargar GTM, de modo
  // que las etiquetas del contenedor respeten las categorías elegidas.
  const initScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;
    gtag('consent', 'default', ${JSON.stringify(consentState)});
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
    f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
  `;

  return (
    <>
      <Script id="compel-gtm-consent" strategy="afterInteractive">
        {initScript}
      </Script>
      {analyticsAllowed && GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </>
  );
}
