// Uygulama genelinde paylaşılan tip tanımları

export interface GarmentTags {
  type: string; // örn: "Gömlek", "Pantolon"
  color: string; // örn: "Lacivert"
  style: string; // örn: "Smart Casual"
  raw?: string; // modelden gelen ham açıklama
}

export interface WardrobeItem {
  id: string;
  name: string;
  frontImage: string; // dataURL veya uzak URL (temizlenmiş, transparanlar)
  backImage?: string;
  originalImage?: string; // Arka plan kaldırılmadan önceki orijinal
  tags?: GarmentTags;
  analyzing?: boolean;
  removingBg?: boolean;
  bgError?: string;
  error?: string;
  isDirty: boolean; // Giyilmişse true (kirli)
  wearCount: number; // Kaç kez giyildiği
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[]; // gardırop parça ID'leri
  isFavorite: boolean;
  source: "manual" | "ai"; // kullanıcı mı oluşturdu, AI mı önerdi
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  recommendedIds?: string[]; // Bu öneriye karşılık gelen dolap parça ID'leri
}

export interface Weather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  description: string;
  emoji: string;
  isDay: boolean;
  location: string;
}

export interface TryOnState {
  loading: boolean;
  resultUrl?: string;
  error?: string;
}
