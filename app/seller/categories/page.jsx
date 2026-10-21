"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { categories, parseSubcategories, subcategoriesToText } from "@/lib/categories";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadProductFile } from "@/lib/supabase/storage";
import { optimizeImage } from "@/lib/imageOptimize";

const inputClass = "mt-2 w-full rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent";

function CategoryEditor({ category, position, isNew = false, onSaved, onCancel }) {
  const { getToken, user } = useAppContext();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    position: position,
    subs: subcategoriesToText(category?.subcategories),
  });
  const [file, setFile] = useState(null);
  const [resetImage, setResetImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const currentImage = resetImage ? category?.image : category?.image_url || category?.image;
  const preview = filePreview || currentImage;

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    if (file && !file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const optimized = file ? await optimizeImage(file, { maxSide: 1600 }) : null;
      if (optimized && optimized.size > 8 * 1024 * 1024) {
        toast.error("La imagen pesa más de 8 MB. Usa una más pequeña.");
        return;
      }
      const imagePath = optimized ? await uploadProductFile(createSupabaseBrowserClient(), user.id, optimized, "categories") : "";
      const payload = {
        name: form.name,
        description: form.description,
        position: Number(form.position) || 0,
        subcategories: parseSubcategories(form.subs, category?.subcategories),
        imagePath,
        resetImage,
      };
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = isNew
        ? await axios.post("/api/categories", payload, { headers })
        : await axios.put(`/api/categories/${category.slug}`, payload, { headers });
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      setFile(null);
      setResetImage(false);
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const accepted = await confirm({
      title: "¿Eliminar esta categoría?",
      message: `Se eliminará «${category.name}» con sus subcategorías. Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
    });
    if (!accepted) return;
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/categories/${category.slug}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "No se pudo eliminar.");
    }
  };

  return (
    <form onSubmit={save} className="grid gap-6 rounded-xl border border-brand-line bg-white p-5 md:grid-cols-[260px_1fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-line bg-brand-sand">
          {preview ? <Image src={preview} alt="" fill unoptimized={Boolean(filePreview)} sizes="260px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-brand-muted">Sin imagen</span>}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand-line px-3 py-2.5 text-xs font-medium text-brand-accent hover:border-brand-accent">
          <ImagePlus size={16} /> {file ? file.name : "Cambiar lámina"}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setResetImage(false); }} />
        </label>
        {!isNew && category?.image_url && !file && !resetImage && (
          <button type="button" onClick={() => setResetImage(true)} className="mt-2 block w-full text-center text-xs text-brand-sale hover:underline">Quitar lámina personalizada</button>
        )}
        <p className="mt-2 text-[11px] leading-4 text-brand-muted">Recomendado: imagen horizontal 4:3, máximo 8 MB.</p>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
          <label className="block text-xs font-medium text-brand-charcoal">Título
            <input required maxLength={60} value={form.name} onChange={update("name")} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-brand-charcoal">Orden
            <input type="number" min="0" value={form.position} onChange={update("position")} className={inputClass} />
          </label>
        </div>
        <label className="block text-xs font-medium text-brand-charcoal">Descripción (subtítulo)
          <textarea rows={2} maxLength={200} value={form.description} onChange={update("description")} className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-brand-charcoal">Subcategorías <span className="font-normal text-brand-muted">(una por línea; escribe «- » antes para que sea hija de la de arriba)</span>
          <textarea rows={7} value={form.subs} onChange={update("subs")} placeholder={"Impresoras\nSuministros\n- Etiquetas\n- Cintas"} className={`${inputClass} font-mono`} />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {isNew ? <span /> : (
            <button type="button" onClick={remove} className="inline-flex items-center gap-2 text-xs text-brand-sale hover:underline"><Trash2 size={14} /> Eliminar categoría</button>
          )}
          <div className="flex gap-3">
            {isNew && <button type="button" onClick={onCancel} className="rounded-full border border-brand-line px-5 py-2.5 text-sm text-brand-charcoal hover:bg-brand-cream">Cancelar</button>}
            <button type="submit" disabled={saving} className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:cursor-wait disabled:opacity-60">{saving ? "Guardando..." : isNew ? "Crear categoría" : "Guardar cambios"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function CategoriesAdmin() {
  const { fetchCategories } = useAppContext();
  const [adding, setAdding] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const reload = async () => {
    await fetchCategories();
    setAdding(false);
    setRefresh((value) => value + 1);
  };

  return (
    <div className="flex-1 p-4 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-brand-ink">Categorías</h1>
            <p className="mt-2 text-sm text-brand-muted">Estas categorías aparecen en el inicio, el menú, el pie de página y al crear productos.</p>
          </div>
          {!adding && (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-hover"><Plus size={16} /> Nueva categoría</button>
          )}
        </div>

        <div className="mt-8 space-y-6" key={refresh}>
          {adding && <CategoryEditor isNew position={categories.length + 1} onSaved={reload} onCancel={() => setAdding(false)} />}
          {categories.map((category, index) => (
            <CategoryEditor key={`${category.slug}-${refresh}`} category={category} position={index + 1} onSaved={reload} />
          ))}
        </div>
      </div>
    </div>
  );
}
