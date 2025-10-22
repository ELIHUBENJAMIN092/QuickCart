import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import WhatsappFloat from "@/components/seller/WhatsappFloat";
import BannerOferta from "@/components/BannerOferta"; // <-- Importa tu banner

const montserrat = Montserrat({ subsets: ['latin'], weight: ["400", "500", "700"] });

export const metadata = {
  title: "Ecommerce_Compel",
  description: "E-Commerce with Next.js ",
};

const localization = {
  signIn: {
    start: {
      title: "Inicia sesión en Ecommerce_Compel",
      subtitle: "Accede con tu cuenta o correo electrónico",
      emailLabel: "Correo electrónico",
      continueButton: "Continuar",
      noAccount: "¿No tienes cuenta?",
      signUpLink: "Regístrate aquí"
    }
  },
  signUp: {
    start: {
      title: "Crea tu cuenta",
      subtitle: "Regístrate para comenzar",
      emailLabel: "Correo electrónico",
      continueButton: "Continuar"
    }
  }
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={localization}>
      <html lang="es">
        <body className={`${montserrat.className} antialiased text-gray-700`}>
          <Toaster />
          <AppContextProvider>
            {/* Banner de ofertas en la parte superior */}
            <BannerOferta />

            {/* Contenido principal */}
            {children}

            {/* Botón flotante de WhatsApp */}
            <WhatsappFloat />
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
