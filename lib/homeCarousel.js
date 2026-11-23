import { unstable_cache } from "next/cache";
import { buildSlides } from "@/lib/carousel";
import { buildCertifications, defaultCertifications } from "@/lib/certifications";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Carga en el servidor las diapositivas y los sellos del inicio para que el
// primer render ya muestre las imágenes correctas. Las APIs del admin invalidan
// el tag "home-carousel" cuando cambia el contenido.
export const getHomeCarousel = unstable_cache(
  async () => {
    try {
      const supabase = createSupabasePublicClient();
      const [slidesResult, certificationsResult] = await Promise.all([
        supabase.from("carousel_slides").select("*").order("position"),
        supabase.from("certifications").select("*").order("position"),
      ]);

      return {
        slides: slidesResult.error ? buildSlides() : buildSlides(slidesResult.data),
        certifications: certificationsResult.error
          ? defaultCertifications
          : buildCertifications(certificationsResult.data),
      };
    } catch {
      return { slides: buildSlides(), certifications: defaultCertifications };
    }
  },
  ["home-carousel"],
  { revalidate: 3600, tags: ["home-carousel"] }
);
