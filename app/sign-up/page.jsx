import AuthForm from "@/components/auth/AuthForm";
import { getAuthHeroImage } from "@/lib/carouselHero";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const heroImage = await getAuthHeroImage();
  return <AuthForm mode="sign-up" heroImage={heroImage} />;
}
