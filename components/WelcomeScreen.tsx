"use client";

import { t, type Lang } from "@/lib/i18n";
import type { User } from "@/lib/auth-context";

type Tab = "wardrobe" | "advisor" | "cabin" | "outfits";

interface Props {
  lang: Lang;
  user: User | null;
  onSelectTab: (tab: Tab) => void;
  onShowAuth: () => void;
  onSignOut: () => void;
}

const cards: { id: Tab; icon: string }[] = [
  { id: "wardrobe", icon: "🧥" },
  { id: "advisor", icon: "💬" },
  { id: "cabin", icon: "🪞" },
  { id: "outfits", icon: "🗂️" },
];

export default function WelcomeScreen({
  lang,
  user,
  onSelectTab,
  onShowAuth,
  onSignOut,
}: Props) {
  const subtitles: Record<Tab, string> = {
    wardrobe: { tr: "Kıyafetlerini yönet", en: "Manage your clothes", de: "Kleidung verwalten" }[lang],
    advisor: { tr: "Kombin önerisi al", en: "Get outfit suggestions", de: "Outfit-Vorschläge" }[lang],
    cabin: { tr: "Sanal giydirme yap", en: "Virtual try-on", de: "Virtuelle Anprobe" }[lang],
    outfits: { tr: "Kombinlerini kaydet", en: "Save your outfits", de: "Outfits speichern" }[lang],
  };
  const eyebrow = { tr: "STILAI ARŞİV", en: "STILAI ARCHIVE", de: "STILAI ARCHIV" }[lang];

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Üst bar */}
      <header className="flex items-center justify-between border-b border-black/10 px-5 py-5 sm:px-12">
        <span className="font-serif text-2xl font-medium tracking-tight text-paper-ink">
          StilAi
        </span>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="label-caps hidden text-paper-muted sm:inline">
              {user.name ?? user.email.split("@")[0]}
            </span>
            <button
              onClick={onSignOut}
              className="label-caps text-paper-muted transition hover:text-accent"
            >
              {lang === "en" ? "Sign out" : lang === "de" ? "Abmelden" : "Çıkış"}
            </button>
          </div>
        ) : (
          <button onClick={onShowAuth} className="btn-primary py-2 text-xs">
            {t(lang, "auth.signIn")}
          </button>
        )}
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-5 py-16 sm:px-12">
        <span className="label-caps mb-5 block text-accent">{eyebrow}</span>
        <h1 className="font-serif text-5xl italic leading-[1.05] text-paper-ink sm:text-7xl">
          {t(lang, "welcome.title")}
        </h1>

        {user && (
          <p className="mt-5 text-sm text-accent">
            {lang === "en"
              ? `Welcome back, ${user.name ?? user.email.split("@")[0]}.`
              : lang === "de"
                ? `Willkommen zurück, ${user.name ?? user.email.split("@")[0]}.`
                : `Tekrar hoş geldin, ${user.name ?? user.email.split("@")[0]}.`}
          </p>
        )}

        <p className="mt-6 max-w-xl text-base leading-relaxed text-paper-muted">
          {t(lang, "welcome.subtitle")}
        </p>

        {/* Bölüm kartları — editöryel */}
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectTab(c.id)}
              className="group flex flex-col gap-6 bg-ink-900 p-8 text-left transition hover:bg-ink-800"
            >
              <span className="text-3xl transition group-hover:scale-110">
                {c.icon}
              </span>
              <div>
                <p className="font-serif text-xl text-paper-ink transition group-hover:text-accent">
                  {t(lang, `welcome.btn.${c.id}`).replace(/^[^\s]+\s/, "")}
                </p>
                <p className="label-caps mt-2 text-paper-muted">
                  {subtitles[c.id]}
                </p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-10 text-xs text-paper-muted">
          {user
            ? lang === "en"
              ? "Your wardrobe is saved across sessions."
              : lang === "de"
                ? "Deine Garderobe wird sitzungsübergreifend gespeichert."
                : "Gardırobun oturumlar arası kaydedilir."
            : lang === "en"
              ? "Sign in to save your wardrobe."
              : lang === "de"
                ? "Melde dich an, um deine Garderobe zu speichern."
                : "Gardırobunu kaydetmek için giriş yap."}
        </p>
      </main>
    </div>
  );
}
