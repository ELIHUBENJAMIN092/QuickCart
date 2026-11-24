import { redirect } from "next/navigation";
import { getSellerSession } from "@/lib/supabase/serverSession";
import SellerShell from "@/components/seller/SellerShell";

export default async function Layout({ children }) {
  const { user, isSeller } = await getSellerSession();

  // Las rutas API siguen validando sesión/rol como segunda capa; aquí solo se protege la UI.
  if (!user || isSeller !== true) {
    redirect("/sign-in");
  }

  return <SellerShell>{children}</SellerShell>;
}
