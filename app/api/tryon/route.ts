import { NextRequest, NextResponse } from "next/server";
import { Client } from "@gradio/client";
import { toBlob } from "@/lib/serverImage";
import type { ClothType } from "@/lib/category";

export const runtime = "nodejs";
// VTON üretimi uzun sürebilir — süre limitini yükselt.
export const maxDuration = 300;

// İki motorlu akıllı yönlendirme (her ikisi de kategoriyi doğru bölgeye uygular):
//   • upper_body          → IDM-VTON  (kıyafet açıklamasını kullanır; üst bedende en kaliteli)
//   • lower_body / dress  → Leffa     (upper/lower/dress kategorili; doğru bölge maskeleme)
const IDM_VTON = "yisol/IDM-VTON";
const LEFFA = "franciszzj/Leffa";

interface Body {
  person_img: string;
  garment_img: string;
  garment_desc?: string;
  cloth_type?: ClothType; // "upper_body" | "lower_body" | "dress"
}

// ── Token Rotation ─────────────────────────────────────────────────────────
// HF_TOKENS="hf_a,hf_b,hf_c" → biri limite/CPU hatasına takılırsa sıradakine geçer.
function getHfTokens(): (`hf_${string}` | undefined)[] {
  const multi = (process.env.HF_TOKENS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = process.env.HF_TOKEN?.trim();
  const list = multi.length ? multi : single ? [single] : [];
  // En az bir eleman (undefined = anonim erişim)
  return (list.length ? list : [undefined]) as (`hf_${string}` | undefined)[];
}

// Rate limit / CPU / kapasite hatalarını tanı (rotasyonu tetikler)
function isRateLimit(err: unknown): boolean {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /quota|rate.?limit|too many|exceeded|429|gpu task aborted|\bcpu\b|capacity|overloaded|busy|unavailable|503/.test(
    m,
  );
}

/**
 * Verilen işlevi sırayla tokenlarla dener. Limit/CPU hatası gelirse sıradaki
 * tokenla yeniden dener (Token Rotation). Diğer hatalarda hemen durur.
 */
async function withTokenRotation<T>(
  fn: (token: `hf_${string}` | undefined) => Promise<T>,
): Promise<T> {
  const tokens = getHfTokens();
  let lastErr: unknown;
  for (let i = 0; i < tokens.length; i++) {
    try {
      return await fn(tokens[i]);
    } catch (err) {
      lastErr = err;
      const canRetry = i < tokens.length - 1 && isRateLimit(err);
      if (!canRetry) throw err;
      console.warn(
        `[VTON] Token #${i + 1} limit/CPU hatası, #${i + 2}'ye geçiliyor…`,
      );
    }
  }
  throw lastErr;
}

// ── Handler ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
    if (!body.person_img || !body.garment_img) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "person_img ve garment_img gereklidir" },
      { status: 400 },
    );
  }

  const clothType: ClothType = body.cloth_type ?? "upper_body";

  try {
    const [personBlob, garmentBlob] = await Promise.all([
      toBlob(body.person_img),
      toBlob(body.garment_img),
    ]);

    const resultUrl =
      clothType === "upper_body"
        ? await tryOnIDM(personBlob, garmentBlob, body.garment_desc)
        : await tryOnLeffa(personBlob, garmentBlob, clothType);

    if (!resultUrl) {
      return NextResponse.json(
        { error: "VTON modeli görsel döndürmedi" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      resultUrl,
      engine: clothType === "upper_body" ? "idm-vton" : "leffa",
    });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 502 });
  }
}

/**
 * IDM-VTON /tryon — üst beden, kıyafet açıklaması destekli (token rotation'lı).
 * İmza: [Human(ImageEditor), Garment, açıklama, auto-mask, auto-crop, steps, seed]
 */
async function tryOnIDM(
  person: Blob,
  garment: Blob,
  desc: string | undefined,
): Promise<string | undefined> {
  return withTokenRotation(async (token) => {
    const client = await Client.connect(IDM_VTON, { hf_token: token });
    const result = await client.predict("/tryon", [
      { background: person, layers: [], composite: null }, // Human
      garment, // Garment
      desc?.trim() || "kıyafet", // garment_description (DİNAMİK)
      true, // otomatik maske
      true, // otomatik kırpma — vücudu hizalar, sadakati artırır
      40, // denoising steps
      42, // seed
    ]);
    return extractUrl(result.data);
  });
}

/**
 * Leffa /leffa_predict_vt — alt beden / elbise, kategori bazlı (token rotation'lı).
 * İmza: [person, garment, accelerate, steps, guidance, seed,
 *        model_type('viton_hd'|'dress_code'), garment_type, repaint]
 */
async function tryOnLeffa(
  person: Blob,
  garment: Blob,
  clothType: Exclude<ClothType, "upper_body">,
): Promise<string | undefined> {
  const isDress = clothType === "dress";
  const garmentType = isDress ? "dresses" : "lower_body";
  const modelType = isDress ? "dress_code" : "viton_hd";

  return withTokenRotation(async (token) => {
    const client = await Client.connect(LEFFA, { hf_token: token });
    const result = await client.predict("/leffa_predict_vt", [
      person,
      garment,
      false, // Accelerate Reference UNet
      40, // Inference Steps
      2.5, // Guidance Scale
      42, // Random Seed
      modelType,
      garmentType,
      false, // Repaint Mode
    ]);
    return extractUrl(result.data);
  });
}

function extractUrl(data: unknown): string | undefined {
  const arr = data as Array<{ url?: string; path?: string } | string>;
  const first = arr?.[0];
  return typeof first === "string" ? first : first?.url ?? first?.path;
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Giydirme başarısız";
  const low = msg.toLowerCase();
  if (low.includes("quota") || isRateLimit(err))
    return "Tüm ücretsiz GPU tokenları şu an dolu/yoğun. Birkaç dakika sonra tekrar deneyin (veya .env.local içine yeni bir HF tokenı ekleyin).";
  if (low.includes("accelerator") || low.includes("gpu"))
    return "GPU şu an yanıt vermedi (ücretsiz katman). Lütfen birkaç dakika sonra tekrar deneyin.";
  if (low.includes("index"))
    return "Fotoğrafta kişi/poz net algılanamadı. Tüm vücudun göründüğü, önden çekilmiş net bir fotoğraf kullanın.";
  return msg;
}
