import { Inter, Manrope } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import VisitTracker from "@/components/VisitTracker";
import { Toaster } from "react-hot-toast";
import { siteMetadata } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});
export const metadata = siteMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-MQTPNBLR" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <Toaster />
        <VisitTracker />
        <AppContextProvider><ConfirmProvider>{children}</ConfirmProvider></AppContextProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
