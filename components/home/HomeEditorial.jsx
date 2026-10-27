import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headset, Layers3, Truck } from "lucide-react";
import familia from "@/assets/familia.jpg";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const benefits = [
  { icon: Layers3, title: "Tecnología probada", text: "Equipos de alto rendimiento para operaciones profesionales." },
  { icon: BadgeCheck, title: "Garantía y repuestos", text: "Productos originales con respaldo y garantía." },
  { icon: Headset, title: "Soporte local", text: "Asesoría especializada antes y después de tu compra." },
  { icon: Truck, title: "Envíos nacionales", text: "Coordinamos entregas a todo el Ecuador." },
];

const testimonials = [
  { quote: "Un equipo que entiende nuestras necesidades y nos ayudó a optimizar la operación.", author: "Equipo de operaciones", company: "Cliente COMPEL" },
  { quote: "La asesoría y el soporte hicieron sencilla la implementación de nuestra solución.", author: "Área de tecnología", company: "Cliente COMPEL" },
  { quote: "Encontramos los equipos adecuados y el acompañamiento que necesitábamos.", author: "Administración", company: "Cliente COMPEL" },
];

export default function HomeEditorial() {
  return (
    <>
      <section className="bg-white py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="Por qué COMPEL"
            title="Respaldo real, no solo equipos."
            description="Combinamos producto, conocimiento técnico y servicio local para que cada implementación funcione desde el primer día."
          />
          <div className="grid items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[320px] overflow-hidden border border-brand-line bg-brand-sand md:min-h-[440px]">
              <Image src={familia} alt="Familia de productos COMPEL" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-8 md:p-12" />
              <span className="absolute bottom-0 left-0 h-1 w-28 bg-brand-accent" />
            </div>
            <div className="grid gap-px border border-brand-line bg-brand-line sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="flex flex-col bg-white p-7 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">0{index + 1}</span>
                    <Icon size={20} className="text-brand-accent" />
                  </div>
                  <h3 className="mt-8 font-display text-xl text-brand-ink md:text-2xl">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-brand-muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-brand-ink py-16 text-brand-cream md:py-20">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-hover">Una solución para cada reto</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl leading-[0.98] md:text-5xl">Haz que tu operación avance con COMPEL.</h2>
          </div>
          <Link href="/all-products" className="inline-flex shrink-0 items-center gap-2 bg-white px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-ink transition hover:bg-brand-accent hover:text-white">Explorar soluciones <span aria-hidden="true">→</span></Link>
        </Container>
      </section>

      <section className="overflow-hidden bg-brand-sand/50 py-16 md:py-24">
        <Container>
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">La confianza se construye juntos</p>
            <h2 className="mt-3 font-display text-3xl leading-[0.98] text-brand-ink md:text-5xl">Acompañamos a negocios como el tuyo.</h2>
          </div>
          <div className="overflow-hidden pb-3">
            <div className="animate-scroll flex w-max gap-5">
            {[...testimonials, ...testimonials].map((item, index) => (
              <figure key={`${item.author}-${index}`} className="w-[300px] shrink-0 border border-brand-line bg-white p-6 md:w-[380px] md:p-8">
                <div className="mb-5 text-brand-accent" aria-label="5 de 5 estrellas">★★★★★</div>
                <blockquote className="font-display text-xl leading-8 text-brand-ink">“{item.quote}”</blockquote>
                <figcaption className="mt-7 border-t border-brand-line pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{item.author}<span className="mx-2">·</span>{item.company}</figcaption>
              </figure>
            ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
