// Kıyafet kategorileri — hem istemci hem sunucu tarafında kullanılır (saf fonksiyon).

export type Category = "üst" | "alt" | "dış giyim" | "elbise" | "diğer";

// VTON kategori tipleri (frontend → backend).
// upper_body → IDM-VTON, lower_body/dress → CatVTON'a yönlendirilir.
export type ClothType = "upper_body" | "lower_body" | "dress";

const UPPER = [
  "gömlek", "gomlek", "tişört", "tisort", "t-shirt", "tshirt", "bluz",
  "kazak", "sweat", "süveter", "suveter", "atlet", "body", "top", "shirt",
];
const LOWER = [
  "pantolon", "pantalon", "şort", "sort", "etek", "jean", "kot",
  "eşofman", "esofman", "tayt", "pants", "shorts", "skirt", "trouser",
];
const OUTER = [
  "ceket", "kaban", "mont", "palto", "blazer", "hırka", "hirka", "yelek",
  "trençkot", "trenckot", "parka", "jacket", "coat", "cardigan",
];
const DRESS = ["elbise", "tulum", "dress", "jumpsuit"];

/** Kıyafet türünden kategoriyi tahmin eder. */
export function categorize(type?: string): Category {
  if (!type) return "diğer";
  const t = type.toLocaleLowerCase("tr");
  if (OUTER.some((k) => t.includes(k))) return "dış giyim";
  if (LOWER.some((k) => t.includes(k))) return "alt";
  if (DRESS.some((k) => t.includes(k))) return "elbise";
  if (UPPER.some((k) => t.includes(k))) return "üst";
  return "diğer";
}

/** Kategoriyi VTON bölge tipine çevirir. Dış giyim üst bölgeye uygulanır. */
export function categoryToClothType(cat: Category): ClothType {
  if (cat === "alt") return "lower_body";
  if (cat === "elbise") return "dress";
  return "upper_body"; // üst + dış giyim + diğer
}

/** Kategoriye göre emoji/etiket (UI rozetleri için). */
export function categoryLabel(cat: Category): string {
  switch (cat) {
    case "üst": return "👕 Üst";
    case "alt": return "👖 Alt";
    case "dış giyim": return "🧥 Dış Giyim";
    case "elbise": return "👗 Elbise";
    default: return "👜 Diğer";
  }
}
