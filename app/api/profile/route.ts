import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/profile  →  profil fotoğrafını kaydet/güncelle
export async function POST(req: NextRequest) {
  try {
    const { userId, profilePhoto } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId gereklidir" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: profilePhoto ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Profil fotoğrafı kaydedilemedi" },
      { status: 500 },
    );
  }
}
