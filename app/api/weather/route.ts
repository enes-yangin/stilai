import { NextRequest, NextResponse } from "next/server";
import { describeWeather } from "@/lib/weatherCodes";
import type { Weather } from "@/lib/types";

// Konum alınamazsa kullanılacak varsayılan koordinatlar
const DEFAULT = { lat: 37.76, lon: 30.55 };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "") || DEFAULT.lat;
  const lon = parseFloat(searchParams.get("lon") ?? "") || DEFAULT.lon;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}&current_weather=true`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Open-Meteo isteği başarısız oldu" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const cw = data.current_weather;
    if (!cw) {
      return NextResponse.json(
        { error: "Hava durumu verisi bulunamadı" },
        { status: 502 },
      );
    }

    const { description, emoji } = describeWeather(cw.weathercode);

    const weather: Weather = {
      temperature: cw.temperature,
      windspeed: cw.windspeed,
      weathercode: cw.weathercode,
      description,
      emoji,
      isDay: cw.is_day === 1,
      location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    };

    return NextResponse.json(weather);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Hava durumu alınamadı",
      },
      { status: 500 },
    );
  }
}
