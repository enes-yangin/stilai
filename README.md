# StilAI — Sanal Gardırop & Stil Danışmanı

AI destekli gardırop yönetimi, sanal giydirme (VTON) ve kombin önerisi uygulaması.

## Özellikler

- **Sanal Gardırop** — Kıyafet yükle, AI ile otomatik etiketle, yıkanma/yıpranma takibi
- **Arka Plan Kaldırma** — `briaai/RMBG-1.4` ile otomatik transparan PNG
- **Sanal Giydirme (VTON)** — Üst beden → IDM-VTON · Alt beden/elbise → Leffa
- **Kombin Önerisi** — Hava durumu + gardırop verisiyle Groq LLM önerileri
- **Kıyafet Analizi** — Gemini Vision ile otomatik etiket çıkarımı
- **Kimlik Doğrulama** — bcrypt şifreleme, Prisma/SQLite veritabanı
- **Çok Dilli** — Türkçe / İngilizce

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Stil | Tailwind CSS |
| Veritabanı | Prisma + SQLite |
| AI — VTON | HuggingFace Gradio (IDM-VTON, Leffa) |
| AI — Arka Plan | HuggingFace Inference (RMBG-1.4) |
| AI — Analiz | Google Gemini Vision |
| AI — Kombin | Groq (LLaMA) |
| Hava Durumu | Open-Meteo (ücretsiz, anahtarsız) |

## Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.local.example .env.local
# .env.local dosyasını düzenleyip anahtarları gir (aşağıya bak)

# 3. Veritabanını oluştur
npx prisma migrate dev

# 4. Geliştirme sunucusunu başlat
npm run dev
```

## Ortam Değişkenleri

`.env.local.example` dosyasını kopyala ve doldur:

| Değişken | Kaynak | Zorunlu |
|---|---|---|
| `HF_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | ✅ |
| `HF_TOKENS` | Aynı kaynak, virgülle ayrılmış çoklu token | İsteğe bağlı |
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | ✅ |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) | ✅ |
| `DATABASE_URL` | `file:./prisma/dev.db` | ✅ |
| `NEXTAUTH_SECRET` | Rastgele min 32 karakter string | ✅ |

> Tüm servisler **ücretsiz katman** sunar.

## Token Rotation

VTON ve Groq çağrılarında rate limit'e karşı çoklu token desteği:

```env
HF_TOKENS=hf_token1,hf_token2,hf_token3
GROQ_API_KEYS=gsk_key1,gsk_key2
```

Bir token limite takılınca sistem otomatik olarak sıradakine geçer.

## Proje Yapısı

```
app/
├── api/           — Route Handlers (VTON, analiz, auth, hava, gardırop)
├── page.tsx       — Ana uygulama
└── layout.tsx     — Kök layout + fontlar

components/
├── WardrobePanel.tsx      — Gardırop paneli
└── VirtualCabinPanel.tsx  — Sanal kabin paneli

lib/
├── types.ts        — TypeScript tipleri
├── category.ts     — Kıyafet kategori mantığı
├── groqKeys.ts     — Groq token rotation
├── prisma.ts       — Prisma client singleton
└── i18n.ts         — TR/EN çeviri sistemi

prisma/
└── schema.prisma   — Veritabanı şeması
```

## Güvenlik

- Şifreler **bcrypt (cost 10)** ile hashlenir, düz metin asla saklanmaz
- API anahtarları yalnızca sunucu tarafında kullanılır (Route Handlers)
- `.env.local` ve SQLite veritabanı `.gitignore`'a dahildir
- `NEXTAUTH_SECRET` en az 32 karakter olmalıdır (`openssl rand -base64 32`)

## Derleme & Kontrol

```bash
npm run build         # Üretim derlemesi
npx tsc --noEmit      # TypeScript kontrolü
npm run lint          # ESLint kontrolü
```
