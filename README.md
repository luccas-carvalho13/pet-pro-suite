# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c0a6b989-f4e8-4a50-964b-6b01654bc773

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c0a6b989-f4e8-4a50-964b-6b01654bc773) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Rodando o projeto (Postgres + API no Docker)

O projeto usa **PostgreSQL** e uma **API Node** direto no Docker — sem Supabase.

**1. Subir Postgres e API:**

```sh
docker compose up -d
```

> Se no login aparecer "Serviço indisponível" ou `ERR_CONNECTION_REFUSED`, a API não está rodando. Suba com `docker compose up -d` ou rode a API na pasta `server/` com `npm run dev`.

**2. Aplicar migrations e seed no Postgres:**

```sh
chmod +x scripts/apply-migrations-local.sh   # só na primeira vez
./scripts/apply-migrations-local.sh
# ou
npm run db:migrate:local
```

Isso aplica o stub de `auth`, as migrations em `db/migrations/` e o seed em `db/seed.sql` (empresa demo + 3 usuários: usuario / admin / super, senha **Senha123!**).

**3. Rodar o frontend:**

```sh
npm i
npm run dev
```

O front chama a API em `http://localhost:3001` (configurável via `VITE_API_URL` no `.env`).

---

**Conexão Postgres:**

| Parâmetro  | Valor        |
|-----------|--------------|
| Host      | `localhost`  |
| Porta     | `5433`       |
| Usuário   | `petpro`     |
| Senha     | `petpro`     |
| Database  | `petpro_dev` |

**API:** `http://localhost:3001` (login, register, me)

**Usuários do seed:** `usuario@petpro.local` | `admin@petpro.local` | `super@petpro.local` → senha **Senha123!**

---

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c0a6b989-f4e8-4a50-964b-6b01654bc773) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
