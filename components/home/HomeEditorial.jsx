import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headset, Layers3, Truck } from "lucide-react";
import familia from "@/assets/familia.jpg";
import Container from "@/components/ui/Container";

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
      <section className="bg-gray-100 py-14 md:py-20">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-3">
            <div className="space-y-7 lg:pr-4">
              {benefits.slice(0, 2).map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand-ink ring-1 ring-gray-300"><Icon size={20} /></span>
                  <div><h3 className="text-xl font-bold text-gray-900">{title}</h3><p className="mt-1 text-base leading-7 text-gray-700">{text}</p></div>
                </article>
              ))}
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
              <Image src={familia} alt="Familia de productos COMPEL" fill sizes="(max-width: 1024px) 80vw, 30vw" className="object-contain p-4" />
            </div>
            <div className="space-y-7 lg:pl-4">
              {benefits.slice(2).map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand-ink ring-1 ring-gray-300"><Icon size={20} /></span>
                  <div><h3 className="text-xl font-bold text-gray-900">{title}</h3><p className="mt-1 text-base leading-7 text-gray-700">{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-brand-ink py-14 text-brand-cream md:py-20">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Una solución para cada reto</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight md:text-5xl">Haz que tu operación avance con COMPEL.</h2>
          </div>
          <Link href="/all-products" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-cream px-6 py-3 text-sm font-semibold text-brand-ink transition hover:bg-white">Explorar soluciones <span aria-hidden="true">→</span></Link>
        </Container>
      </section>

      <section className="overflow-hidden py-14 md:py-20">
        <Container>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">La confianza se construye juntos</p>
            <h2 className="mt-3 font-display text-3xl text-brand-ink md:text-4xl">Acompañamos a negocios como el tuyo.</h2>
          </div>
          <div className="overflow-hidden pb-3">
            <div className="animate-scroll flex w-max gap-5">
            {[...testimonials, ...testimonials].map((item, index) => (
              <figure key={`${item.author}-${index}`} className="w-[300px] shrink-0 border border-brand-line bg-white p-6 md:w-[360px] md:p-8">
                <div className="mb-4 text-brand-accent" aria-label="5 de 5 estrellas">★★★★★</div>
                <blockquote className="font-display text-xl leading-7 text-brand-ink">“{item.quote}”</blockquote>
                <figcaption className="mt-6 text-xs text-brand-muted">{item.author}<span className="mx-2">·</span>Testimonio de ejemplo</figcaption>
              </figure>
            ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
