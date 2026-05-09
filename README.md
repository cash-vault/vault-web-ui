# Vault Web UI

Browser client for adding transactions to your Vault from a mobile phone or any device with a web browser. Part of the Vault ecosystem — a personal, zero-knowledge password/secret manager.

## Motivation

The Vault desktop app (Tauri + Rust) only runs on your Mac. When you're away from home, there's no way to quickly jot down an expense or income. This web app fills that gap: open a browser tab on your iPhone, authenticate, and add a transaction. It shares the same Supabase database and encryption key as the desktop app.

## Current State

- **Adding transactions** — fully working
- **Viewing, editing, deleting** — not yet implemented (use the desktop app)
- **Offline support** — not yet implemented
- **Budgets** — not yet implemented

## Stack

- **Framework**: React 19, TypeScript 6
- **Build**: Vite 8
- **Backend**: Supabase (PostgREST + Auth), no server-side layer
- **Encryption**: Web Crypto API (PBKDF2-HMAC-SHA256 + AES-256-GCM)
- **Icons**: lucide-react
- **Deploy**: GitHub Pages via GitHub Actions

## Prerequisites

- A Supabase project with the [Vault database schema](https://github.com/YOUR_ORG/vault-db) applied. The migration `add_transaction_with_balance_function` must be present.
- The Vault desktop app must have been set up at least once (it creates the PBKDF2 salt and your accounts in the database).
- At least one account must exist in the database (create on the desktop app first).

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview   # preview the production build locally
```

### Lint

```bash
npm run lint
```

## Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys to GitHub Pages on every push to `main`. Set these repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## App Flow

1. **Sign In** — Supabase email/password auth (JWT stored in browser session)
2. **Unlock Vault** — Enter your vault master password; the app derives the AES-256-GCM encryption key via PBKDF2 in the browser
3. **Add Transaction** — Pick account/category, enter amount/description/date; data is encrypted client-side before being sent to Supabase
4. **Confirmation** — Transaction saved; option to add another

## Security Model

- The server (Supabase) **never sees plaintext data**. All sensitive fields (account names, balances, transaction amounts/descriptions, category names) are encrypted with AES-256-GCM before leaving the client.
- The encryption key is derived from your vault master password via PBKDF2-HMAC-SHA256 (100,000 iterations) and held in browser memory only. It is never persisted to disk or sent over the network.
- Row-Level Security (RLS) ensures each user can only read/write their own rows, enforced at the database level.
- The Postgres function `add_transaction_with_balance_update` uses `SECURITY DEFINER` for atomic inserts while correctly scoping data via `auth.uid()`.

## Project Structure

```
src/
├── main.tsx                  — entry point
├── App.tsx                   — screen router (login → unlock → add → confirm)
├── supabase.ts               — supabase-js client from VITE_ env vars
├── crypto.ts                 — PBKDF2 + AES-256-GCM via Web Crypto API
├── index.css                 — global styles (dark/light mode)
└── screens/
    ├── LoginScreen.tsx       — Supabase email/password auth
    ├── UnlockScreen.tsx      — master password → encryption key derivation
    ├── AddTransactionScreen.tsx — full form with decrypted dropdowns
    └── ConfirmationScreen.tsx   — success view
```

## Related Repos

- [vault-desktop-ui](https://github.com/YOUR_ORG/vault-desktop-ui) — The Tauri desktop app (full CRUD, analytics, dashboard)
- [vault-db](https://github.com/YOUR_ORG/vault-db) — Database schema, migrations, and RLS policies for Supabase
