import { prisma } from "@/lib/prisma";

export async function createSchedule(params: {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
}) {
  return prisma.schedule.create({
    data: {
      title: params.title,
      description: params.description || null,
      startTime: new Date(params.startTime),
      endTime: params.endTime ? new Date(params.endTime) : null,
      location: params.location || null,
    },
  });
}

export async function querySchedules(params: { from?: string; to?: string }) {
  const where: Record<string, unknown> = {};
  if (params.from || params.to) {
    const startTime: Record<string, Date> = {};
    if (params.from) startTime.gte = new Date(params.from);
    if (params.to) startTime.lte = new Date(params.to);
    where.startTime = startTime;
  }
  return prisma.schedule.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
}

export async function updateSchedule(params: {
  id: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
}) {
  const { id, ...updates } = params;
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.startTime !== undefined) data.startTime = new Date(updates.startTime);
  if (updates.endTime !== undefined) data.endTime = updates.endTime ? new Date(updates.endTime) : null;
  if (updates.location !== undefined) data.location = updates.location;
  return prisma.schedule.update({ where: { id }, data });
}

export async function deleteSchedule(params: { id: string }) {
  return prisma.schedule.delete({ where: { id: params.id } });
}

export async function deleteSchedulesByDateRange(params: { from: string; to: string }) {
  return prisma.schedule.deleteMany({
    where: {
      startTime: {
        gte: new Date(params.from),
        lte: new Date(params.to),
      },
    },
  });
}
