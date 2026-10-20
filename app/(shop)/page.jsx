"use client";

import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import FeaturedProduct from "@/components/FeaturedProduct";
import BrandCarousel from "@/components/BrandLogos";
import HomeEditorial from "@/components/home/HomeEditorial";

export default function Home() {
  return (
    <>
      <main>
        <HeaderSlider />
        <FeaturedProduct />
        <HomeProducts />
        <Banner />
        <HomeEditorial />
        <BrandCarousel />
      </main>
    </>
  );
}
