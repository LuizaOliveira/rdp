import prisma from '../config/database';
import { CreateUserDto, UpdateUserDto } from '../types';

export class UserService {
  static async getAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getUserById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async getUserByCpf(cpf: string) {
    return prisma.user.findUnique({ where: { cpf } });
  }

  static async createUser(data: CreateUserDto) {
    return prisma.user.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        cargo: data.cargo,
        matricula: data.matricula,
      }
    });
  }

  static async updateUser(id: number, data: UpdateUserDto) {
    return prisma.user.update({
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
    await prisma.user.delete({ where: { id } });
    return true;
  }
}
