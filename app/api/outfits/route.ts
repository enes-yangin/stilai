import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/outfits?userId=...  → kullanıcının kombinleri
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId gereklidir" }, { status: 400 });
  }
  try {
    const rows = await prisma.outfit.findMany({
      where: { userId },
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    });
    const outfits = rows.map((o) => ({
      id: o.id,
      name: o.name,
      itemIds: safeParse(o.itemIds),
      isFavorite: o.isFavorite,
      source: o.source as "manual" | "ai",
    }));
    return NextResponse.json(outfits);
  } catch {
    return NextResponse.json({ error: "Kombinler yüklenemedi" }, { status: 500 });
  }
}

// POST /api/outfits  → yeni kombin oluştur
export async function POST(req: NextRequest) {
  try {
    const { userId, name, itemIds, source } = await req.json();
    if (!userId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "userId ve en az bir parça gereklidir" },
        { status: 400 },
      );
    }
    const created = await prisma.outfit.create({
      data: {
        userId,
        name: name?.trim() || "Kombin",
        itemIds: JSON.stringify(itemIds),
        source: source === "ai" ? "ai" : "manual",
      },
    });
    return NextResponse.json({
      id: created.id,
      name: created.name,
      itemIds: safeParse(created.itemIds),
      isFavorite: created.isFavorite,
      source: created.source,
    });
  } catch {
    return NextResponse.json({ error: "Kombin kaydedilemedi" }, { status: 500 });
  }
}

// PUT /api/outfits  → favori/isim güncelle
export async function PUT(req: NextRequest) {
  try {
    const { id, userId, isFavorite, name } = await req.json();
    if (!id || !userId) {
      return NextResponse.json({ error: "id ve userId gereklidir" }, { status: 400 });
    }
    const data: { isFavorite?: boolean; name?: string } = {};
    if (typeof isFavorite === "boolean") data.isFavorite = isFavorite;
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    await prisma.outfit.updateMany({ where: { id, userId }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}

// DELETE /api/outfits?id=...&userId=...
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!id || !userId) {
    return NextResponse.json({ error: "id ve userId gereklidir" }, { status: 400 });
  }
  try {
    await prisma.outfit.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
