// Sunucu tarafı yardımcıları — yalnızca API route'larından import edilmelidir.
// (Buffer Node ortamına bağlıdır.)

/** "data:image/png;base64,..." biçimindeki bir dataURL'i Blob'a çevirir. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Geçersiz görsel formatı (base64 dataURL bekleniyordu)");
  }
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return new Blob([buffer], { type: mime });
}

/** dataURL veya http(s) URL'i Blob'a çevirir (uzak URL'leri indirir). */
export async function toBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) return dataUrlToBlob(src);
  const res = await fetch(src);
  if (!res.ok) throw new Error("Görsel indirilemedi");
  return res.blob();
}
