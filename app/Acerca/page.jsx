'use client'
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopFloat from "@/components/ScrollToTopFloat";
import BrandCarousel from "@/components/BrandLogos";

const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16 max-w-4xl mx-auto text-gray-700">
        <h1 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-6">Sobre Nosotros</h1>
        
        <p className="mb-6">
          En <span className="font-semibold">COMPEL</span> nos especializamos en la comercialización de productos eléctricos y electrónicos, brindando soluciones confiables y eficientes a nuestros clientes en todo el Ecuador. A través de nuestro compromiso con la calidad y la innovación, buscamos fortalecer cada proyecto eléctrico con productos duraderos y un servicio personalizado.
        </p>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-2">Misión</h2>
          <p>
            Brindar productos eléctricos y electrónicos de alta calidad que satisfagan las necesidades del mercado ecuatoriano, a través de un servicio eficiente, responsable y enfocado en la satisfacción del cliente.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-2">Visión</h2>
          <p>
            Ser una empresa líder a nivel nacional en la distribución de productos eléctricos, reconocida por su compromiso con la excelencia, la innovación tecnológica y la atención al cliente.
          </p>
        </div>

        <p>
          En COMPEL creemos en el crecimiento sostenible, la mejora continua y el fortalecimiento de las relaciones con nuestros clientes, proveedores y colaboradores. Gracias por confiar en nosotros.
        </p>
      </div>
      <BrandCarousel/>
      <Footer />
      <ScrollToTopFloat />
    </>
  );
};

export default AboutPage;
