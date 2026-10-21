import { Inter } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
export const metadata = {
  title: "COMPEL | Tecnología para identificar y optimizar tu negocio",
  description: "Soluciones profesionales de código de barras, RFID, identificación PVC y cómputo móvil en Ecuador.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Toaster />
        <AppContextProvider><ConfirmProvider>{children}</ConfirmProvider></AppContextProvider>
      </body>
    </html>
  );
}