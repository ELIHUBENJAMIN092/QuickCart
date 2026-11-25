import Link from "next/link";
import Container from "@/components/ui/Container";
import CookiePreferencesButton from "@/components/CookiePreferencesButton";

const categories = [
  {
    name: "Necesarias",
    status: "Siempre activas",
    description:
      "Son imprescindibles para que la tienda funcione. Permiten mantener tu sesión iniciada, conservar el carrito de compras, recordar preferencias básicas y proteger el sitio frente a usos indebidos.",
    examples: "Sesión de usuario, carrito de compras, seguridad y preferencias de navegación.",
  },
  {
    name: "Analíticas",
    status: "Opcionales",
    description:
      "Nos permiten entender cómo se usa la tienda: qué páginas se visitan, qué productos se consultan y cuánto tiempo permanecen los visitantes. La información se utiliza de forma agregada para mejorar el catálogo y la experiencia de compra.",
    examples: "Google Analytics y Google Tag Manager.",
  },
  {
    name: "Marketing",
    status: "Opcionales",
    description:
      "Se utilizan para mostrar publicidad personalizada, medir el rendimiento de campañas y recordar intereses del visitante en plataformas publicitarias. Si las rechazas, no se usarán con esos fines.",
    examples: "Etiquetas publicitarias y de remarketing cargadas mediante Google Tag Manager.",
  },
];

export default function CookiePolicyPage() {
  return (
    <main>
      <section className="bg-brand-sand">
        <Container className="py-14 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Información legal</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[0.94] text-brand-ink md:text-6xl">
            Política de Cookies
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-brand-charcoal">
            En COMPEL utilizamos cookies y tecnologías similares para que nuestra tienda online funcione, para
            analizar cómo se usa y, solo si nos das tu consentimiento, para fines de marketing. Esta política
            explica qué son, cuáles usamos y cómo puedes cambiar tus preferencias en cualquier momento.
          </p>
          <p className="mt-4 text-xs text-brand-muted">Última actualización: noviembre de 2026.</p>
        </Container>
      </section>

      <Container className="py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-12">
            <section aria-labelledby="que-son">
              <h2 id="que-son" className="font-display text-3xl text-brand-ink">¿Qué son las cookies?</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-brand-charcoal">
                <p>
                  Las cookies son pequeños archivos que un sitio web guarda en tu navegador para recordar
                  información entre visitas. También utilizamos almacenamiento local del navegador para guardar
                  tus preferencias de consentimiento sin enviarlas a nuestros servidores.
                </p>
                <p>
                  Las cookies estrictamente necesarias permiten el funcionamiento de la tienda y no requieren
                  consentimiento. Las cookies analíticas y de marketing son opcionales y solo se activan si las
                  aceptas.
                </p>
              </div>
            </section>

            <section aria-labelledby="categorias">
              <h2 id="categorias" className="font-display text-3xl text-brand-ink">Categorías que utilizamos</h2>
              <div className="mt-6 space-y-4">
                {categories.map((category) => (
                  <article key={category.name} className="border border-brand-line bg-white p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-2xl text-brand-ink">{category.name}</h3>
                      <span
                        className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          category.status === "Siempre activas"
                            ? "bg-brand-accent-soft text-brand-accent"
                            : "bg-brand-sand text-brand-muted"
                        }`}
                      >
                        {category.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-brand-muted">{category.description}</p>
                    <p className="mt-3 text-xs leading-6 text-brand-muted">
                      <span className="font-semibold text-brand-ink">Ejemplos: </span>
                      {category.examples}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="terceros">
              <h2 id="terceros" className="font-display text-3xl text-brand-ink">Cookies de terceros</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-brand-charcoal">
                <p>
                  Cuando aceptas las cookies analíticas o de marketing, podemos cargar herramientas de Google.
                  Estas herramientas pueden establecer sus propias cookies y tratar datos técnicos como la
                  dirección IP, el navegador, el dispositivo y las páginas visitadas.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-ink"
                    >
                      Política de privacidad de Google
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-ink"
                    >
                      Complemento para desactivar Google Analytics
                    </a>
                  </li>
                </ul>
                <p>
                  Si rechazas estas categorías, Google Analytics y Google Tag Manager no se cargan, no se crean
                  cookies de medición y no se envía información a esas plataformas.
                </p>
              </div>
            </section>

            <section aria-labelledby="gestionar">
              <h2 id="gestionar" className="font-display text-3xl text-brand-ink">Cómo gestionar tus preferencias</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-brand-charcoal">
                <p>
                  Puedes aceptar todas las cookies, rechazar las opcionales o elegir categoría por categoría.
                  Tu decisión se guarda en este navegador durante 12 meses o hasta que la modifiques.
                </p>
                <p>
                  Para cambiarla, usa el botón «Configurar cookies» que encontrarás en el pie de página de la
                  tienda o el botón que aparece a continuación.
                </p>
                <CookiePreferencesButton className="inline-flex bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">
                  Configurar cookies
                </CookiePreferencesButton>
                <p>
                  También puedes eliminar o bloquear cookies desde la configuración de tu navegador. Ten en
                  cuenta que bloquear las cookies necesarias puede impedir el inicio de sesión o el uso del
                  carrito de compras.
                </p>
              </div>
            </section>

            <section aria-labelledby="derechos">
              <h2 id="derechos" className="font-display text-3xl text-brand-ink">Tus derechos</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-brand-charcoal">
                <p>
                  De acuerdo con la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, puedes
                  ejercer tus derechos de acceso, rectificación, eliminación, oposición, portabilidad y
                  suspensión del tratamiento de tus datos personales.
                </p>
                <p>
                  Para hacerlo, escríbenos a{" "}
                  <a
                    href="mailto:info@compelecuador.com"
                    className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-ink"
                  >
                    info@compelecuador.com
                  </a>{" "}
                  o visita nuestra página de{" "}
                  <Link
                    href="/acerca#contacto"
                    className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-ink"
                  >
                    contacto
                  </Link>
                  . También puedes consultar la información de la{" "}
                  <a
                    href="https://www.spdp.gob.ec/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-accent underline underline-offset-4 hover:text-brand-ink"
                  >
                    Superintendencia de Protección de Datos Personales
                  </a>
                  .
                </p>
              </div>
            </section>

            <section aria-labelledby="cambios">
              <h2 id="cambios" className="font-display text-3xl text-brand-ink">Cambios en esta política</h2>
              <p className="mt-4 text-sm leading-7 text-brand-charcoal">
                Podemos actualizar esta política cuando cambien las herramientas que utilizamos o la normativa
                aplicable. Publicaremos la versión vigente en esta página e indicaremos la fecha de la última
                actualización.
              </p>
            </section>
          </div>

          <aside className="h-fit border border-brand-line bg-brand-sand p-6 lg:sticky lg:top-8">
            <h2 className="font-display text-2xl text-brand-ink">Resumen rápido</h2>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-brand-muted">
              <li>
                <span className="block font-semibold text-brand-ink">Necesarias</span>
                Siempre activas para que la tienda funcione.
              </li>
              <li>
                <span className="block font-semibold text-brand-ink">Analíticas</span>
                Solo con tu consentimiento. Puedes rechazarlas.
              </li>
              <li>
                <span className="block font-semibold text-brand-ink">Marketing</span>
                Solo con tu consentimiento. Puedes rechazarlas.
              </li>
            </ul>
            <p className="mt-6 border-t border-brand-line pt-4 text-xs leading-6 text-brand-muted">
              ¿Dudas sobre tus datos? Escríbenos a{" "}
              <a href="mailto:info@compelecuador.com" className="font-semibold text-brand-accent">
                info@compelecuador.com
              </a>
              .
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
