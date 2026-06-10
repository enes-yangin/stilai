"use client";

import { useMemo, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { Outfit, WardrobeItem } from "@/lib/types";

interface Props {
  lang: Lang;
  outfits: Outfit[];
  items: WardrobeItem[];
  onCreate: (name: string, itemIds: string[]) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onTryOutfit: (itemIds: string[]) => void;
}

export default function OutfitsPanel({
  lang,
  outfits,
  items,
  onCreate,
  onToggleFavorite,
  onDelete,
  onTryOutfit,
}: Props) {
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const shown = outfits.filter((o) => (filter === "fav" ? o.isFavorite : true));
  const tryable = items.filter((i) => !i.frontImage.startsWith("data:image/svg"));

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    if (picked.length === 0) return;
    onCreate(name.trim() || t(lang, "outfits.title"), picked);
    setCreating(false);
    setName("");
    setPicked([]);
  };

  return (
    <section className="glass flex h-full w-full flex-col p-4 sm:p-6">
      {/* Header — editöryel */}
      <header className="mb-5 flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="label-caps text-accent">{t(lang, "outfits.title")}</span>
          <h2 className="mt-1 font-serif text-3xl italic text-paper-ink sm:text-4xl">
            {t(lang, "outfits.subtitle")}
          </h2>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="btn-primary shrink-0 text-xs">
            {t(lang, "outfits.create")}
          </button>
        )}
      </header>

      {creating ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(lang, "outfits.namePlaceholder")}
            className="mb-3 w-full border-b border-black/20 bg-transparent px-1 py-2 font-serif text-lg text-paper-ink placeholder:text-paper-muted focus:border-accent focus:outline-none"
          />
          <p className="label-caps mb-2 text-paper-muted">{t(lang, "outfits.pickItems")}</p>
          {tryable.length === 0 ? (
            <p className="mt-6 text-center text-sm text-paper-muted">{t(lang, "cabin.pickEmpty")}</p>
          ) : (
            <div className="grid flex-1 grid-cols-3 content-start gap-3 overflow-y-auto sm:grid-cols-5">
              {tryable.map((it) => {
                const active = picked.includes(it.id);
                return (
                  <button
                    key={it.id}
                    onClick={() => togglePick(it.id)}
                    className={`relative overflow-hidden border-2 transition ${active ? "border-accent" : "border-black/10 opacity-80 hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.frontImage} alt={it.name} className="aspect-[3/4] w-full bg-white object-contain" />
                    {active && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] text-white">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={() => { setCreating(false); setPicked([]); setName(""); }} className="btn-ghost flex-1 justify-center">
              {t(lang, "outfits.cancel")}
            </button>
            <button onClick={save} disabled={picked.length === 0} className="btn-primary flex-1 justify-center">
              {t(lang, "outfits.save")} {picked.length > 0 && `(${picked.length})`}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filtre */}
          <div className="mb-5 flex gap-6 border-b border-black/5 pb-1">
            {(["all", "fav"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`label-caps border-b-2 pb-2 transition ${
                  filter === f ? "border-accent text-paper-ink" : "border-transparent text-paper-muted hover:text-paper-ink"
                }`}
              >
                {f === "all" ? t(lang, "outfits.all") : t(lang, "outfits.favorites")}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 px-6 text-center">
              <span className="grid h-14 w-14 place-items-center border border-black/10 text-2xl">🗂️</span>
              <p className="font-serif text-xl text-paper-ink">{t(lang, "outfits.empty")}</p>
              <p className="label-caps text-paper-muted">{t(lang, "outfits.emptyHint")}</p>
            </div>
          ) : (
            <div className="-mr-2 grid flex-1 grid-cols-1 content-start gap-5 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((o) => {
                const pieces = o.itemIds.map((id) => itemById.get(id)).filter(Boolean) as WardrobeItem[];
                return (
                  <div key={o.id} className="group bg-ink-800">
                    {/* Görsel kolajı */}
                    <div className="relative grid aspect-[4/5] grid-cols-2 gap-px overflow-hidden bg-black/5">
                      {pieces.slice(0, 4).map((p) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img key={p.id} src={p.frontImage} alt={p.name} className="h-full w-full bg-white object-cover" />
                      ))}
                      {pieces.length === 0 && <span className="col-span-2 grid place-items-center text-paper-faint">—</span>}

                      {o.source === "ai" && (
                        <span className="absolute left-2 top-2 bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-ink-900">
                          {t(lang, "outfits.aiBadge")}
                        </span>
                      )}
                      <button
                        onClick={() => onToggleFavorite(o.id)}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center border border-black/10 bg-ink-850/90 text-sm backdrop-blur transition hover:scale-105"
                        title="favori"
                      >
                        {o.isFavorite ? "⭐" : "☆"}
                      </button>
                    </div>

                    {/* Bilgi */}
                    <div className="flex items-start justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-serif text-lg text-paper-ink group-hover:text-accent">{o.name}</p>
                        <p className="label-caps mt-0.5 text-paper-muted">
                          {pieces.length} {t(lang, "outfits.pieces")}
                        </p>
                      </div>
                      <button onClick={() => onDelete(o.id)} className="shrink-0 text-paper-faint transition hover:text-rose-600" title={t(lang, "outfits.delete")}>✕</button>
                    </div>
                    {pieces.length > 0 && (
                      <button
                        onClick={() => onTryOutfit(o.itemIds)}
                        className="w-full border-t border-black/10 py-2.5 text-[11px] font-medium uppercase tracking-widest text-paper-body transition hover:bg-black/[0.03]"
                      >
                        {t(lang, "outfits.tryCabin")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
