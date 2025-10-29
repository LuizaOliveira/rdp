// Shared client-side types aligned with the server API

export interface User {
  id: number;
  name: string;
  cpf: string;
  cargo: string;
  matricula: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}