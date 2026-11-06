import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HeaderSlider from "../components/HeaderSlider";

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children),
}));

jest.mock("@/components/CertificationSeals", () => ({
  __esModule: true,
  default: () => null,
}), { virtual: true });

jest.mock("@/lib/carousel", () => ({
  buildSlides: () => [
    { position: 1, category: "codigo-de-barras", primary_label: "Ver código de barras" },
    { position: 2, category: "computo-movil", primary_label: "Ver cómputo móvil" },
    { position: 3, category: "rfid", primary_label: "Descubrir RFID" },
    { position: 4, category: "identificacion-pvc", primary_label: "Ver identificación PVC" },
    { position: 5, category: "kioscos-y-pos", primary_label: "Ver kioscos y POS" },
    { position: 6, category: "categoria-personalizada", primary_label: "Ver categoría personalizada" },
  ],
  slideImage: () => "/slide.png",
}), { virtual: true });

describe("enlaces del carrusel", () => {
  it("dirige cada diapositiva a su sección de categoría y mantiene el enlace de contacto", () => {
    const markup = renderToStaticMarkup(React.createElement(HeaderSlider));

    for (const slug of [
      "codigo-de-barras",
      "computo-movil",
      "rfid",
      "identificacion-pvc",
      "kioscos-y-pos",
      "categoria-personalizada",
    ]) {
      expect(markup).toContain(`href="/categoria/${slug}"`);
    }
    expect(markup).toContain('href="/Acerca#contacto"');
    expect(markup).not.toContain("/all-products?category=");
  });
});
