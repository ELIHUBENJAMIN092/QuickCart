import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import FeaturedProduct from "@/components/FeaturedProduct";
import BrandCarousel from "@/components/BrandLogos";
import HomeEditorial from "@/components/home/HomeEditorial";
import { getHomeCarousel } from "@/lib/homeCarousel";
import { slideImage } from "@/lib/carousel";

export const dynamic = "force-dynamic";

const IMAGE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function imageSrcSet(src) {
  return IMAGE_WIDTHS.map((width) =>
    `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=70 ${width}w`
  ).join(", ");
}

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
          href={`/_next/image?url=${encodeURIComponent(hero)}&w=750&q=70`}
          imageSrcSet={imageSrcSet(hero)}
          imageSizes="100vw"
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
