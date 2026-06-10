import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { Weather } from "@/lib/types";
import { getGroqKeys, isGroqRateLimit } from "@/lib/groqKeys";

export const runtime = "nodejs";

// Groq modelleri. Sıra = öncelik; biri kaldırılırsa/limite takılırsa sonraki denenir.
// İstenen birincil model: llama3-8b-8192. Groq bunu kullanımdan kaldırırsa,
// fail-safe olarak güncel modellere otomatik düşülür.
// GROQ_MODEL env değişkeniyle override edilebilir.
const MODEL_FALLBACKS = [
  process.env.GROQ_MODEL,
  "llama3-8b-8192",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
].filter(Boolean) as string[];

interface Body {
  request: string;
  weather: Weather | null;
  wardrobe: { name: string; type?: string; color?: string; style?: string }[];
}

export async function POST(req: NextRequest) {
  const groqKeys = getGroqKeys();
  if (groqKeys.length === 0) {
    return NextResponse.json(
      { error: "GROQ_API_KEY tanımlı değil (.env.local dosyasını kontrol edin)" },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
    if (!body.request?.trim()) throw new Error();
  } catch {
    return NextResponse.json({ error: "İstek metni boş" }, { status: 400 });
  }

  // --- Bağlamı (prompt) oluştur -----------------------------------------
  const weatherLine = body.weather
    ? `${Math.round(body.weather.temperature)}°C, ${body.weather.description}, rüzgar ${Math.round(body.weather.windspeed)} km/s`
    : "bilinmiyor";

  const wardrobeLines =
    body.wardrobe.length > 0
      ? body.wardrobe
          .map(
            (w) =>
              `- ${w.name} (${[w.type, w.color, w.style].filter(Boolean).join(", ")})`,
          )
          .join("\n")
      : "(Dolapta etiketlenmiş kıyafet yok — genel öneri yap.)";

  // Dolaptaki geçerli isimler (eşleştirme için)
  const validNames = body.wardrobe.map((w) => w.name);

  const systemPrompt = `Sen profesyonel bir moda ve stil danışmanısın. Türkçe, samimi ve net konuşursun.
Kullanıcının planına, hava durumuna ve dolabındaki kıyafetlere göre SOMUT bir kombin öner.
- Mümkünse kullanıcının dolabındaki parçaları İSİMLERİYLE kullan.
- Hava durumuna uygun (sıcaklık/yağış) seçimler yap.
- Kısa bir gerekçe ekle ve 1-2 küçük stil ipucu ver.
- Madde işaretleri ve emoji kullanabilirsin ama abartma. Yanıtı kısa tut (en fazla ~150 kelime).

ÖNEMLİ: Yanıtının EN SONUNA, ayrı bir satırda, önerdiğin kombindeki dolap parçalarının TAM adlarını şu formatta yaz:
KOMBİN: parça adı 1 | parça adı 2 | parça adı 3
Sadece dolapta GERÇEKTEN var olan parça adlarını kullan. Kombin önermiyorsan (genel soru ise) bu satırı hiç yazma.`;

  const userPrompt = `Planım: ${body.request}
Hava durumu: ${weatherLine}
Dolabımdaki kıyafetler:
${wardrobeLines}`;

  let lastError: unknown;

  // Dış döngü: Groq anahtarları (rotation) — iç döngü: model fallback
  keyLoop: for (let k = 0; k < groqKeys.length; k++) {
    const groq = new Groq({ apiKey: groqKeys[k] });

    for (const model of MODEL_FALLBACKS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          temperature: 0.7,
          max_tokens: 400,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const fullText =
          completion.choices[0]?.message?.content?.trim() ||
          "Üzgünüm, şu an bir öneri üretemedim.";

        const { advice, recommended } = extractOutfit(fullText, validNames);
        return NextResponse.json({ advice, recommended, model });
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : "";
        // Limit hatası → sıradaki ANAHTARı dene
        if (isGroqRateLimit(err)) {
          if (k < groqKeys.length - 1) {
            console.warn(`[advice] Groq anahtarı #${k + 1} limitte, #${k + 2}'ye geçiliyor…`);
            continue keyLoop;
          }
          break keyLoop;
        }
        // Model kaldırıldıysa → sıradaki MODELi dene
        const isModelIssue =
          /decommission|not found|does not exist|invalid_request/i.test(msg);
        if (!isModelIssue) break keyLoop; // başka hata → dur
      }
    }
  }

  return NextResponse.json(
    {
      error: isGroqRateLimit(lastError)
        ? "Tüm Groq kotaları şu an dolu. Birkaç dakika sonra tekrar deneyin (veya .env.local'e yeni bir GROQ anahtarı ekleyin)."
        : lastError instanceof Error
          ? lastError.message
          : "Öneri üretilemedi",
    },
    { status: 502 },
  );
}

/**
 * Yanıttan "KOMBİN: a | b | c" satırını ayıklar, görünen metinden temizler
 * ve isimleri dolaptaki gerçek parça adlarıyla eşleştirir.
 */
function extractOutfit(
  text: string,
  validNames: string[],
): { advice: string; recommended: string[] } {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => /^\s*KOMB[İI]N\s*:/i.test(l));
  if (idx === -1) return { advice: text, recommended: [] };

  const line = lines[idx].replace(/^\s*KOMB[İI]N\s*:/i, "");
  const names = line
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Görünen metinden KOMBİN satırını çıkar
  const advice = [...lines.slice(0, idx), ...lines.slice(idx + 1)]
    .join("\n")
    .trim();

  // Esnek eşleştirme: birebir ya da içeren isim
  const norm = (s: string) => s.toLocaleLowerCase("tr").trim();
  const recommended: string[] = [];
  for (const n of names) {
    const match =
      validNames.find((v) => norm(v) === norm(n)) ??
      validNames.find((v) => norm(v).includes(norm(n)) || norm(n).includes(norm(v)));
    if (match && !recommended.includes(match)) recommended.push(match);
  }

  return { advice, recommended };
}
