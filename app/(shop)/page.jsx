import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import FeaturedProduct from "@/components/FeaturedProduct";
import BrandCarousel from "@/components/BrandLogos";
import HomeEditorial from "@/components/home/HomeEditorial";
import { getHomeCarousel } from "@/lib/homeCarousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { slides, certifications } = await getHomeCarousel();

  return (
    <>
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
