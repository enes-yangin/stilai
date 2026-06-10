import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/wardrobe?userId=xxx  →  kullanıcının gardırop kıyafetleri
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId gereklidir" }, { status: 400 });
  }

  try {
    const items = await prisma.wardrobeItem.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const mapped = items.map((item) => ({
      id: item.id,
      name: item.name,
      frontImage: item.frontImage,
      backImage: item.backImage ?? undefined,
      originalImage: item.originalImage ?? undefined,
      isDirty: item.isDirty,
      wearCount: item.wearCount,
      tags: item.type
        ? { type: item.type, color: item.color ?? "", style: item.style ?? "" }
        : undefined,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Gardırop yüklenemedi" }, { status: 500 });
  }
}

// POST /api/wardrobe  →  yeni kıyafet ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, frontImage, backImage, originalImage, tags } = body;

    if (!userId || !name || !frontImage) {
      return NextResponse.json(
        { error: "userId, name ve frontImage gereklidir" },
        { status: 400 },
      );
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        userId,
        name,
        frontImage,
        backImage: backImage ?? null,
        originalImage: originalImage ?? null,
        type: tags?.type ?? null,
        color: tags?.color ?? null,
        style: tags?.style ?? null,
      },
    });

    return NextResponse.json({ id: item.id });
  } catch {
    return NextResponse.json({ error: "Kıyafet eklenemedi" }, { status: 500 });
  }
}

// PUT /api/wardrobe  →  kıyafet güncelle (isDirty, wearCount, tags, images)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "id ve userId gereklidir" }, { status: 400 });
    }

    // Güvenlik: sadece kendi kaydını güncelleyebilir
    const existing = await prisma.wardrobeItem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    await prisma.wardrobeItem.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.frontImage !== undefined && { frontImage: fields.frontImage }),
        ...(fields.backImage !== undefined && { backImage: fields.backImage }),
        ...(fields.originalImage !== undefined && { originalImage: fields.originalImage }),
        ...(fields.isDirty !== undefined && { isDirty: fields.isDirty }),
        ...(fields.wearCount !== undefined && { wearCount: fields.wearCount }),
        ...(fields.tags?.type !== undefined && { type: fields.tags.type }),
        ...(fields.tags?.color !== undefined && { color: fields.tags.color }),
        ...(fields.tags?.style !== undefined && { style: fields.tags.style }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

// DELETE /api/wardrobe?id=xxx&userId=xxx  →  kıyafet sil
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!id || !userId) {
    return NextResponse.json({ error: "id ve userId gereklidir" }, { status: 400 });
  }

  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    await prisma.wardrobeItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
