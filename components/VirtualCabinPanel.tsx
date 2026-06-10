"use client";

import { useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { TryOnState, WardrobeItem } from "@/lib/types";
import { categorize, type Category } from "@/lib/category";

export interface OutfitSelection {
  top?: string;
  bottom?: string;
  outer?: string;
  dress?: string;
}

interface Props {
  lang: Lang;
  userPhoto: string | null;
  onSetUserPhoto: (dataUrl: string) => void;
  selectedGarment: WardrobeItem | null;
  outfit?: WardrobeItem[];
  onSelectGarment?: (id: string) => void;
  items?: WardrobeItem[];
  pendingOutfit?: boolean;
  onTryOnLayered?: (selection: OutfitSelection) => void;
  tryOn: TryOnState;
  onTryOn: () => void;
  onMarkWorn: (id: string) => void;
}

const CAT_SLOT: Record<Category, keyof OutfitSelection | null> = {
  "üst": "top",
  "alt": "bottom",
  "dış giyim": "outer",
  "elbise": "dress",
  "diğer": null,
};

export default function VirtualCabinPanel({
  lang,
  userPhoto,
  onSetUserPhoto,
  selectedGarment,
  outfit = [],
  onSelectGarment,
  items = [],
  pendingOutfit = false,
  onTryOnLayered,
  tryOn,
  onTryOn,
  onMarkWorn,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selection, setSelection] = useState<OutfitSelection>({});

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onSetUserPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canTryOn = !!userPhoto && !!selectedGarment && !tryOn.loading;
  // bgError olan parçalar arka planlı orijinal görsele sahip — try-on'a sokulmamalı.
  // Sadece arka planı başarıyla kaldırılmış veya hiç işlem yapılmamış (yeni yüklenen) parçalar tryable.
  const tryableItems = items.filter(
    (i) => !i.frontImage.startsWith("data:image/svg") && !i.bgError,
  );
  const bgErrorCount = items.filter((i) => i.bgError).length;

  const grouped: Record<keyof OutfitSelection, WardrobeItem[]> = {
    top: [], bottom: [], outer: [], dress: [],
  };
  for (const it of tryableItems) {
    const slot = CAT_SLOT[categorize(it.tags?.type)];
    if (slot) grouped[slot].push(it);
  }

  const slotMeta: { key: keyof OutfitSelection; labelKey: string; emoji: string }[] = [
    { key: "top", labelKey: "cabin.slotTop", emoji: "👕" },
    { key: "bottom", labelKey: "cabin.slotBottom", emoji: "👖" },
    { key: "outer", labelKey: "cabin.slotOuter", emoji: "🧥" },
    { key: "dress", labelKey: "cabin.slotDress", emoji: "👗" },
  ];

  const selectedCount = Object.values(selection).filter(Boolean).length;
  const toggle = (slot: keyof OutfitSelection, id: string) =>
    setSelection((prev) => ({ ...prev, [slot]: prev[slot] === id ? undefined : id }));
  const applySelection = () => {
    if (selectedCount === 0 || !onTryOnLayered) return;
    setPickerOpen(false);
    onTryOnLayered(selection);
  };

  return (
    <section className="grid w-full grid-cols-1 gap-5 lg:h-full lg:grid-cols-12">
      {/* SOL — Model sahnesi */}
      <div className="glass relative min-h-[50vh] overflow-hidden lg:col-span-7">
        {tryOn.loading ? (
          <LoadingScene lang={lang} />
        ) : tryOn.error ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="text-4xl">{t(lang, "cabin.error")}</p>
              <p className="mt-2 text-sm text-rose-600">{tryOn.error}</p>
              <button onClick={onTryOn} disabled={!canTryOn} className="btn-ghost mt-4 text-xs disabled:opacity-40">
                {t(lang, "cabin.errorRetry")}
              </button>
            </div>
          </div>
        ) : tryOn.resultUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={tryOn.resultUrl} alt="Sonuç" className="h-full w-full animate-fade-in object-contain" />
        ) : userPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={userPhoto} alt="Profil" className="h-full w-full object-contain" />
        ) : (
          <button onClick={() => inputRef.current?.click()} className="grid h-full w-full place-items-center px-6 text-center">
            <div>
              <p className="text-4xl">🧍</p>
              <p className="mt-3 font-serif text-xl text-paper-ink">{t(lang, "cabin.uploadPhoto")}</p>
              <p className="mt-1 label-caps text-paper-muted">{t(lang, "cabin.photoHint")}</p>
            </div>
          </button>
        )}

        {/* Canlı rozet */}
        {!tryOn.loading && userPhoto && (
          <span className="absolute left-4 top-4 bg-accent px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-ink-900">
            ● AI {t(lang, "cabin.title")}
          </span>
        )}

        {/* Seçili kıyafet rozeti */}
        {selectedGarment && !tryOn.loading && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 border border-black/10 bg-ink-850/90 px-2 py-1.5 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedGarment.frontImage} alt={selectedGarment.name} className="h-8 w-8 bg-white object-contain" />
            <span className="max-w-[8rem] truncate text-xs text-paper-ink">{selectedGarment.name}</span>
          </div>
        )}

        {/* KIYAFET SEÇİM EKRANI (overlay) */}
        {pickerOpen && (
          <div className="absolute inset-0 z-30 flex flex-col bg-ink-900/97 p-5 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-serif text-lg italic text-paper-ink">{t(lang, "cabin.pickTitle")}</h3>
              <button onClick={() => setPickerOpen(false)} className="grid h-7 w-7 place-items-center border border-black/10 text-paper-body hover:bg-black/[0.04]">✕</button>
            </div>
            <p className="mb-3 text-[11px] text-paper-muted">{t(lang, "cabin.pickHint")}</p>

            {bgErrorCount > 0 && (
              <div className="mb-3 flex items-start gap-2 border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
                <span className="shrink-0">⚠️</span>
                <span>
                  {bgErrorCount} kıyafette arka plan kaldırma hatası var — bunlar listede görünmüyor.
                  Gardırop sekmesinden &ldquo;Tekrar Dene&rdquo; ile düzeltebilirsin.
                </span>
              </div>
            )}

            {tryableItems.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <p className="text-sm text-paper-muted">{t(lang, "cabin.pickEmpty")}</p>
              </div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto">
                {slotMeta.map(({ key, labelKey, emoji }) => {
                  const list = grouped[key];
                  if (list.length === 0) return null;
                  return (
                    <div key={key}>
                      <p className="label-caps mb-2 text-paper-body">{emoji} {t(lang, labelKey)}</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {list.map((it) => {
                          const active = selection[key] === it.id;
                          return (
                            <button
                              key={it.id}
                              onClick={() => toggle(key, it.id)}
                              title={it.name}
                              className={`relative shrink-0 overflow-hidden border-2 transition ${active ? "border-accent" : "border-black/10 opacity-80 hover:opacity-100"}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={it.frontImage} alt={it.name} className="h-20 w-20 bg-white object-contain" />
                              {active && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] text-white">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tryableItems.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <button onClick={applySelection} disabled={selectedCount === 0} className="btn-primary w-full py-2.5">
                  {selectedCount === 0 ? t(lang, "cabin.pickNone") : `${t(lang, "cabin.applyOutfit")} (${selectedCount})`}
                </button>
                <p className="text-center text-[10px] text-paper-muted">{t(lang, "cabin.pickKeepHint")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SAĞ — Kontroller */}
      <aside className="glass flex min-h-0 flex-col p-5 lg:col-span-5">
        <span className="label-caps text-accent">{t(lang, "cabin.title")}</span>
        <h2 className="mt-1 font-serif text-2xl italic text-paper-ink">{t(lang, "cabin.subtitle")}</h2>

        {pendingOutfit && !userPhoto && !tryOn.loading && (
          <div className="mt-4 flex items-start gap-2 border border-accent/30 bg-accent/[0.06] p-3 text-xs text-paper-body">
            <span>💡</span>
            <span>{t(lang, "cabin.pendingOutfit")}</span>
          </div>
        )}

        {/* Önerilen kombin şeridi */}
        {outfit.length > 0 && (
          <div className="mt-4">
            <p className="label-caps text-paper-muted">{t(lang, "cabin.outfitTitle")}</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {outfit.map((g) => {
                const active = g.id === selectedGarment?.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => onSelectGarment?.(g.id)}
                    title={g.name}
                    className={`relative shrink-0 border-2 transition ${active ? "border-accent" : "border-black/10 opacity-70 hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.frontImage} alt={g.name} className="h-12 w-12 bg-white object-contain" />
                    {active && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] text-white">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="mt-auto space-y-2 pt-6">
          {userPhoto && (
            <button onClick={() => inputRef.current?.click()} className="btn-ghost w-full justify-center text-xs">
              {t(lang, "cabin.changePhoto")}
            </button>
          )}

          <button onClick={() => setPickerOpen(true)} disabled={!userPhoto || tryOn.loading} className="btn-primary w-full py-3">
            {t(lang, "cabin.letsTry")}
          </button>

          {!userPhoto && (
            <p className="text-center text-[11px] text-amber-700">{t(lang, "cabin.needPhoto")}</p>
          )}

          {selectedGarment && userPhoto && (
            <button onClick={onTryOn} disabled={!canTryOn} className="btn-ghost w-full justify-center text-xs disabled:opacity-40">
              {tryOn.loading ? t(lang, "cabin.trying") : `🔁 ${selectedGarment.name}`}
            </button>
          )}

          {selectedGarment && (
            <button
              onClick={() => onMarkWorn(selectedGarment.id)}
              className="w-full border border-dashed border-green-600/50 bg-green-500/[0.08] py-2.5 text-xs font-medium uppercase tracking-widest text-green-700 transition hover:bg-green-500/[0.15]"
            >
              {t(lang, "cabin.markWorn")}
            </button>
          )}
        </div>
      </aside>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </section>
  );
}

function LoadingScene({ lang }: { lang: Lang }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div className="flex flex-col items-center">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-black/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
        </div>
        <p className="mt-4 font-serif text-lg text-paper-ink">{t(lang, "cabin.loading")}</p>
        <p className="mt-1 max-w-[16rem] text-xs text-paper-muted">{t(lang, "cabin.loadingHint")}</p>
        <div className="mt-5 w-44 space-y-2">
          <div className="shimmer h-2.5 w-full" />
          <div className="shimmer h-2.5 w-4/5" />
          <div className="shimmer h-2.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
