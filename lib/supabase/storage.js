const BUCKET = "product-media";

export async function uploadProductFile(supabase, userId, file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${userId}/${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function validateProductFile(supabase, userId, path, folder, maxSize, mediaType) {
  if (
    typeof path !== "string" ||
    !path.startsWith(`${userId}/${folder}/`) ||
    path.slice(`${userId}/${folder}/`.length).includes("/")
  ) {
    throw new Error("La ruta del archivo no es válida.");
  }

  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const { data, error } = await supabase.storage.from(BUCKET).list(
    `${userId}/${folder}`,
    { search: fileName, limit: 100 }
  );
  if (error) throw error;

  const file = data.find((item) => item.name === fileName);
  if (!file || file.metadata?.size > maxSize || !file.metadata?.mimetype?.startsWith(mediaType)) {
    throw new Error("El archivo subido no cumple el formato o tamaño permitido.");
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function downloadProductFile(supabase, path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export function productMediaPath(url) {
  try {
    const pathname = new URL(url).pathname;
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = pathname.indexOf(marker);
    return index < 0 ? null : decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function removeProductMedia(supabase, urls) {
  const paths = urls.map(productMediaPath).filter(Boolean);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}
