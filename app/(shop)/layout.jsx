import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";
import WhatsappFloat from "@/components/WhatsappFloat";
import ChatWidget from "@/components/ChatWidget";

export default function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ScrollToTopFloat />
      <WhatsappFloat />
      <ChatWidget />
    </>
  );
}
