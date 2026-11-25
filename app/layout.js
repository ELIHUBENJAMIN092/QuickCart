import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import VisitTracker from "@/components/VisitTracker";
import CookieConsent from "@/components/CookieConsent";
import AnalyticsConsent from "@/components/AnalyticsConsent";
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
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <Toaster />
        <VisitTracker />
        <AppContextProvider><ConfirmProvider>{children}</ConfirmProvider></AppContextProvider>
        {/* Google Tag Manager y Google Analytics solo se cargan si el
            visitante aceptó las cookies analíticas o de marketing. */}
        <AnalyticsConsent />
        <CookieConsent />
      </body>
    </html>
  );
}
