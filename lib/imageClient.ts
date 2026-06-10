// İstemci (tarayıcı) tarafı görsel yardımcıları.

/**
 * Şeffaf bir PNG'yi (arka planı kaldırılmış kıyafet) beyaz zemine düzleştirir.
 * IDM-VTON gibi modeller şeffaf alanları siyah/gürültü olarak yorumlayıp
 * kıyafetin rengini/şeklini bozabilir; beyaz zemin kanonik girdidir.
 *
 * SVG/uzak URL'ler veya hata durumunda orijinal kaynağı geri döndürür.
 */
export function flattenToWhite(src: string): Promise<string> {
  return new Promise((resolve) => {
    // SVG placeholder veya veri olmayan kaynakları olduğu gibi bırak
    if (!src || src.startsWith("data:image/svg")) {
      resolve(src);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 768;
        canvas.height = img.naturalHeight || 1024;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        // Beyaz zemin + üstüne kıyafet
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(src); // CORS vb. — orijinali kullan
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * Görseli en uzun kenarı `maxDim` olacak şekilde küçültüp JPEG'e sıkıştırır.
 * Vision API'lerinin istek boyutu limitini (ör. Groq ~4MB) aşmayı önler (413 hatası).
 * SVG / hata durumunda orijinali döndürür.
 */
export function downscaleImage(
  src: string,
  maxDim = 1024,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve) => {
    if (!src || src.startsWith("data:image/svg")) {
      resolve(src);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth || maxDim;
        const h = img.naturalHeight || maxDim;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        // Şeffaflık JPEG'de siyaha dönmesin diye beyaz zemin
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
