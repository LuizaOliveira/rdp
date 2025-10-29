# Backend - API de Previdência

Backend desenvolvido com Node.js, TypeScript, Express, MySQL e Prisma ORM.

## 🚀 Tecnologias

- Node.js
- TypeScript
- Express
- Prisma ORM
- MySQL
- CORS

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações do MySQL:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

## 🗄️ Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migration
npm run prisma:migrate

# (Opcional) Popular banco com dados de exemplo
npm run prisma:seed

# Abrir Prisma Studio (interface visual)
npm run prisma:studio
```

## 🏃 Executar

```bash
# Modo desenvolvimento
npm run dev

# Build
npm run build

# Modo produção
npm start
```

## 📍 Rotas da API

- `GET /` - Status da API
- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Buscar usuário por ID
- `POST /api/users` - Criar novo usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Exemplo de requisição POST /api/users

```json
{
  "name": "João Silva",
  "email": "joao@example.com"
}
```

## 📁 Estrutura do Projeto

```
server/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── index.ts
│   ├── controllers/
│   │   └── userController.ts
│   ├── middlewares/
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── userRoutes.ts
│   ├── services/
│   │   └── userService.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```
