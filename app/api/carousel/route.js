import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { buildSlides } from "@/lib/carousel";

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.from("carousel_slides").select("*").order("position");
    if (error) throw error;
    return NextResponse.json({ success: true, slides: buildSlides(data) });
  } catch (error) {
    console.error("Error cargando el carrusel:", error);
    return NextResponse.json({ success: true, slides: buildSlides([]) });
  }
}
