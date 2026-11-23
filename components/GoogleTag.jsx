/* eslint-disable @next/next/no-before-interactive-script-outside-document -- En App Router el layout raíz es el lugar soportado para este strategy */
import Script from "next/script";

const GTM_ID = "GTM-MQTPNBLR";

// Etiqueta de Google instalada una sola vez en el layout raíz, por lo que se
// incluye exactamente una vez en todas las páginas.
export default function GoogleTag() {
  return (
    <>
      <Script
        id="google-tag-gtm-loader"
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
        strategy="beforeInteractive"
      />
      <Script id="google-tag-gtm-data-layer" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `}
      </Script>
    </>
  );
}
