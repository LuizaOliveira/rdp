export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateUserDto {
  name: string;
  cpf: string;
  cargo: string;
  matricula: string;
}

export interface UpdateUserDto {
  name?: string;
  cpf?: string;
  cargo?: string;
  matricula?: string;
}
