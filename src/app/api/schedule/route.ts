import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    const startTime: Record<string, Date> = {};
    if (from) startTime.gte = new Date(from);
    if (to) startTime.lte = new Date(to);
    where.startTime = startTime;
  }

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(schedules);
}
