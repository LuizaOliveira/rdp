import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAllUsers();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const user = await UserService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, cpf, cargo, matricula } = req.body;
      
      if (!name || !cpf || !cargo || !matricula) {
        return res.status(400).json({
          success: false,
          message: 'Nome, CPF, cargo e matrícula são obrigatórios'
        });
      }

      // Verificar se o CPF já existe
      const existingCpf = await UserService.getUserByCpf(cpf);
      if (existingCpf) {
        return res.status(400).json({
          success: false,
          message: 'CPF já está em uso'
        });
      }
      const user = await UserService.createUser({ name, cpf, cargo, matricula });
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
  const { name, cpf, cargo, matricula } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!name && !cpf && !cargo && !matricula) {
        return res.status(400).json({
          success: false,
          message: 'Forneça pelo menos um campo para atualizar'
        });
      }

      // Verificar se o CPF já está em uso por outro usuário
      if (cpf) {
        const existingCpf = await UserService.getUserByCpf(cpf);
        if (existingCpf && existingCpf.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'CPF já está em uso'
          });
        }
      }
      
      const user = await UserService.updateUser(id, { name, cpf, cargo, matricula });
      
      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      await UserService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      next(error);
    }
  }
}
