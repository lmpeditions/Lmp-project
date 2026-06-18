# Déploiement — GitHub · Supabase · Vercel

Guide pas-à-pas pour mettre le portail LMP en production.

---

## 1. GitHub (dépôt)

Le dépôt local est déjà initialisé avec un premier commit. Pour le publier :

**Option A — via le site GitHub**
1. Créer un nouveau dépôt **vide** sur https://github.com/new (ex. `lmp-portail`), sans README.
2. Relier et pousser :
   ```bash
   git remote add origin https://github.com/<utilisateur>/lmp-portail.git
   git branch -M main
   git push -u origin main
   ```

**Option B — via GitHub CLI** (si `gh` est installé)
```bash
gh repo create lmp-portail --private --source=. --remote=origin --push
```

---

## 2. Supabase (base de données PostgreSQL)

1. Créer un projet sur https://supabase.com → noter le **mot de passe** de la base.
2. **Project Settings → Database → Connection string** → onglet **URI**.
   Récupérer deux chaînes :
   - **Pooled** (Transaction, port **6543**) → `DATABASE_URL`
   - **Direct** (Session, port **5432**) → `DIRECT_URL`
3. Format (voir `.env.example`) :
   ```
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```
4. Appliquer le schéma + les données de démo (depuis ta machine, `.env` renseigné) :
   ```bash
   npm run db:generate
   npm run db:deploy     # applique les migrations à Supabase
   npm run db:seed       # crée les 4 comptes démo + le dossier #LMP20260001
   ```
   > `db:deploy` utilise `DIRECT_URL`. Si aucune migration n'existe encore, lancer
   > d'abord `npm run db:migrate` en local pour générer `prisma/migrations/`.

---

## 3. Vercel (hébergement)

1. https://vercel.com → **Add New → Project** → importer le dépôt GitHub.
2. Framework détecté : **Next.js** (aucune config à changer).
3. **Environment Variables** (Settings → Environment Variables) :

   | Clé | Valeur |
   |-----|--------|
   | `DATABASE_URL` | URL **poolée** Supabase (port 6543) |
   | `DIRECT_URL` | URL **directe** Supabase (port 5432) |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_URL` | `https://<ton-domaine>.vercel.app` |
   | `EMAIL_FROM` | `LMP <no-reply@ton-domaine>` |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | (optionnel) |

4. **Deploy**. Vercel build automatiquement à chaque `git push` sur `main`.

> Le déploiement actuel sert la **démo (données fictives)** — il fonctionne sans
> Supabase. Pour servir les vraies données, voir l'étape 4.

---

## 4. Activer les données réelles (Prisma sur Vercel)

Quand on branche les pages sur la base (couche `src/server/`) :

1. Dans `tsconfig.json`, retirer `"src/server"` et `"prisma"` de `exclude`.
2. Dans `package.json`, adapter le build pour générer le client Prisma sur Vercel :
   ```json
   "scripts": {
     "build": "prisma generate && next build",
     "postinstall": "prisma generate"
   }
   ```
   (Vercel met en cache `node_modules` ; `postinstall` garantit un client à jour.)
3. Remplacer les imports `@/lib/mock-data` par les requêtes des services
   `@/server/*` dans les pages, et brancher l'authentification (`src/server/auth.ts`,
   `src/server/rbac.ts`) dans `src/middleware.ts`.
4. `git push` → Vercel redéploie.

---

## Checklist production
- [ ] `AUTH_SECRET` fort et unique (jamais commité).
- [ ] HTTPS actif (HSTS déjà configuré dans `next.config.mjs`).
- [ ] `DATABASE_URL` poolée (6543) pour le runtime, `DIRECT_URL` (5432) pour les migrations.
- [ ] Migrations appliquées (`npm run db:deploy`).
- [ ] Variables d'env présentes dans Vercel (Production + Preview).
- [ ] `.env` / `.env.local` bien ignorés par git (déjà le cas).
