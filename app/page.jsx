'use client'
import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandCarousel from "@/components/BrandLogos";
import BannerOferta from "@/components/BannerOferta";

const Home = () => {
  return (
    <>
      {/* Navbar principal */}
      <Navbar />

      {/* Contenido principal de la página */}
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <HomeProducts />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>

      {/* Carrusel de marcas */}
      <BrandCarousel />

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Home;
