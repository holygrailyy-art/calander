import { prisma } from "@/lib/prisma";

export async function createExpense(params: {
  amount: number;
  category: string;
  description?: string;
  date: string;
}) {
  return prisma.expense.create({
    data: {
      amount: params.amount,
      category: params.category,
      description: params.description || null,
      date: new Date(params.date),
    },
  });
}

export async function queryExpenses(params: {
  from?: string;
  to?: string;
  category?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params.from || params.to) {
    const date: Record<string, Date> = {};
    if (params.from) date.gte = new Date(params.from);
    if (params.to) date.lte = new Date(params.to);
    where.date = date;
  }
  if (params.category) where.category = params.category;
  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function updateExpense(params: {
  id: string;
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
}) {
  const { id, ...updates } = params;
  const data: Record<string, unknown> = {};
  if (updates.amount !== undefined) data.amount = updates.amount;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.date !== undefined) data.date = new Date(updates.date);
  return prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense(params: { id: string }) {
  return prisma.expense.delete({ where: { id: params.id } });
}
