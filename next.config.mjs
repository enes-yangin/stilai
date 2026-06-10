/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // VTON / Hugging Face sonuçlarının uzak URL'lerden gösterilebilmesi için
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
