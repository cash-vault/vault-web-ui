# Vault Web UI

Browser client for adding transactions to your Vault from mobile or remote devices. Part of the Vault password/secret manager ecosystem.

## Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

These are also injected via GitHub Secrets when deploying to GitHub Pages.

## Usage

```bash
npm install
npm run dev     # development
npm run build   # production build
```

## Prerequisites

- You must have the Vault desktop app set up first (to create the PBKDF2 salt and accounts in the database).
- The database migration `add_transaction_with_balance_function` must have been applied to your Supabase project.

## Architecture

- Direct Supabase access via supabase-js (no server-side layer)
- Client-side encryption via Web Crypto API (PBKDF2 + AES-256-GCM)
- Atomic balance updates via a Postgres SECURITY DEFINER function
- RLS policies scope all queries to the authenticated user
