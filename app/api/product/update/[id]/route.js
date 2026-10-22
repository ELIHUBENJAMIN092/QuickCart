import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { syncCategories } from "@/lib/categoryServer";
import { categories, isLabelPrinterSubcategory, isValidHttpsUrl, printerTypes } from "@/lib/categories";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";
import { textToSpecifications } from "@/lib/specsText";
import { removeProductMedia, validateProductFile } from "@/lib/supabase/storage";

export async function PUT(request, context) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const category = String(body.category || "");
    const subcategory = String(body.subcategory || "");
    const price = Number(body.price);
    const offerPrice = Number(body.offerPrice);
    const stock = Number(body.stock);
    await syncCategories(supabase);
    const selectedCategory = categories.find((item) => item.slug === category);
    const validSubcategory =
      !subcategory ||
      selectedCategory?.subcategories.some((item) => item.slug === subcategory);
    const imageSlots = Array.isArray(body.imageSlots) ? body.imageSlots : null;
    const videoPath = body.videoPath || "";
    const removeVideo = body.removeVideo === true;
    const catalogPath = body.catalogPath || "";
    const removeCatalog = body.removeCatalog === true;
    const isOffer = body.isOffer === true;
    const isNew = body.isNew === true;
    const model3dUrl = String(body.model3dUrl || "").trim();
    const printerType = isLabelPrinterSubcategory(category, subcategory) ? String(body.printerType || "") : "";

    if (!name || name.length > 160 || !description || description.length > 5000 || !selectedCategory || !validSubcategory) {
      return NextResponse.json({ success: false, message: "Completa los datos y selecciona una categoría válida." }, { status: 400 });
    }
    if (printerType ? !printerTypes.some((item) => item.slug === printerType) : isLabelPrinterSubcategory(category, subcategory)) {
      return NextResponse.json({ success: false, message: "Selecciona el tipo de impresora." }, { status: 400 });
    }
    if (model3dUrl && (model3dUrl.length > 500 || !isValidHttpsUrl(model3dUrl))) {
      return NextResponse.json({ success: false, message: "El enlace 3D debe ser una URL https válida." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(offerPrice) || offerPrice < 0 || offerPrice > price || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ success: false, message: "Revisa los precios y el stock del producto." }, { status: 400 });
    }
    if (!imageSlots || imageSlots.length < 1 || imageSlots.length > 3) {
      return NextResponse.json({ success: false, message: "Cada imagen debe ser válida y pesar máximo 8 MB; puedes subir hasta 3." }, { status: 400 });
    }

    const { data: current, error: readError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) {
      return NextResponse.json({ success: false, message: "Producto no encontrado." }, { status: 404 });
    }

    const currentImages = current.image_urls || [];
    const imageUrls = await Promise.all(imageSlots.map(async (slot) => {
      if (slot?.keep) {
        if (!currentImages.includes(slot.keep)) throw new Error("Imagen no pertenece al producto.");
        return slot.keep;
      }
      return validateProductFile(supabase, user.id, String(slot?.path || ""), "images", 8 * 1024 * 1024, "image/");
    }));
    let videoUrl = removeVideo ? "" : current.video || "";
    if (videoPath) videoUrl = await validateProductFile(supabase, user.id, videoPath, "videos", 100 * 1024 * 1024, "video/");
    let catalogUrl = removeCatalog ? "" : current.catalog_pdf || "";
    if (catalogPath) catalogUrl = await validateProductFile(supabase, user.id, catalogPath, "catalogs", 25 * 1024 * 1024, "application/pdf");
    let brandLogoUrl = body.removeBrandLogo ? "" : current.brand_logo || "";
    if (body.brandLogoPath) brandLogoUrl = await validateProductFile(supabase, user.id, body.brandLogoPath, "brands", 2 * 1024 * 1024, "image/");
    const specifications = textToSpecifications(body.specificationsText);
    const { data: updated, error } = await supabase
      .from("products")
      .update({
        name,
        description,
        category,
        subcategory,
        price,
        offer_price: offerPrice,
        stock,
        image_urls: imageUrls,
        video: videoUrl,
        catalog_pdf: catalogUrl,
        brand_logo: brandLogoUrl,
        specifications,
        is_offer: isOffer,
        is_new: isNew,
        model_3d_url: model3dUrl,
        printer_type: printerType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    const oldMedia = [
      ...currentImages.filter((url) => !imageUrls.includes(url)),
      ...(videoUrl !== current.video && current.video ? [current.video] : []),
      ...(brandLogoUrl !== current.brand_logo && current.brand_logo ? [current.brand_logo] : []),
      ...(catalogUrl !== current.catalog_pdf && current.catalog_pdf ? [current.catalog_pdf] : []),
    ];
    let cleanupPending = false;
    try {
      await removeProductMedia(supabase, oldMedia);
    } catch (cleanupError) {
      cleanupPending = true;
      console.error("No se pudo limpiar el archivo anterior:", cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: cleanupPending
        ? "Producto actualizado; quedó un archivo anterior pendiente de limpieza."
        : "Producto actualizado correctamente.",
      product: mapProduct(updated),
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo actualizar el producto." },
      { status: 500 }
    );
  }
}
