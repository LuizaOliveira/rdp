import crypto from 'crypto';

export interface AdvantageItem {
  name: string;
  amount: number;   // positivo (vantagem) ou negativo (desconto)
  monthYear: string; // MM/YYYY (mês de referência)
  paidMonthYear?: string; // MM/YYYY (mês de pagamento original)
}

export interface CachedUserData {
  cpf: string;
  name: string;
  cargo: string;
  matricula: string;
  tipoServidor?: 'ativo' | 'aposentado';
  advantages: AdvantageItem[];
  discounts: AdvantageItem[];
  createdAt: number;
  expiresAt: number;
}

export class DataCacheService {
  private static store = new Map<string, CachedUserData>(); // cpf -> data
  private static TTL_MS = Number(process.env.DATA_CACHE_TTL_MS ?? 30 * 60 * 1000); // 30 min
  private static MAX_USERS = Number(process.env.DATA_CACHE_MAX_USERS ?? 10);

  static setForCpf(cpf: string, data: Omit<CachedUserData, 'createdAt'|'expiresAt'>) {
    const now = Date.now();
    const payload: CachedUserData = { ...data, createdAt: now, expiresAt: now + this.TTL_MS } as CachedUserData;

    if (this.store.has(cpf)) this.store.delete(cpf);
    while (this.store.size >= this.MAX_USERS) {
      const oldestKey = this.store.keys().next().value as string;
      this.store.delete(oldestKey);
    }
    this.store.set(cpf, payload);
  }

  static getByCpf(cpf: string): CachedUserData | undefined {
    const it = this.store.get(cpf);
    if (!it) return undefined;
    if (Date.now() > it.expiresAt) {
      this.store.delete(cpf);
      return undefined;
    }
    // touch LRU
    this.store.delete(cpf);
    this.store.set(cpf, it);
    return it;
  }

  static listSummaries() {
    const out = [] as Array<{
      cpf: string; name: string; matricula: string; cargo: string; tipoServidor?: 'ativo' | 'aposentado';
      advantagesCount: number; discountsCount: number; expiresAt: number;
    }>;
    const now = Date.now();
    for (const [cpf, v] of this.store.entries()) {
      if (now > v.expiresAt) continue;
      out.push({
        cpf,
        name: v.name,
        matricula: v.matricula,
        cargo: v.cargo,
        tipoServidor: v.tipoServidor,
        advantagesCount: v.advantages.length,
        discountsCount: v.discounts.length,
        expiresAt: v.expiresAt
      });
    }
    return out;
  }

  static deleteByCpf(cpf: string) {
    this.store.delete(cpf);
  }

  static generateKey() {
    return crypto.randomUUID();
  }

  static async cacheData(cpf: string, data: Omit<CachedUserData, 'createdAt' | 'expiresAt'>): Promise<void> {
    this.setForCpf(cpf, data);
  }

  static async getCachedData(cpf: string): Promise<CachedUserData | undefined> {
    return this.getByCpf(cpf);
  }
}

// limpeza periódica simples de expirados
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of (DataCacheService as any).store.entries()) {
    if (now > v.expiresAt) (DataCacheService as any).store.delete(k);
  }
}, 5 * 60 * 1000).unref();
