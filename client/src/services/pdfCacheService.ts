import api from './api';

export type CachedUserSummary = {
  cpf: string;
  name: string;
  matricula: string;
  cargo: string;
  tipoServidor?: 'ativo' | 'aposentado';
  advantagesCount: number;
  discountsCount: number;
  expiresAt: number;
};

export type CachedUserDetail = {
  cpf: string;
  name: string;
  matricula: string;
  cargo: string;
  tipoServidor?: 'ativo' | 'aposentado';
  advantages: { name: string; amount: number; monthYear: string; paidMonthYear?: string }[];
  discounts: { name: string; amount: number; monthYear: string; paidMonthYear?: string }[];
  expiresAt: number;
  createdAt: number;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const pdfCacheService = {
  listCachedUsers: async (): Promise<CachedUserSummary[]> => {
    const res = await api.get<ApiResponse<CachedUserSummary[]>>('/pdf/data-cache/users');
    return res.data.data || [];
  },
  getCachedUser: async (cpf: string): Promise<CachedUserDetail> => {
    const res = await api.get<ApiResponse<CachedUserDetail>>(`/pdf/data-cache/users/${cpf}`);
    return res.data.data as CachedUserDetail;
  },
  deleteCachedUser: async (cpf: string): Promise<void> => {
    await api.delete(`/pdf/data-cache/users/${cpf}`);
  },
  clearCache: async (): Promise<void> => {
    await api.delete('/pdf/data-cache'); // Endpoint to clear all cached data
  }
  ,
  downloadExcelByFileName: async (fileName: string): Promise<void> => {
    if (!fileName) throw new Error('fileName is required');
    const res = await api.get(`/pdf/download/${encodeURIComponent(fileName)}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  downloadExcelByCpf: async (cpf: string): Promise<void> => {
    if (!cpf) throw new Error('cpf is required');
    const res = await api.get(`/pdf/generate/${encodeURIComponent(cpf)}`, {
      responseType: 'blob',
    });
    // Try to obtain filename from headers, fallback to cpf
    const disposition = res.headers['content-disposition'] as string | undefined;
    let fileName = `${cpf}.xlsx`;
    if (disposition) {
      const m = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
      if (m) fileName = m[1];
    }
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
