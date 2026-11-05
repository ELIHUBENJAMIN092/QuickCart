import AuthForm from "@/components/auth/AuthForm";
import { getAuthHeroImage } from "@/lib/carouselHero";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const heroImage = await getAuthHeroImage();
  return <AuthForm mode="update-password" heroImage={heroImage} />;
}
