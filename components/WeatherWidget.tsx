"use client";

import { t, type Lang } from "@/lib/i18n";
import type { Weather } from "@/lib/types";

interface Props {
  lang: Lang;
  weather: Weather | null;
  loading: boolean;
  error?: string;
  onRefresh: () => void;
}

export default function WeatherWidget({
  lang,
  weather,
  loading,
  error,
  onRefresh,
}: Props) {
  return (
    <div className="glass flex items-center justify-between gap-4 p-5">
      {loading ? (
        <div className="flex w-full items-center gap-3">
          <div className="shimmer h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="shimmer h-3 w-24" />
            <div className="shimmer h-3 w-16" />
          </div>
        </div>
      ) : error ? (
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-sm text-rose-600">{t(lang, "weather.error")}</span>
          <button onClick={onRefresh} className="btn-ghost px-3 py-1.5 text-xs">
            {t(lang, "weather.refresh")}
          </button>
        </div>
      ) : weather ? (
        <>
          <div className="flex min-w-0 items-center gap-4">
            <span className="text-4xl leading-none">{weather.emoji}</span>
            <div className="min-w-0">
              <p className="font-serif text-3xl text-paper-ink">
                {Math.round(weather.temperature)}°
              </p>
              <p className="label-caps truncate text-paper-muted">{weather.description}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="label-caps text-paper-muted">
              📍 {weather.location.slice(0, 10)}
            </p>
            <p className="mt-1 label-caps text-paper-faint">
              💨 {Math.round(weather.windspeed)} km/s
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
