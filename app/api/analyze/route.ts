import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import type { GarmentTags } from "@/lib/types";
import { getGroqKeys, isGroqRateLimit } from "@/lib/groqKeys";

export const runtime = "nodejs";
export const maxDuration = 60;

// gemini-1.5-flash kullanımdan kalktı; güncel ve ücretsiz kotası bol model:
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_VISION =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

const PROMPT = `Bu bir kıyafet fotoğrafıdır. Görseldeki ANA kıyafet parçasını analiz et.
SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma, markdown kullanma:
{"type":"<kıyafet türü: Gömlek/Tişört/Pantolon/Ceket/Elbise/Ayakkabı/Kazak/Şort/Etek vb.>","color":"<ana renk, Türkçe>","style":"<tarz: Casual/Şık/Spor/Smart Casual/Klasik>"}`;

// Gemini anahtarlarını topla (rotation için). GEMINI_API_KEYS="k1,k2" veya tek GEMINI_API_KEY.
function geminiKeys(): string[] {
  const multi = (process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = process.env.GEMINI_API_KEY?.trim();
  return multi.length ? multi : single ? [single] : [];
}

function isQuota(msg: string): boolean {
  return /quota|rate.?limit|429|resource.?exhausted|exceeded|too many/i.test(msg);
}

export async function POST(req: NextRequest) {
  const groqKeys = getGroqKeys();
  const hasGroq = groqKeys.length > 0;
  const hasGemini = geminiKeys().length > 0;
  if (!hasGemini && !hasGroq) {
    return NextResponse.json(
      { error: "GROQ_API_KEY veya GEMINI_API_KEY tanımlı olmalı (.env.local)" },
      { status: 500 },
    );
  }

  let image: string;
  try {
    ({ image } = await req.json());
    if (!image) throw new Error();
  } catch {
    return NextResponse.json({ error: "Görsel gönderilmedi" }, { status: 400 });
  }

  if (image.startsWith("data:image/svg")) {
    return NextResponse.json(
      { error: "Bu örnek kıyafet için kendi fotoğrafınızı yükleyin." },
      { status: 400 },
    );
  }

  let inline: { mimeType: string; data: string };
  try {
    inline = await toInlineData(image);
  } catch {
    return NextResponse.json(
      { error: "Görsel okunamadı. Lütfen geçerli bir JPG/PNG yükleyin." },
      { status: 400 },
    );
  }

  const dataUrl = `data:${inline.mimeType};base64,${inline.data}`;
  let lastErr = "";

  // 1) GROQ VISION — birincil motor (bölge kısıtı yok), anahtar rotation'lı
  for (let i = 0; i < groqKeys.length; i++) {
    try {
      const groq = new Groq({ apiKey: groqKeys[i] });
      const completion = await groq.chat.completions.create({
        model: GROQ_VISION,
        temperature: 0.2,
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      return NextResponse.json({
        tags: parseTags(raw),
        engine: `groq:${GROQ_VISION}`,
      });
    } catch (err) {
      lastErr = err instanceof Error ? err.message : "groq error";
      // Limit hatasıysa sıradaki Groq anahtarını dene; değilse Gemini'ye geç
      if (i < groqKeys.length - 1 && isGroqRateLimit(err)) {
        console.warn("[analyze] Groq anahtarı limitte, sıradakine geçiliyor…");
        continue;
      }
      break;
    }
  }

  // 2) GEMINI — yedek (kullanılabilir bölgelerde), anahtar rotation'lı
  for (const key of geminiKeys()) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { temperature: 0.2, maxOutputTokens: 150 },
      });
      const result = await model.generateContent([
        { text: PROMPT },
        { inlineData: inline },
      ]);
      return NextResponse.json({
        tags: parseTags(result.response.text().trim()),
        engine: `gemini:${GEMINI_MODEL}`,
      });
    } catch (err) {
      lastErr = err instanceof Error ? err.message : "gemini error";
      if (!isQuota(lastErr)) break;
      console.warn("[analyze] Gemini anahtarı limitte, sıradakine geçiliyor…");
    }
  }

  // İkisi de başarısız
  const friendly =
    isQuota(lastErr) || /rate|429|capacity/i.test(lastErr)
      ? "Tüm AI analiz kotaları şu an dolu. Birkaç dakika sonra tekrar deneyin (veya .env.local'e yeni bir GROQ anahtarı ekleyin)."
      : lastErr || "Analiz başarısız";
  return NextResponse.json({ error: friendly }, { status: 502 });
}

/** dataURL veya http(s) URL'i {mimeType, base64} biçimine çevirir. */
async function toInlineData(
  src: string,
): Promise<{ mimeType: string; data: string }> {
  if (src.startsWith("data:")) {
    const m = /^data:(.+?);base64,(.*)$/.exec(src);
    if (!m) throw new Error("invalid data url");
    return { mimeType: m[1], data: m[2] };
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error("download failed");
  const buf = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  return { mimeType, data: buf.toString("base64") };
}

/** Model çıktısını GarmentTags'e dönüştürür; JSON yoksa metinden tahmin eder. */
function parseTags(raw: string): GarmentTags {
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      return {
        type: String(obj.type || "Kıyafet"),
        color: String(obj.color || "—"),
        style: String(obj.style || "Genel"),
        raw,
      };
    } catch {
      /* JSON bozuksa sezgisel yönteme düş */
    }
  }

  const lower = raw.toLowerCase();
  const find = (list: string[], fallback: string) =>
    list.find((w) => lower.includes(w)) ?? fallback;

  return {
    type: capitalize(
      find(
        ["shirt", "gömlek", "pant", "pantolon", "jacket", "ceket", "dress",
         "elbise", "shoe", "ayakkabı", "tişört", "t-shirt", "sweater", "kazak"],
        "Kıyafet",
      ),
    ),
    color: capitalize(
      find(
        ["black", "siyah", "white", "beyaz", "blue", "mavi", "lacivert",
         "red", "kırmızı", "green", "yeşil", "beige", "bej", "gray", "gri"],
        "—",
      ),
    ),
    style: capitalize(
      find(["casual", "formal", "şık", "spor", "sport", "smart"], "Genel"),
    ),
    raw,
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
