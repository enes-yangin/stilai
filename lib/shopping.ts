// Mağaza "satın al" arama linkleri — ücretsiz, API anahtarı gerektirmez.
// Kıyafet etiketlerinden (tür + renk + tarz) mağaza arama URL'leri üretir.

import type { GarmentTags } from "./types";

export interface StoreLink {
  name: string;
  url: string;
  emoji: string;
}

/** Kıyafetten arama sorgusu üretir: "Lacivert Gömlek Smart Casual" */
export function buildQuery(name: string, tags?: GarmentTags): string {
  if (tags) {
    return [tags.color, tags.type, tags.style].filter(Boolean).join(" ");
  }
  return name;
}

/** Verilen kıyafet için mağaza arama linkleri döndürür. */
export function storeLinks(name: string, tags?: GarmentTags): StoreLink[] {
  const q = encodeURIComponent(buildQuery(name, tags));
  return [
    {
      name: "Trendyol",
      emoji: "🛍️",
      url: `https://www.trendyol.com/sr?q=${q}`,
    },
    {
      name: "Amazon",
      emoji: "📦",
      url: `https://www.amazon.com.tr/s?k=${q}`,
    },
    {
      name: "Google",
      emoji: "🔎",
      url: `https://www.google.com/search?tbm=shop&q=${q}`,
    },
  ];
}
