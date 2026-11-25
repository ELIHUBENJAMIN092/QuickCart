import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import FeaturedProduct from "@/components/FeaturedProduct";
import BrandCarousel from "@/components/BrandLogos";
import HomeEditorial from "@/components/home/HomeEditorial";
import { getHomeCarousel } from "@/lib/homeCarousel";
import { slideImage } from "@/lib/carousel";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Inicio: soluciones de identificación y cómputo móvil",
  description:
    "Descubre en COMPEL lectores de código de barras, soluciones RFID, impresoras de etiquetas, credenciales PVC y kioscos con asesoría en Ecuador.",
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function Home() {
  const { slides, certifications } = await getHomeCarousel();
  const firstSlideImage = slides?.[0] ? slideImage(slides[0]) : null;
  const hero = typeof firstSlideImage === "string" ? firstSlideImage : firstSlideImage?.src;

  return (
    <>
      {hero && (
        <link
          rel="preload"
          as="image"
          fetchPriority="high"
          href={hero}
        />
      )}
      <main>
        <HeaderSlider initialSlides={slides} initialCertifications={certifications} />
        <FeaturedProduct />
        <HomeProducts />
        <Banner />
        <HomeEditorial />
        <BrandCarousel />
      </main>
    </>
  );
}
