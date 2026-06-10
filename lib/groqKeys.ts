// Groq API anahtar(lar)ı — rotation desteği.
// GROQ_API_KEYS="gsk_a,gsk_b" (virgülle) veya tek GROQ_API_KEY.

export function getGroqKeys(): string[] {
  const multi = (process.env.GROQ_API_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const single = process.env.GROQ_API_KEY?.trim();
  return multi.length ? multi : single ? [single] : [];
}

/** Limit/kapasite hatası mı? (rotasyonu tetikler) */
export function isGroqRateLimit(err: unknown): boolean {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /rate.?limit|quota|429|too many|over.?capacity|capacity|503|service unavailable/.test(
    m,
  );
}

/**
 * Verilen işlevi sırayla Groq anahtarlarıyla dener; limit hatasında sıradakine geçer.
 * Diğer hatalarda hemen durur.
 */
export async function withGroqRotation<T>(
  fn: (apiKey: string) => Promise<T>,
): Promise<T> {
  const keys = getGroqKeys();
  if (keys.length === 0) throw new Error("GROQ_API_KEY tanımlı değil");
  let lastErr: unknown;
  for (let i = 0; i < keys.length; i++) {
    try {
      return await fn(keys[i]);
    } catch (err) {
      lastErr = err;
      const canRetry = i < keys.length - 1 && isGroqRateLimit(err);
      if (!canRetry) throw err;
      console.warn(`[Groq] Anahtar #${i + 1} limitte, #${i + 2}'ye geçiliyor…`);
    }
  }
  throw lastErr;
}
