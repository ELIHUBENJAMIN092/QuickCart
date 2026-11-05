import { buildSlides, slideImage } from "@/lib/carousel";
import { createSupabasePublicClient } from "@/lib/supabase/server";

// Devuelve la imagen de la primera diapositiva del carrusel para usarla como
// fondo de las pantallas de autenticación, sin parpadeo en el primer render.
export async function getAuthHeroImage() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("carousel_slides")
      .select("*")
      .order("position");
    if (error) throw error;

    return slideImage(buildSlides(data)[0]);
  } catch {
    return slideImage(buildSlides()[0]);
  }
}
