# Vault Web UI — Domain Glossary

## Domain

A browser-based client for adding encrypted financial transactions to a personal zero-knowledge password/secret manager ("Vault").

## Glossary

| Term | Definition |
|------|------------|
| Vault | The zero-knowledge secret management system. All sensitive data is encrypted client-side. |
| Supabase Auth | The authentication provider. Handles email/password sign-in and JWT session management. |
| Session | An authenticated Supabase auth session (JWT). Persisted to localStorage by the Supabase client, restored on page load via `getSession()`. |
| Session restoration | The process of checking for an existing Supabase session on app mount and skipping the login screen if found. |
| Vault master password | The user's root secret. Used with PBKDF2 to derive the client-side encryption key. Never persisted — held in browser memory only. |
| Login | The first authentication step — email/password against Supabase Auth. |
| Unlock | The second step — entering the vault master password to derive the encryption key. |
