import { CreateUserDto, UpdateUserDto } from '../types';
import { inMemoryDb, User } from './inMemoryDb';

export class UserService {
  static async getAllUsers() {
    return inMemoryDb.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async getUserById(id: number) {
    return inMemoryDb.user.findUnique({ where: { id } });
  }

  static async getUserByCpf(cpf: string) {
    return inMemoryDb.user.findUnique({ where: { cpf } });
  }

  static async createUser(data: CreateUserDto) {
    return inMemoryDb.user.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        cargo: data.cargo,
        matricula: data.matricula,
      }
    });
  }

  static async updateUser(id: number, data: UpdateUserDto) {
    return inMemoryDb.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.cpf !== undefined ? { cpf: data.cpf } : {}),
        ...(data.cargo !== undefined ? { cargo: data.cargo } : {}),
        ...(data.matricula !== undefined ? { matricula: data.matricula } : {}),
      }
    });
  }

  static async deleteUser(id: number) {
    await inMemoryDb.user.delete({ where: { id } });
    return true;
  }
}
