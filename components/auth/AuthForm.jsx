"use client";

import Link from "next/link";
import Image from "next/image";
import { assets } from "@/assets/assets";
import logoCompel from "@/assets/logo_compel.png";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthForm({ mode, heroImage }) {
  const isSignIn = mode === "sign-in";
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
    <main className="relative isolate min-h-dvh overflow-hidden bg-[#020B22]">
      <Image src={heroImage || assets.codigo_barras} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020B22]/95 via-[#05245C]/65 to-[#05245C]/20" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020B22]/70 via-transparent to-[#020B22]/45 lg:hidden" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-center lg:gap-16 lg:px-12 lg:pb-16 lg:pt-24 xl:gap-24">
        <header className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <h1 className="text-balance font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.6)] sm:text-5xl lg:text-6xl xl:text-7xl">
            Identificación, código de barras y RFID
            <span className="block text-white/85">para tu negocio.</span>
          </h1>
          <p className="mt-5 hidden max-w-lg text-base leading-7 text-white/85 lg:block">
            Soluciones profesionales para identificar, rastrear y optimizar la operación de tu empresa.
          </p>
        </header>

        <section className="mx-auto mt-8 w-full max-w-md lg:mt-0 lg:max-w-none">
          <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-2xl border border-white/70 bg-white/85 p-5 text-brand-ink shadow-2xl backdrop-blur-md sm:space-y-5 sm:p-8">
            <div className="flex flex-col items-center">
              <Link href="/" aria-label="Ir al inicio" className="mb-4 inline-flex">
                <Image className="h-6 w-auto drop-shadow-[0_3px_6px_rgba(0,0,0,0.15)]" src={logoCompel} alt="COMPEL" priority />
              </Link>
              {!isSignIn && (
                <h2 className="text-center font-display text-2xl leading-[1] text-[#0B2A6F] sm:text-3xl lg:text-4xl">{title}</h2>
              )}
              <p className="mt-2 text-center text-sm leading-relaxed text-brand-muted sm:mt-3">{subtitle}</p>
            </div>
        {isSignUp && (
          <label className="block text-sm font-medium text-brand-charcoal">
            Nombre
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
        )}
        {!isUpdatePassword && (
          <label className="block text-sm font-medium text-brand-charcoal">
            Correo electrónico
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
        )}
        {!isForgotPassword && (
          <label className="block text-sm font-medium text-brand-charcoal">
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
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-brand-muted">
              <span className="h-px flex-1 bg-brand-line" /> o <span className="h-px flex-1 bg-brand-line" />
            </div>
            <button type="button" onClick={handleGoogle} disabled={submitting} className="flex w-full items-center justify-center gap-3 rounded-lg border border-brand-line bg-white py-3.5 text-sm font-semibold text-brand-charcoal transition hover:bg-brand-sand disabled:opacity-60">
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
            <p className="text-center text-sm text-brand-muted">
              <Link className="font-medium text-brand-accent hover:underline" href="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </p>
            <p className="text-center text-sm text-brand-muted">
              ¿Aún no tienes cuenta? <Link className="font-medium text-brand-accent hover:underline" href="/sign-up">Regístrate</Link>
            </p>
          </>
        ) : mode !== "update-password" && (
          <p className="text-center text-sm text-brand-muted">
            ¿Ya tienes cuenta? <Link className="font-medium text-brand-accent hover:underline" href="/sign-in">Inicia sesión</Link>
          </p>
        )}
          </form>
        </section>
      </div>
    </main>
  );
}
