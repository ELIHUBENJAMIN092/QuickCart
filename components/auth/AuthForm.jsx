"use client";

import Link from "next/link";
import Image from "next/image";
import { assets } from "@/assets/assets";
import logoCompel from "@/assets/logo_compel.png";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }) {
  const isSignUp = mode === "sign-up";
  const isForgotPassword = mode === "forgot-password";
  const isUpdatePassword = mode === "update-password";
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        toast.success("Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
      } else if (isUpdatePassword) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Contraseña actualizada.");
        router.push("/sign-in");
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/sign-in`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Revisa tu correo para confirmar la cuenta.");
          router.push("/sign-in");
        } else {
          toast.success("Cuenta creada.");
          router.push("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada.");
        router.push("/");
      }
    } catch (error) {
      toast.error(error.message || "No se pudo completar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(error.message || "No se pudo iniciar con Google.");
      setSubmitting(false);
    }
  };

  const showGoogle = mode === "sign-in" || isSignUp;

  const title = isSignUp ? "Crear cuenta" : isForgotPassword ? "Recuperar contraseña" : isUpdatePassword ? "Elegir contraseña nueva" : "Iniciar sesión";
  const subtitle = isSignUp
    ? "Regístrate para ver precios, guardar tu carrito y seguir tus pedidos."
    : isForgotPassword
      ? "Te enviaremos un enlace para restablecer tu contraseña."
      : isUpdatePassword
        ? "Escribe una contraseña nueva para tu cuenta."
        : "Accede para ver precios, disponibilidad y el estado de tus pedidos.";
  const inputClass = "mt-1.5 w-full rounded-lg border border-brand-line bg-white px-4 py-3.5 text-base text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 lg:justify-end lg:px-[8vw]">
      <Image src={assets.codigo_barras} alt="" fill priority sizes="100vw" className="object-cover object-[30%_center]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A6F]/85 via-[#0069FF]/55 to-[#3BA6EF]/40" aria-hidden="true" />
      <Link href="/" aria-label="Ir al inicio" className="absolute bottom-8 left-8 hidden lg:block">
        <Image className="w-44 brightness-[2.2] saturate-[0.8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" src={logoCompel} alt="COMPEL" priority />
      </Link>

      <section className="relative z-10 w-full max-w-md">
        <h2 className="mb-6 hidden text-center font-display text-2xl font-bold uppercase leading-tight text-white drop-shadow lg:block xl:text-3xl">
          Identificación, código de barras y RFID<br /><span className="font-semibold">para tu negocio.</span>
        </h2>
        <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-2xl bg-[#04132F]/95 p-6 text-white shadow-2xl backdrop-blur sm:p-9">
          <div>
            <Link href="/" aria-label="Ir al inicio" className="mb-6 flex justify-center">
              <Image className="w-44 brightness-[2.2] saturate-[0.8]" src={logoCompel} alt="COMPEL" priority />
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300 text-center">Cuenta COMPEL</p>
            <h1 className="mt-2 text-center font-display text-3xl leading-[1] text-white sm:text-4xl lg:mt-0">{title}</h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-white/70">{subtitle}</p>
          </div>
        {isSignUp && (
          <label className="block text-sm font-medium text-white/90">
            Nombre
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
        )}
        {!isUpdatePassword && (
          <label className="block text-sm font-medium text-white/90">
            Correo electrónico
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
        )}
        {!isForgotPassword && (
          <label className="block text-sm font-medium text-white/90">
            Contraseña
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} minLength={8} autoComplete={isSignUp || isUpdatePassword ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-24`} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 mt-1.5 px-4 text-xs font-semibold uppercase tracking-wide text-brand-muted hover:text-brand-ink" aria-pressed={showPassword}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            </label>
        )}
        <button disabled={submitting} className="w-full rounded-lg bg-brand-accent py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink disabled:opacity-60">
          {submitting ? "Procesando..." : isSignUp ? "Crear cuenta" : isForgotPassword ? "Enviar enlace" : isUpdatePassword ? "Actualizar contraseña" : "Entrar"}
        </button>
        {showGoogle && (
          <>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-white/60">
              <span className="h-px flex-1 bg-white/20" /> o <span className="h-px flex-1 bg-white/20" />
            </div>
            <button type="button" onClick={handleGoogle} disabled={submitting} className="flex w-full items-center justify-center gap-3 rounded-lg bg-white py-3.5 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-sand disabled:opacity-60">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
                <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
              Continuar con Google
            </button>
          </>
        )}
        {mode === "sign-in" ? (
          <>
            <p className="text-center text-sm text-white/70">
              <Link className="font-medium text-sky-300 hover:underline" href="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </p>
            <p className="text-center text-sm text-white/70">
              ¿Aún no tienes cuenta? <Link className="font-medium text-sky-300 hover:underline" href="/sign-up">Regístrate</Link>
            </p>
          </>
        ) : mode !== "update-password" && (
          <p className="text-center text-sm text-white/70">
            ¿Ya tienes cuenta? <Link className="font-medium text-sky-300 hover:underline" href="/sign-in">Inicia sesión</Link>
          </p>
        )}
      </form>
      </section>
    </main>
  );
}
