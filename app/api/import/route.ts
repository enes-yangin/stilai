import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Gerçek tarayıcı gibi davranan başlıklar (bot engellerini aşmaya yardımcı olur)
function browserHeaders(referer?: string): Record<string, string> {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    ...(referer ? { Referer: referer } : {}),
  };
}

// POST /api/import  { url }  →  { image: dataURL }
export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
    if (!url || !/^https?:\/\//i.test(url)) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Geçerli bir ürün/görsel linki girin (http/https)." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url, {
      headers: browserHeaders(),
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") || "";

    // 1) Doğrudan bir görsel linkiyse → direkt kullan
    if (contentType.startsWith("image/")) {
      if (!res.ok) throw new Error(`Görsel açılamadı (${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      return NextResponse.json({
        image: `data:${contentType};base64,${buf.toString("base64")}`,
      });
    }

    if (!res.ok) {
      // Sayfa bot'u engelledi → kullanıcıyı doğrudan görsel linkine yönlendir
      return NextResponse.json(
        {
          error:
            "Bu mağaza otomatik erişimi engelliyor. Ürün görselinin üstüne sağ tıklayıp “Görsel adresini kopyala” deyip o linki yapıştırın.",
        },
        { status: 422 },
      );
    }

    // 2) HTML sayfası → ana ürün görselini bul
    const html = await res.text();
    const imageUrl = extractMainImage(html, url);
    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "Sayfada ürün görseli bulunamadı. Ürün görselinin linkini (sağ tık → Görsel adresini kopyala) yapıştırmayı deneyin.",
        },
        { status: 422 },
      );
    }

    const imgRes = await fetch(imageUrl, {
      headers: browserHeaders(url),
      redirect: "follow",
    });
    if (!imgRes.ok) throw new Error(`Görsel indirilemedi (${imgRes.status})`);
    const mime = imgRes.headers.get("content-type") || "image/jpeg";
    if (!mime.startsWith("image/")) throw new Error("Geçerli bir görsel değil");
    const buf = Buffer.from(await imgRes.arrayBuffer());

    return NextResponse.json({
      image: `data:${mime};base64,${buf.toString("base64")}`,
      sourceUrl: url,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "İçe aktarma başarısız. Görsel linkini doğrudan yapıştırmayı deneyin.",
      },
      { status: 502 },
    );
  }
}

/** HTML'den ana ürün görselini birçok kaynaktan çıkarmaya çalışır. */
function extractMainImage(html: string, baseUrl: string): string | null {
  const candidates: (string | null)[] = [];

  // 1) og:image / twitter:image (her iki attribute sırası)
  const metaRe =
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]*?content=["']([^"']+)["']/gi;
  const metaRe2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]*?(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/gi;
  for (const re of [metaRe, metaRe2]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) candidates.push(m[1]);
  }

  // 2) JSON-LD "image": "..." veya "image": ["...", ...]
  const ldImg = html.match(/"image"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
  if (ldImg) candidates.push(ldImg[1]);
  const ldArr = html.match(/"image"\s*:\s*\[\s*"([^"]+)"/i);
  if (ldArr) candidates.push(ldArr[1]);

  // 3) <link rel="image_src">
  const linkImg = html.match(
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  );
  if (linkImg) candidates.push(linkImg[1]);

  // 4) itemprop="image"
  const itemprop = html.match(
    /<[^>]+itemprop=["']image["'][^>]*?(?:content|src)=["']([^"']+)["']/i,
  );
  if (itemprop) candidates.push(itemprop[1]);

  // 5) Yedek: ilk anlamlı <img src>
  const img = html.match(
    /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
  );
  if (img) candidates.push(img[1]);

  const first = candidates.find((c) => c && c.trim());
  return first ? absolutize(decodeHtml(first), baseUrl) : null;
}

function decodeHtml(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/g, "/").replace(/&#47;/g, "/");
}

function absolutize(src: string, baseUrl: string): string {
  if (src.startsWith("//")) return "https:" + src;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}
