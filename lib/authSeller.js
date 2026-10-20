const authSeller = async (supabase, userId) => {
  if (!supabase || !userId) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al verificar permisos de vendedor:", error);
    return false;
  }

  return data?.role === "seller";
};

export default authSeller;