import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const emptySession = { user: null, isSeller: false };

export async function getSellerSession() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Los Server Components no pueden escribir cookies; el refresco lo hace el cliente/middleware.
            }
          },
        },
      }
    );

    // getUser valida el token ante Supabase; getSession no es suficiente en el servidor.
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data?.user) return emptySession;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) return emptySession;

    return { user: data.user, isSeller: profile?.role === "seller" };
  } catch {
    return emptySession;
  }
}
