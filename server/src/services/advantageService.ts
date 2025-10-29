import prisma from "../config/database";

export interface CreateAdvantageItem {
  name: string;
  amount: number;
  monthYear: string;
}

export class AdvantageService {
  static async createMany(userId: number, items: CreateAdvantageItem[]) {
    if (!items || items.length === 0) return { count: 0 };
    // Persist advantages linked to the user
    return prisma.advantage.createMany({
      data: items.map((it) => ({
        userId,
        name: it.name,
        amount: it.amount,
        monthYear: it.monthYear,
      })),
    });
  }
}
