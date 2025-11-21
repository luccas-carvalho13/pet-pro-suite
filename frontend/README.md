# Pet Pro Suite - Frontend

Aplicação React moderna para gestão de clínicas veterinárias.

## 🚀 Início Rápido

```bash
npm install
npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

**IMPORTANTE**: Antes de executar o projeto, você precisa configurar as variáveis de ambiente.

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://srlvfqbwepzzmljftsfx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anon_aqui
```

### Como obter as credenciais do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

## 📁 Estrutura

- `src/app/` - Configuração da aplicação (providers, router)
- `src/features/` - Features organizadas por domínio
- `src/shared/` - Código compartilhado (componentes, hooks, utils)
- `src/api/` - Cliente API e serviços

## 🔧 Scripts

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Executa ESLint
- `npm run preview` - Preview do build de produção

## ⚠️ Troubleshooting

### Erro: "supabaseUrl is required"

Isso significa que as variáveis de ambiente não estão configuradas. Verifique:
1. Se o arquivo `.env` existe na raiz do frontend
2. Se as variáveis começam com `VITE_`
3. Se você reiniciou o servidor após criar/editar o `.env`

### Erro: "Could not establish connection"

Este é um erro comum de extensões do navegador e pode ser ignorado. Não afeta o funcionamento da aplicação.
