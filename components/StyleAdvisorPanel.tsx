"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { ChatMessage, WardrobeItem, Weather } from "@/lib/types";
import WeatherWidget from "./WeatherWidget";

interface Props {
  lang: Lang;
  messages: ChatMessage[];
  items: WardrobeItem[];
  weather: Weather | null;
  weatherLoading: boolean;
  weatherError?: string;
  onRefreshWeather: () => void;
  onSend: (text: string) => void;
  sending: boolean;
  onTryOutfit: (ids: string[]) => void;
  onSaveOutfit: (ids: string[]) => void;
}

export default function StyleAdvisorPanel({
  lang,
  messages,
  items,
  weather,
  weatherLoading,
  weatherError,
  onRefreshWeather,
  onSend,
  sending,
  onTryOutfit,
  onSaveOutfit,
}: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    t(lang, "suggestion.1"),
    t(lang, "suggestion.2"),
    t(lang, "suggestion.3"),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput("");
  };

  // Son AI önerisi (sağ panoda gösterilir)
  const lastRec = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && (m.recommendedIds?.length ?? 0) > 0);
  const recItems = (lastRec?.recommendedIds ?? [])
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as WardrobeItem[];

  return (
    <section className="grid w-full grid-cols-1 gap-5 lg:h-full lg:grid-cols-12">
      {/* SOL — Sohbet */}
      <div className="glass flex min-h-[60vh] flex-col lg:min-h-0 lg:col-span-7">
        <header className="border-b border-black/10 px-5 py-4">
          <span className="label-caps text-accent">{t(lang, "advisor.title")}</span>
          <h2 className="mt-1 font-serif text-2xl italic text-paper-ink">
            {t(lang, "advisor.subtitle")}
          </h2>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((m) => (
            <Bubble key={m.id} message={m} items={items} />
          ))}

          {messages.length <= 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  disabled={sending}
                  className="border border-black/10 px-3 py-1.5 text-xs text-paper-body transition hover:border-accent hover:text-paper-ink disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Giriş — editöryel alt çizgi */}
        <div className="border-t border-black/10 p-4">
          <div className="flex items-end gap-2 border-b border-black/20 transition focus-within:border-accent">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={t(lang, "advisor.placeholder")}
              className="max-h-28 flex-1 resize-none bg-transparent py-2.5 text-sm text-paper-ink placeholder:text-paper-muted focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={sending || !input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center bg-accent text-ink-900 transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t(lang, "advisor.send")}
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900" />
              ) : (
                "➤"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SAĞ — Hava + Günün Görünümü */}
      <aside className="flex min-h-0 flex-col gap-5 lg:col-span-5">
        <WeatherWidget
          lang={lang}
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
          onRefresh={onRefreshWeather}
        />

        <div className="glass flex min-h-0 flex-1 flex-col p-5">
          <span className="label-caps text-accent">
            {lang === "en" ? "Look of the day" : lang === "de" ? "Look des Tages" : "Günün Görünümü"}
          </span>

          {recItems.length > 0 ? (
            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                {recItems.map((it) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={it.id}
                    src={it.frontImage}
                    alt={it.name}
                    title={it.name}
                    className="aspect-[3/4] w-full border border-black/10 bg-ink-800 object-cover"
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => onTryOutfit(lastRec!.recommendedIds!)}
                  className="btn-primary w-full justify-center"
                >
                  {t(lang, "advisor.tryInCabin")}
                </button>
                <SaveButton lang={lang} onSave={() => onSaveOutfit(lastRec!.recommendedIds!)} />
              </div>
            </div>
          ) : (
            <div className="mt-4 grid flex-1 place-items-center px-4 text-center">
              <p className="text-sm leading-relaxed text-paper-muted">
                {lang === "en"
                  ? "Ask the advisor for an outfit and it will appear here."
                  : lang === "de"
                    ? "Frag den Berater nach einem Outfit – es erscheint hier."
                    : "Danışmandan bir kombin iste, burada belirsin."}
              </p>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function SaveButton({ lang, onSave }: { lang: Lang; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => { onSave(); setSaved(true); }}
      disabled={saved}
      className="btn-ghost w-full justify-center disabled:opacity-60"
    >
      {saved ? t(lang, "outfits.saved") : t(lang, "advisor.saveOutfit")}
    </button>
  );
}

function Bubble({ message, items }: { message: ChatMessage; items: WardrobeItem[] }) {
  const isUser = message.role === "user";
  const recItems = (message.recommendedIds ?? [])
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean) as WardrobeItem[];

  return (
    <div className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-accent text-ink-900" : "border border-black/10 bg-ink-800 text-paper-body"
        }`}
      >
        {message.pending ? (
          <span className="flex gap-1 py-1">
            <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </span>
        ) : (
          message.content
        )}

        {!message.pending && recItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-black/10 pt-3">
            {recItems.map((it) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={it.id}
                src={it.frontImage}
                alt={it.name}
                title={it.name}
                className="h-10 w-10 border border-black/10 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-paper-muted"
      style={{ animationDelay: delay }}
    />
  );
}
