import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import { syncCategories } from "@/lib/categoryServer";
import { categories, isLabelPrinterSubcategory, isValidHttpsUrl, printerTypes } from "@/lib/categories";
import { getAuthenticatedSupabase } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/supabase/records";
import { textToSpecifications } from "@/lib/specsText";
import { validateProductFile } from "@/lib/supabase/storage";

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    if (!user || !(await authSeller(supabase, user.id))) {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
    }

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
    const imagePaths = body.imagePaths;
    const videoPath = body.videoPath || "";
    const catalogPath = body.catalogPath || "";
    const isOffer = body.isOffer === true;
    const isNew = body.isNew === true;
    const model3dUrl = String(body.model3dUrl || "").trim();
    const printerType = isLabelPrinterSubcategory(category, subcategory) ? String(body.printerType || "") : "";

    if (!name || name.length > 160 || !description || description.length > 5000 || !selectedCategory || !validSubcategory) {
      return NextResponse.json({ success: false, message: "Completa el nombre, descripción y una categoría válida." }, { status: 400 });
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
    if (!Array.isArray(imagePaths) || imagePaths.length < 1 || imagePaths.length > 3) {
      return NextResponse.json({ success: false, message: "Sube entre 1 y 3 imágenes válidas de máximo 8 MB cada una." }, { status: 400 });
    }

    const imageUrls = await Promise.all(imagePaths.map(async (path) =>
      validateProductFile(supabase, user.id, path, "images", 8 * 1024 * 1024, "image/")
    ));
    const videoUrl = videoPath
      ? await validateProductFile(supabase, user.id, videoPath, "videos", 100 * 1024 * 1024, "video/")
      : "";
    const catalogUrl = catalogPath
      ? await validateProductFile(supabase, user.id, catalogPath, "catalogs", 25 * 1024 * 1024, "application/pdf")
      : "";
    const brandLogoUrl = body.brandLogoPath
      ? await validateProductFile(supabase, user.id, body.brandLogoPath, "brands", 2 * 1024 * 1024, "image/")
      : "";
    const specifications = textToSpecifications(body.specificationsText);

    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
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
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: "Producto agregado.",
      newProduct: mapProduct(data),
    });
  } catch (error) {
    console.error("Error agregando producto:", error);
    return NextResponse.json(
      { success: false, message: "No se pudo guardar el producto." },
      { status: 500 }
    );
  }
}
