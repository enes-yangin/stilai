"use client";

import { useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { GarmentTags, WardrobeItem } from "@/lib/types";
import { categorize, categoryLabel } from "@/lib/category";
import { storeLinks } from "@/lib/shopping";

interface Props {
  lang: Lang;
  items: WardrobeItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddFiles: (files: FileList) => void;
  onAddUrl: (url: string) => Promise<string | null>;
  importing?: boolean;
  onRemove: (id: string) => void;
  onAnalyze: (id: string) => void;
  onMarkWorn: (id: string) => void;
  onWashLaundry: () => void;
  onRename: (id: string, name: string) => void;
  onEditTags: (id: string, tags: GarmentTags) => void;
  onRetryBg: (id: string) => void;
}

export default function WardrobePanel({
  lang,
  items,
  selectedId,
  onSelect,
  onAddFiles,
  onAddUrl,
  importing,
  onRemove,
  onAnalyze,
  onWashLaundry,
  onRename,
  onEditTags,
  onRetryBg,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const submitUrl = async () => {
    const url = urlValue.trim();
    if (!url || importing) return;
    setUrlError(null);
    const err = await onAddUrl(url);
    if (err) setUrlError(err);
    else {
      setUrlValue("");
      setUrlOpen(false);
    }
  };

  return (
    <section className="glass flex min-h-[60vh] w-full flex-col p-4 sm:p-6 lg:h-full">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="label-caps text-accent">{t(lang, "wardrobe.title")}</span>
          <h2 className="mt-1 font-serif text-3xl italic text-paper-ink sm:text-4xl">
            {t(lang, "wardrobe.subtitle")}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="label-caps text-paper-muted">
            {items.length} {t(lang, "wardrobe.count")}
          </span>
          <button onClick={() => inputRef.current?.click()} className="btn-primary text-xs">
            + {t(lang, "wardrobe.upload")}
          </button>
        </div>
      </header>

      {/* Aksiyon çubuğu */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {!urlOpen ? (
          <button onClick={() => { setUrlOpen(true); setUrlError(null); }} className="btn-ghost text-xs">
            {t(lang, "wardrobe.addUrl")}
          </button>
        ) : (
          <div className="flex w-full flex-col gap-1.5 sm:max-w-md">
            <div className="flex items-center gap-1.5 border border-black/15 bg-black/[0.03] p-1.5 focus-within:border-accent/60">
              <input
                autoFocus
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitUrl();
                  if (e.key === "Escape") { setUrlOpen(false); setUrlError(null); }
                }}
                placeholder="https://…"
                disabled={importing}
                className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-paper-ink placeholder:text-paper-muted focus:outline-none disabled:opacity-50"
              />
              <button onClick={submitUrl} disabled={importing || !urlValue.trim()} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
                {importing ? "…" : "+"}
              </button>
              <button onClick={() => { setUrlOpen(false); setUrlError(null); setUrlValue(""); }} className="shrink-0 px-2 py-1.5 text-xs text-paper-muted transition hover:text-paper-ink">
                ✕
              </button>
            </div>
            {importing && <p className="text-[11px] text-paper-muted">{t(lang, "wardrobe.importing")}</p>}
            {urlError && <p className="border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-600">{urlError}</p>}
          </div>
        )}

        {items.some((i) => i.isDirty) && (
          <button onClick={onWashLaundry} className="btn-ghost border-sky-400/30 text-xs text-sky-700 hover:border-sky-400/60 hover:text-sky-800">
            {t(lang, "wardrobe.laundry")}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAddFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Izgara */}
      <div className="-mr-2 flex-1 overflow-y-auto pr-2">
        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 px-6 text-center">
            <span className="grid h-14 w-14 place-items-center border border-black/10 text-2xl">🪺</span>
            <p className="font-serif text-xl text-paper-ink">{t(lang, "wardrobe.empty")}</p>
            <p className="label-caps text-paper-muted">{t(lang, "wardrobe.emptyHint")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                lang={lang}
                item={item}
                active={item.id === selectedId}
                onSelect={onSelect}
                onAnalyze={onAnalyze}
                onRemove={onRemove}
                onRename={onRename}
                onEditTags={onEditTags}
                onRetryBg={onRetryBg}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ItemCard({
  lang,
  item,
  active,
  onSelect,
  onAnalyze,
  onRemove,
  onRename,
  onEditTags,
  onRetryBg,
}: {
  lang: Lang;
  item: WardrobeItem;
  active: boolean;
  onSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onEditTags: (id: string, tags: GarmentTags) => void;
  onRetryBg: (id: string) => void;
}) {
  const processing = item.removingBg || item.analyzing;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(item.name);
  const [editingTags, setEditingTags] = useState(false);
  const [tagVals, setTagVals] = useState<GarmentTags>(
    item.tags ?? { type: "", color: "", style: "" }
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onRemove(item.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  const commitName = () => {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== item.name) onRename(item.id, trimmed);
    else setNameVal(item.name);
    setEditingName(false);
  };

  const commitTags = () => {
    onEditTags(item.id, tagVals);
    setEditingTags(false);
  };

  return (
    <div
      onClick={() => { if (!editingName && !editingTags) onSelect(item.id); }}
      className={`group animate-fade-in cursor-pointer bg-ink-800 transition ${
        active ? "ring-1 ring-accent" : "hover:bg-ink-700"
      } ${item.isDirty ? "opacity-60" : ""}`}
    >
      {/* Görsel */}
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.frontImage}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Sol üst rozetler */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {item.tags && (
            <span className="bg-black/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-accent backdrop-blur">
              ✦ AI
            </span>
          )}
          {item.isDirty && (
            <span className="bg-rose-500/80 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              {t(lang, "wardrobe.dirty")}
            </span>
          )}
        </div>

        {/* Giyme sayısı */}
        {item.wearCount > 0 && (
          <span className="absolute left-3 bottom-3 grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-bold text-ink-900">
            {item.wearCount}
          </span>
        )}

        {/* Her zaman görünen silme butonu */}
        {!processing && (
          <button
            onClick={handleDelete}
            className={`absolute right-2 top-2 grid h-7 w-7 place-items-center transition ${
              confirmDelete
                ? "bg-rose-600 text-white"
                : "bg-black/50 text-paper-ink hover:bg-rose-600 hover:text-white"
            }`}
            aria-label={confirmDelete ? "Onayla" : t(lang, "wardrobe.remove")}
            title={confirmDelete ? "Tekrar tıkla — onayla" : t(lang, "wardrobe.remove")}
          >
            {confirmDelete ? "?" : "✕"}
          </button>
        )}

        {/* İşlem durumu */}
        {processing && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="label-caps text-[9px] text-accent">
                {item.removingBg ? t(lang, "cabin.removingBg") : "AI…"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="border-t border-black/5 p-3" onClick={(e) => e.stopPropagation()}>
        {/* İsim — düzenlenebilir */}
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") { setNameVal(item.name); setEditingName(false); }
            }}
            className="label-caps w-full truncate bg-transparent text-slate-100 outline-none ring-1 ring-accent/60 px-1"
          />
        ) : (
          <p
            className="label-caps truncate text-slate-100 cursor-text hover:text-accent transition"
            title="İsmi değiştirmek için tıkla"
            onClick={() => { setEditingName(true); setNameVal(item.name); }}
          >
            {item.name}
          </p>
        )}

        {item.bgError ? (
          /* Arka plan kaldırma hatası — kıyafet try-on için kullanılamaz */
          <div className="mt-1.5 space-y-1.5">
            <p className="text-[10px] text-amber-700">⚠️ Arka plan kaldırılamadı</p>
            <button
              onClick={() => onRetryBg(item.id)}
              disabled={item.removingBg}
              className="w-full border border-amber-500/40 bg-amber-500/10 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              {item.removingBg ? "İşleniyor…" : "↺ Tekrar Dene"}
            </button>
          </div>
        ) : item.error ? (
          <p className="mt-1 text-[10px] text-rose-600">{item.error}</p>
        ) : item.tags && !editingTags ? (
          <>
            <p className="mt-1 truncate text-[11px] text-paper-muted">
              {item.tags.type} • {item.tags.color}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Tag accent>{categoryLabel(categorize(item.tags.type))}</Tag>
              <Tag>{item.tags.style}</Tag>
            </div>
            {/* Aksiyon butonları */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => { setTagVals({ ...item.tags! }); setEditingTags(true); }}
                className="border border-black/10 px-1.5 py-0.5 text-[10px] text-paper-muted transition hover:border-accent/50 hover:text-accent"
                title="Etiketleri düzenle"
              >
                ✏️
              </button>
              {storeLinks(item.name, item.tags).map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${t(lang, "wardrobe.shop")} — ${s.name}`}
                  className="border border-black/10 px-1.5 py-0.5 text-[10px] transition hover:border-accent/50"
                >
                  {s.emoji}
                </a>
              ))}
            </div>
          </>
        ) : item.tags && editingTags ? (
          /* Etiket düzenleme formu */
          <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <TagField label="Tür" value={tagVals.type} onChange={(v) => setTagVals((p) => ({ ...p, type: v }))} />
            <TagField label="Renk" value={tagVals.color} onChange={(v) => setTagVals((p) => ({ ...p, color: v }))} />
            <TagField label="Stil" value={tagVals.style} onChange={(v) => setTagVals((p) => ({ ...p, style: v }))} />
            <div className="flex gap-1.5 pt-0.5">
              <button onClick={commitTags} className="flex-1 bg-accent py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-900">
                Kaydet
              </button>
              <button onClick={() => setEditingTags(false)} className="px-2 py-1 text-[10px] text-paper-muted border border-black/10 hover:text-paper-ink">
                İptal
              </button>
            </div>
          </div>
        ) : (
          /* AI analizi yok — analiz butonu her zaman görünür */
          <div className="mt-2">
            {!processing ? (
              <button
                onClick={() => onAnalyze(item.id)}
                className="w-full bg-accent/10 border border-accent/20 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent transition hover:bg-accent/20"
              >
                {t(lang, "wardrobe.analyze")}
              </button>
            ) : (
              <p className="mt-1 text-[11px] text-paper-faint">—</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TagField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 shrink-0 text-[9px] uppercase tracking-wider text-paper-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-b border-black/15 bg-transparent px-1 py-0.5 text-[11px] text-paper-ink focus:border-accent/60 focus:outline-none"
      />
    </div>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
        accent ? "border border-accent/40 bg-accent/10 text-accent" : "border border-black/10 text-paper-muted"
      }`}
    >
      {children}
    </span>
  );
}
