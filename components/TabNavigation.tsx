"use client";

import { t, type Lang } from "@/lib/i18n";

type Tab = "wardrobe" | "advisor" | "cabin" | "outfits";

interface Props {
  lang: Lang;
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
  onClose: () => void;
}

export default function TabNavigation({
  lang,
  activeTab,
  onChangeTab,
  onClose,
}: Props) {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "wardrobe", icon: "🧥", label: t(lang, "tab.wardrobe") },
    { id: "advisor", icon: "💬", label: t(lang, "tab.advisor") },
    { id: "cabin", icon: "🪞", label: t(lang, "tab.cabin") },
    { id: "outfits", icon: "🗂️", label: t(lang, "tab.outfits") },
  ];

  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/10 px-4 sm:px-6">
      {/* Editöryel sekme barı (alt çizgili) */}
      <nav className="flex items-center gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`label-caps flex shrink-0 items-center gap-1.5 border-b-2 py-4 transition ${
                active
                  ? "border-accent text-paper-ink"
                  : "border-transparent text-paper-muted hover:text-paper-ink"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onClose}
        className="label-caps shrink-0 text-paper-muted transition hover:text-accent"
      >
        <span className="sm:hidden">✕</span>
        <span className="hidden sm:inline">{t(lang, "tab.close")}</span>
      </button>
    </div>
  );
}
