import api from './api';
import { User, ApiResponse } from '../types';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data || [];
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },

  create: async (payload: Pick<User, 'name' | 'cpf' | 'cargo' | 'matricula'>): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', payload);
    return response.data.data!;
  },

  update: async (id: number, payload: Partial<Pick<User, 'name' | 'cpf' | 'cargo' | 'matricula'>>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
