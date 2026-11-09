import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";
import WhatsappFloat from "@/components/WhatsappFloat";
import ChatWidget from "@/components/ChatWidget";
import { getSiteBanner } from "@/lib/bannerServer";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }) {
  const banner = await getSiteBanner();

  return (
    <>
      <Navbar initialBanner={banner} />
      {children}
      <Footer />
      <ScrollToTopFloat />
      <WhatsappFloat />
      <ChatWidget />
    </>
  );
}
