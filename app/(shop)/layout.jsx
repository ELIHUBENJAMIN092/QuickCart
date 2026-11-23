import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";
import WhatsappFloat from "@/components/WhatsappFloat";
import ChatWidgetLoader from "@/components/ChatWidgetLoader";
import PopupModal from "@/components/PopupModal";
import { getSiteBanner } from "@/lib/bannerServer";
import { getSitePopup } from "@/lib/popupServer";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }) {
  const [banner, popup] = await Promise.all([getSiteBanner(), getSitePopup()]);

  return (
    <>
      <Navbar initialBanner={banner} />
      {children}
      <Footer />
      <ScrollToTopFloat />
      <WhatsappFloat />
      <ChatWidgetLoader />
      <PopupModal popup={popup} />
    </>
  );
}
