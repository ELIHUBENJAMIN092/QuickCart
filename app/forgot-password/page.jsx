import AuthForm from "@/components/auth/AuthForm";
import { getAuthHeroImage } from "@/lib/carouselHero";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const heroImage = await getAuthHeroImage();
  return <AuthForm mode="forgot-password" heroImage={heroImage} />;
}
