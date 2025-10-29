// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Iniciando seed do banco de dados...');

//   // Limpar dados existentes
//   await prisma.user.deleteMany();

//   // Criar usuários de exemplo
//   const users = await Promise.all([
//     prisma.user.create({
//       data: {
//         name: 'João Silva',
//         email: 'joao@example.com',
//       },
//     }),
//     prisma.user.create({
//       data: {
//         name: 'Maria Santos',
//         email: 'maria@example.com',
//       },
//     }),
//     prisma.user.create({
//       data: {
//         name: 'Pedro Oliveira',
//         email: 'pedro@example.com',
//       },
//     }),
//   ]);

//   console.log(`✅ ${users.length} usuários criados com sucesso!`);
// }

// main()
//   .catch((e) => {
//     console.error('❌ Erro ao executar seed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
