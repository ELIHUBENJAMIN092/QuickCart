import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import WhatsappFloat from "@/components/seller/WhatsappFloat"; // 👈 importa aquí

const montserrat = Montserrat({ subsets: ['latin'], weight: ["400", "500", "700"] });

export const metadata = {
  title: "Ecommerce_Compel",
  description: "E-Commerce with Next.js ",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${montserrat.className} antialiased text-gray-700`}>
          <Toaster />
          <AppContextProvider>
            {children}
            <WhatsappFloat /> {/* 👈 aquí va el icono flotante */}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
