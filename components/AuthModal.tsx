"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  onSuccess?: () => void;
  onGuest?: () => void;
}

export default function AuthModal({ lang, onSuccess, onGuest }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 py-2.5 text-paper-ink placeholder:text-paper-muted transition focus:border-accent/60 focus:bg-black/[0.05] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-md animate-scale-in rounded-3xl border border-black/[0.08] bg-ink-800/90 p-6 shadow-soft sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-deep text-2xl shadow-glow">
            👗
          </span>
          <h1 className="text-xl font-semibold text-paper-ink">
            {mode === "signin" ? "Tekrar hoş geldin" : "Hesap oluştur"}
          </h1>
          <p className="mt-1 text-sm text-paper-muted">
            {mode === "signin"
              ? "Gardırobuna erişmek için giriş yap."
              : "Ücretsiz hesap oluştur, gardırobunu kaydet."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Adınız (isteğe bağlı)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
          />

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading
              ? "Yükleniyor…"
              : mode === "signin"
                ? "Giriş Yap"
                : "Kayıt Ol"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs text-paper-muted">ya da</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="btn-ghost w-full justify-center"
        >
          {mode === "signin"
            ? "Hesabın yoksa kayıt ol →"
            : "Zaten hesabın varsa giriş yap →"}
        </button>

        {onGuest && (
          <button
            onClick={onGuest}
            className="mt-3 w-full text-sm text-paper-muted transition hover:text-paper-body"
          >
            Misafir olarak devam et (gardırop kaydedilmez)
          </button>
        )}
      </div>
    </div>
  );
}
