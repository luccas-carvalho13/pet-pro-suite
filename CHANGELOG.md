# Changelog - Reorganização e Migração do Schema

## 🎯 Resumo das Mudanças

Este documento resume todas as mudanças realizadas na reorganização do projeto e migração para o novo schema do banco de dados.

## ✅ O que foi feito

### 1. Limpeza de Arquivos
- ✅ Removida pasta `supabase/` antiga
- ✅ Removidos arquivos de configuração soltos na raiz:
  - `components.json`, `eslint.config.js`, `postcss.config.js`
  - `tailwind.config.ts`, `tsconfig*.json`, `vite.config.ts`
  - `index.html`, `public/`, `package-lock.json`, `bun.lockb`
- ✅ Removidas migrations antigas que não correspondem ao novo schema

### 2. Estrutura do Projeto
- ✅ Projeto reorganizado em `frontend/` e `backend/`
- ✅ Frontend com arquitetura feature-based
- ✅ Backend com migrations e Edge Functions organizados

### 3. Schema do Banco de Dados
- ✅ Criada migration `20241119000000_create_erp_schema.sql` baseada no `CREATE_TABLES.sql`
- ✅ Schema multi-tenant implementado:
  - `tenants` (substitui `companies`)
  - `users` (substitui `profiles` + `auth.users`)
  - `clients`, `pets`, `services`, `appointments`
  - `financial_transactions`, `products`, `stock_movements`
- ✅ Tipos TypeScript atualizados em `frontend/src/api/integrations/supabase/types.ts`

### 4. Configuração
- ✅ `backend/config.toml` atualizado com novo project_id
- ✅ Conexão do banco documentada
- ✅ `.env.example` criado para frontend

### 5. Serviços API
- ✅ `auth.service.ts` atualizado para novo schema
- ✅ Métodos adaptados para usar `tenants` e `users`
- ✅ Preparado para autenticação customizada

### 6. Documentação
- ✅ `README.md` atualizado
- ✅ `SCHEMA_CHANGES.md` criado explicando mudanças
- ✅ `backend/README.md` atualizado
- ✅ `MIGRATION.md` mantido com guia de migração

## 🔄 Mudanças no Schema

### Antes → Depois

| Antes | Depois |
|-------|--------|
| `companies` | `tenants` |
| `profiles` + `auth.users` | `users` |
| `user_roles` | Campo `role` em `users` |
| `plans`, `subscriptions` | Campo `subscription` (JSONB) em `tenants` |
| `permissions` | Campo `permissions` (JSONB) em `users` |

### Novas Tabelas
- `clients` - Clientes das clínicas
- `pets` - Pets dos clientes
- `services` - Serviços oferecidos
- `appointments` - Agendamentos
- `financial_transactions` - Transações financeiras
- `products` - Produtos/Estoque
- `stock_movements` - Movimentações de estoque

## ⚠️ Próximos Passos Necessários

### 1. Autenticação
- [ ] Implementar Edge Function para autenticação customizada
- [ ] Criar função de hash de senha (bcrypt)
- [ ] Implementar JWT ou sessões para autenticação

### 2. Serviços API
- [ ] Criar serviços para cada entidade:
  - `clients.service.ts`
  - `pets.service.ts`
  - `services.service.ts`
  - `appointments.service.ts`
  - `financial.service.ts`
  - `products.service.ts`
  - `stock.service.ts`

### 3. Row Level Security (RLS)
- [ ] Implementar políticas RLS para todas as tabelas
- [ ] Garantir isolamento de dados por tenant
- [ ] Testar permissões por role

### 4. Edge Functions
- [ ] Atualizar `register-company` para `register-tenant`
- [ ] Criar função de autenticação
- [ ] Criar funções auxiliares para queries comuns

### 5. Frontend
- [ ] Atualizar componentes para usar novos serviços
- [ ] Implementar contexto de autenticação
- [ ] Criar hooks para cada entidade
- [ ] Atualizar páginas para novo schema

## 📝 Notas Importantes

1. **Banco de Produção**: O banco já possui as tabelas criadas. Não execute a migration novamente.

2. **Autenticação**: O sistema agora usa autenticação customizada. É necessário implementar:
   - Hash de senhas
   - Geração de tokens JWT
   - Middleware de autenticação

3. **Multi-Tenancy**: Todas as queries devem incluir filtro por `tenant_id`.

4. **Tipos TypeScript**: Os tipos foram criados manualmente. Para tipos mais precisos, use o Supabase CLI:
   ```bash
   supabase gen types typescript --project-id srlvfqbwepzzmljftsfx > frontend/src/api/integrations/supabase/types.ts
   ```

## 🔗 Referências

- [SCHEMA_CHANGES.md](./SCHEMA_CHANGES.md) - Detalhes das mudanças no schema
- [MIGRATION.md](./MIGRATION.md) - Guia de migração da estrutura
- [backend/README.md](./backend/README.md) - Documentação do backend

