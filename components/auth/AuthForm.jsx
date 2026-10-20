"use client";

import Link from "next/link";
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

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-12">
      <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-xl border border-brand-line bg-white p-7 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">Cuenta COMPEL</p>
          <h1 className="mt-2 font-display text-3xl text-brand-ink">
            {isSignUp ? "Crear cuenta" : isForgotPassword ? "Recuperar contraseña" : isUpdatePassword ? "Elegir contraseña nueva" : "Iniciar sesión"}
          </h1>
        </div>
        {isSignUp && (
          <label className="block text-sm text-brand-charcoal">
            Nombre
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-md border border-brand-line px-3 py-2 outline-none focus:border-brand-accent" />
          </label>
        )}
        {!isUpdatePassword && (
          <label className="block text-sm text-brand-charcoal">
            Correo electrónico
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-md border border-brand-line px-3 py-2 outline-none focus:border-brand-accent" />
          </label>
        )}
        {!isForgotPassword && (
          <label className="block text-sm text-brand-charcoal">
            Contraseña
            <input required type="password" minLength={8} autoComplete={isSignUp || isUpdatePassword ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-md border border-brand-line px-3 py-2 outline-none focus:border-brand-accent" />
          </label>
        )}
        <button disabled={submitting} className="w-full rounded-full bg-brand-accent py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-60">
          {submitting ? "Procesando..." : isSignUp ? "Crear cuenta" : isForgotPassword ? "Enviar enlace" : isUpdatePassword ? "Actualizar contraseña" : "Entrar"}
        </button>
        {showGoogle && (
          <>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-brand-muted">
              <span className="h-px flex-1 bg-brand-line" /> o <span className="h-px flex-1 bg-brand-line" />
            </div>
            <button type="button" onClick={handleGoogle} disabled={submitting} className="flex w-full items-center justify-center gap-3 rounded-full border border-brand-line bg-white py-3 text-sm font-semibold text-brand-charcoal transition hover:border-brand-accent disabled:opacity-60">
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
    </main>
  );
}
