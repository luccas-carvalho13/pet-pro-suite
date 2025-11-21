# Pet Pro Suite

Sistema de gestão completo para clínicas veterinárias e pet shops.

## 📁 Estrutura do Projeto

O projeto está organizado em uma arquitetura moderna e escalável, separando claramente frontend e backend:

```
pet-pro-suite/
├── frontend/                 # Aplicação React/Vite
│   ├── src/
│   │   ├── app/             # Configuração da aplicação
│   │   │   ├── providers/   # Providers (QueryClient, Theme, etc)
│   │   │   └── router/      # Configuração de rotas
│   │   ├── features/        # Features organizadas por domínio
│   │   │   ├── auth/
│   │   │   ├── clients/
│   │   │   ├── pets/
│   │   │   ├── appointments/
│   │   │   ├── inventory/
│   │   │   ├── services/
│   │   │   ├── financial/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── dashboard/
│   │   │   ├── landing/
│   │   │   └── super-admin/
│   │   ├── shared/          # Código compartilhado
│   │   │   ├── components/  # Componentes reutilizáveis
│   │   │   ├── hooks/       # Hooks compartilhados
│   │   │   ├── lib/         # Utilitários
│   │   │   ├── types/       # Tipos TypeScript
│   │   │   └── constants/   # Constantes
│   │   ├── api/             # Cliente API e serviços
│   │   │   ├── client.ts    # Cliente Supabase
│   │   │   ├── integrations/ # Integrações (Supabase)
│   │   │   └── services/    # Serviços organizados por domínio
│   │   └── assets/          # Imagens, fonts, etc
│   ├── public/
│   └── package.json
│
├── backend/                  # Backend (Supabase)
│   ├── functions/           # Edge Functions (Deno)
│   │   └── register-company/
│   ├── migrations/          # Migrações SQL
│   └── config.toml          # Configuração Supabase
│
└── README.md
```

## 🚀 Início Rápido

### Frontend

```bash
cd frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

npm run dev
```

### Backend

O backend utiliza Supabase em produção. O banco já está configurado e as tabelas criadas.

**Conexão do Banco:**
```
postgresql://postgres.srlvfqbwepzzmljftsfx:?k$U78uNPrkpLXz@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

**⚠️ IMPORTANTE**: Mantenha as credenciais seguras!

Para desenvolvimento local com Supabase CLI:

```bash
cd backend
supabase start
supabase db reset
```

## 🏗️ Arquitetura

### Frontend

- **Feature-Based Structure**: Cada feature contém sua própria lógica, componentes e páginas
- **Shared Resources**: Componentes, hooks e utilitários compartilhados
- **API Layer**: Camada de abstração para comunicação com o backend
- **Type Safety**: TypeScript com tipos gerados do Supabase

### Backend

- **Supabase Edge Functions**: Funções serverless em Deno
- **Database Migrations**: Versionamento do schema do banco de dados
- **Multi-Tenant Architecture**: Schema baseado em tenants para isolamento de dados
- **Custom Authentication**: Autenticação usando tabela users própria

## 📦 Tecnologias

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- Supabase Client

### Backend
- Supabase
- Deno (Edge Functions)
- PostgreSQL

## 🔧 Desenvolvimento

### Adicionar uma nova feature

1. Crie a estrutura em `frontend/src/features/[nome-feature]/`
2. Adicione a rota em `frontend/src/app/router/app-router.tsx`
3. Crie os serviços necessários em `frontend/src/api/services/`

### Adicionar um novo serviço API

1. Crie o arquivo em `frontend/src/api/services/[nome].service.ts`
2. Exporte no `frontend/src/api/services/index.ts`
3. Use o cliente Supabase de `frontend/src/api/client.ts`

## 📝 Convenções

- **Componentes**: PascalCase (ex: `DashboardLayout.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useToast.ts`)
- **Serviços**: camelCase com sufixo `.service.ts` (ex: `auth.service.ts`)
- **Tipos**: PascalCase em arquivos `.types.ts` ou `index.ts`
- **Constantes**: UPPER_SNAKE_CASE em `constants/index.ts`

## 🧪 Testes

```bash
cd frontend
npm run test
```

## 📄 Licença

MIT
