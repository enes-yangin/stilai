// Open-Meteo WMO hava durumu kodlarının Türkçe karşılıkları + emoji
// https://open-meteo.com/en/docs (Weather variable documentation)

interface CodeInfo {
  description: string;
  emoji: string;
}

const MAP: Record<number, CodeInfo> = {
  0: { description: "Açık", emoji: "☀️" },
  1: { description: "Genelde açık", emoji: "🌤️" },
  2: { description: "Parçalı bulutlu", emoji: "⛅" },
  3: { description: "Kapalı", emoji: "☁️" },
  45: { description: "Sisli", emoji: "🌫️" },
  48: { description: "Kırağılı sis", emoji: "🌫️" },
  51: { description: "Hafif çisenti", emoji: "🌦️" },
  53: { description: "Çisenti", emoji: "🌦️" },
  55: { description: "Yoğun çisenti", emoji: "🌧️" },
  61: { description: "Hafif yağmur", emoji: "🌦️" },
  63: { description: "Yağmur", emoji: "🌧️" },
  65: { description: "Şiddetli yağmur", emoji: "🌧️" },
  66: { description: "Donan yağmur", emoji: "🌧️" },
  67: { description: "Şiddetli donan yağmur", emoji: "🌧️" },
  71: { description: "Hafif kar", emoji: "🌨️" },
  73: { description: "Kar", emoji: "❄️" },
  75: { description: "Yoğun kar", emoji: "❄️" },
  77: { description: "Kar taneleri", emoji: "🌨️" },
  80: { description: "Hafif sağanak", emoji: "🌦️" },
  81: { description: "Sağanak", emoji: "🌧️" },
  82: { description: "Şiddetli sağanak", emoji: "⛈️" },
  85: { description: "Hafif kar sağanağı", emoji: "🌨️" },
  86: { description: "Kar sağanağı", emoji: "❄️" },
  95: { description: "Gök gürültülü fırtına", emoji: "⛈️" },
  96: { description: "Dolulu fırtına", emoji: "⛈️" },
  99: { description: "Şiddetli dolulu fırtına", emoji: "⛈️" },
};

export function describeWeather(code: number): CodeInfo {
  return MAP[code] ?? { description: "Bilinmiyor", emoji: "🌡️" };
}
