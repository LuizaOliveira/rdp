# Sistema de Previdência - Full Stack

Projeto full-stack desenvolvido com React + Vite no frontend e Node.js + Express + Prisma + MySQL no backend.

## 🚀 Tecnologias

### Backend
- Node.js
- TypeScript
- Express
- Prisma ORM
- MySQL
- CORS

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- Axios

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd previdência
```

### 2. Configurar Backend

```bash
cd server
npm install

# Configurar arquivo .env
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações do MySQL:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
PORT=5000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 3. Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar as tabelas no banco
npm run prisma:migrate

# (Opcional) Popular banco com dados de exemplo
npm run prisma:seed
```

### 4. Configurar Frontend

```bash
cd ../client
npm install
```

## 🏃 Executar o Projeto

### Terminal 1 - Backend

```bash
cd server
npm run dev
```

O servidor estará rodando em: `http://localhost:5000`

### Terminal 2 - Frontend

```bash
cd client
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

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
previdência/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── index.ts
│   │   ├── controllers/
│   │   │   └── userController.ts
│   │   ├── middlewares/
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   └── userRoutes.ts
│   │   ├── services/
│   │   │   └── userService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── client/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── UserCard.tsx
    │   │   └── UserForm.tsx
    │   ├── hooks/
    │   │   └── useUsers.ts
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   └── Users.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   └── userService.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

## 🛠️ Scripts Disponíveis

### Backend (server/)

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor em modo produção
- `npm run prisma:generate` - Gera Prisma Client
- `npm run prisma:migrate` - Cria/atualiza migrations
- `npm run prisma:studio` - Abre Prisma Studio (interface visual)
- `npm run prisma:seed` - Popula banco com dados de exemplo

### Frontend (client/)

- `npm run dev` - Inicia aplicação em modo desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

## 📝 Notas

- Certifique-se de ter o MySQL instalado e rodando
- Crie o banco de dados antes de rodar as migrations
- As portas padrão são 5000 (backend) e 5173 (frontend)
- O CORS está configurado para permitir requisições do frontend

## 🔐 Segurança

- Nunca commite o arquivo `.env` no repositório
- Use variáveis de ambiente para dados sensíveis
- Em produção, configure CORS adequadamente
