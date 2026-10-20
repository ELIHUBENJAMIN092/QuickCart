import { createClient } from "@supabase/supabase-js";

export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function createSupabaseRequestClient(request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authorization },
      },
    }
  );
}

export async function getAuthenticatedSupabase(request) {
  const supabase = createSupabaseRequestClient(request);
  if (!supabase) {
    return { supabase: null, user: null };
  }

  const accessToken = request.headers.get("authorization").slice("Bearer ".length);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
}
