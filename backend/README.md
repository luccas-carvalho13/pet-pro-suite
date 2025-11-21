# Pet Pro Suite - Backend

Backend baseado em Supabase (Edge Functions + PostgreSQL).

## 🚀 Configuração

### Variáveis de Ambiente

O projeto está configurado para usar o Supabase em produção. Para desenvolvimento local, você pode usar Supabase CLI.

### Conexão com o Banco

O banco de dados está configurado em:
```
postgresql://postgres.srlvfqbwepzzmljftsfx:?k$U78uNPrkpLXz@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

**⚠️ IMPORTANTE**: Mantenha as credenciais seguras e nunca commite-as no repositório!

## 📁 Estrutura

- `functions/` - Edge Functions (Deno)
  - `register-company/` - Função para registro de empresas/tenants
- `migrations/` - Migrações SQL do banco de dados
  - `20241119000000_create_erp_schema.sql` - Schema principal do ERP
- `config.toml` - Configuração do Supabase

## 🗄️ Schema do Banco

O banco utiliza um schema multi-tenant com as seguintes tabelas principais:

- **tenants** - Empresas/Clínicas
- **users** - Usuários do sistema
- **clients** - Clientes das clínicas
- **pets** - Pets dos clientes
- **services** - Serviços oferecidos
- **appointments** - Agendamentos
- **financial_transactions** - Transações financeiras
- **products** - Produtos/Estoque
- **stock_movements** - Movimentações de estoque

## 🔧 Desenvolvimento

### Aplicar Migrações

As migrações já foram aplicadas no banco de produção. Para aplicar localmente:

```bash
# Se usando Supabase CLI local
supabase db reset

# Ou execute manualmente no SQL Editor do Supabase
```

### Criar Nova Edge Function

```bash
supabase functions new [nome-funcao]
```

### Criar Nova Migração

```bash
supabase migration new [nome-migracao]
```

## 📝 Notas

- O schema usa **tenants** (multi-tenant) ao invés de companies
- Autenticação customizada usando tabela **users** própria
- Todas as tabelas têm `tenant_id` para isolamento de dados
- Triggers automáticos para `updated_at`
