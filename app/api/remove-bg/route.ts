import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { toBlob } from "@/lib/serverImage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "briaai/RMBG-1.4";

export async function POST(req: NextRequest) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "HF_TOKEN tanımlı değil (.env.local dosyasını kontrol edin)" },
      { status: 500 },
    );
  }

  let image: string;
  try {
    ({ image } = await req.json());
    if (!image) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Görsel gönderilmedi" },
      { status: 400 },
    );
  }

  try {
    const hf = new HfInference(token);
    const blob = await toBlob(image);

    // RMBG: görsel girdi → transparan PNG çıktı
    const result = await hf.imageToImage({
      model: MODEL,
      inputs: blob,
      parameters: {},
    });

    // Çıktı bir Blob — bunu base64 data URL'ye çevir
    const buffer = await (result as Blob).arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const resultUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ resultUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Arka plan kaldırılamadı";
    return NextResponse.json(
      {
        error:
          msg.toLowerCase().includes("503") ||
          msg.toLowerCase().includes("loading")
            ? "Model yükleniyor, lütfen birkaç saniye sonra tekrar deneyin."
            : msg,
      },
      { status: 502 },
    );
  }
}
