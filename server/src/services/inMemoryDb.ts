// Simple in-memory replacement for Prisma operations used by this project.
// Intended for local development when a real database isn't required.
type User = {
  id: number;
  name: string;
  cpf: string;
  cargo: string;
  matricula: string;
  createdAt: Date;
};

type AdvantageItem = {
  userId: number;
  name: string;
  amount: number;
  monthYear: string;
};

const users: User[] = [];
const advantagesByUser = new Map<number, AdvantageItem[]>();
let nextUserId = 1;

export const inMemoryDb = {
  // user equivalents
  user: {
    findMany: async ({ orderBy }: { orderBy?: { createdAt: 'desc' | 'asc' } } = {}) => {
      const arr = users.slice();
      if (orderBy?.createdAt === 'desc') arr.sort((a, b) => +b.createdAt - +a.createdAt);
      if (orderBy?.createdAt === 'asc') arr.sort((a, b) => +a.createdAt - +b.createdAt);
      return arr;
    },
    findUnique: async ({ where }: { where: { id?: number; cpf?: string } }) => {
      if (where.id !== undefined) return users.find((u) => u.id === where.id) || null;
      if (where.cpf !== undefined) return users.find((u) => u.cpf === where.cpf) || null;
      return null;
    },
    create: async ({ data }: { data: { name: string; cpf: string; cargo: string; matricula: string } }) => {
      const user: User = {
        id: nextUserId++,
        name: data.name,
        cpf: data.cpf,
        cargo: data.cargo,
        matricula: data.matricula,
        createdAt: new Date(),
      };
      users.push(user);
      return user;
    },
    update: async ({ where, data }: { where: { id: number }; data: Partial<Omit<User, 'id' | 'createdAt'>> }) => {
      const idx = users.findIndex((u) => u.id === where.id);
      if (idx === -1) {
        const e: any = new Error('Record not found');
        e.code = 'P2025';
        throw e;
      }
      const existing = users[idx];
      const updated = { ...existing, ...data };
      users[idx] = updated as User;
      return users[idx];
    },
    delete: async ({ where }: { where: { id: number } }) => {
      const idx = users.findIndex((u) => u.id === where.id);
      if (idx === -1) {
        const e: any = new Error('Record not found');
        e.code = 'P2025';
        throw e;
      }
      users.splice(idx, 1);
      return true;
    },
  },

  // advantage equivalents
  advantage: {
    createMany: async ({ data }: { data: AdvantageItem[] }) => {
      let count = 0;
      for (const it of data) {
        const arr = advantagesByUser.get(it.userId) || [];
        arr.push({ userId: it.userId, name: it.name, amount: it.amount, monthYear: it.monthYear });
        advantagesByUser.set(it.userId, arr);
        count++;
      }
      return { count };
    },
  },

  // helpers used by other parts of the app
  _internal: {
    getAdvantagesForUser(userId: number) {
      return advantagesByUser.get(userId) || [];
    },
    clearAll() {
      users.length = 0;
      advantagesByUser.clear();
      nextUserId = 1;
    },
  },
};

export type { User, AdvantageItem };
