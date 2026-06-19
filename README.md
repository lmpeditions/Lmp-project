# LMP — Portail de Suivi Éditorial

Portail auteur / **CRM éditorial** pour la maison d'édition **LMP (Les Manuscrits Publiés)**.
Chaque auteur sous contrat suit en temps réel l'avancement de son projet — de la
signature jusqu'à la publication — via un espace personnel sécurisé. L'équipe LMP
gère l'ensemble des dossiers depuis un back-office complet.

> **État actuel**
> - ✅ **Front-end complet et exécutable** (FR/EN, clair/sombre, responsive) sur données de démonstration — aucune base requise.
> - ✅ **Fondation back-end livrée** : schéma Prisma complet, seed, sessions JWT + RBAC, services métier, notifications, audit, Docker. Activable sur une machine disposant de PostgreSQL (voir [Activer le back-end](#-activer-le-back-end)).

---

## 🧱 Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) · React 19 · TypeScript |
| Styles | Tailwind CSS v4 · design system par tokens (CSS variables) |
| UI | Composants type shadcn · lucide-react · Framer Motion |
| Graphiques | Recharts |
| i18n | next-intl (fr par défaut, en) |
| Thème | next-themes (clair / sombre / système, persistance) |
| Base de données | PostgreSQL · Prisma 6 (Docker en local ou Supabase) |
| Auth | Sessions JWT (HS256) httpOnly + RBAC · bcrypt |
| Validation | Zod |
| E-mail | Resend (console en dev) |

---

## ✨ Fonctionnalités

### Espace Auteur (Front-office)
- **Tableau de bord** : infos générales, jauge de progression animée, timeline des 8 étapes, activité récente, échéances, action requise.
- **Démarches légales (ISBN)** : statuts, documents associés, historique des actions.
- **Relecture** : 5 états, barre de progression, notes éditoriales, fichiers partagés.
- **Correction** : 4 sous-étapes (orthographe, grammaire, style, validation) + remarques.
- **Couverture** : galerie interactive (approuver / demander une modification).
- **Mise en page** : étapes jusqu'au **BAT**, bouton de validation, documents.
- **Communication** : tableau d'actions + calendrier marketing.
- **Finances** : total / payé / solde (DH), historique, échéances, « Signaler un problème ».
- **Documents (GED)** : 7 catégories (A–G), filtres, aperçu, versions, commentaires.
- **Tickets** : liste, fil de conversation, éditeur enrichi + pièces jointes, création.
- **Résiliation** : conséquences, workflow encadré, accusé.
- **Profil** : informations, préférences (langue/thème), sécurité (mot de passe).
- **Notifications** : centre + cloche, marquage lu/non-lu.

### Back-office LMP (Admin)
- **Tableau de bord** : KPIs (auteurs, dossiers, en cours, terminés, revenus), graphiques Recharts, activité, liste des dossiers.
- **Dossiers** : recherche + filtres, suivi de la progression.
- **Utilisateurs** : rôles, statuts, suspension/activation.
- **Tickets** : file d'attente, assignation, statuts.
- **Paiements** : encaissements, échéances, validation.
- **Statistiques** : taux de complétion, avancement moyen, graphiques, export.
- **Paramètres** : configuration, langues, thèmes, **matrice de permissions** par rôle.

---

## 🚀 Démarrage rapide (démo, sans base)

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000 → redirige vers `/fr`.

- Espace Auteur : `/fr/author` · Back-office : `/fr/admin`
- Version anglaise : remplacer `/fr` par `/en`
- Bascule **langue** et **thème** en haut à droite.

La page de connexion propose deux accès démo (Auteur / Admin).

---

## 🔌 Activer le back-end

Le code DB-backed se trouve dans `prisma/` et `src/server/`. Il est volontairement
**exclu du build de démo** (`tsconfig.json`) tant que le client Prisma n'est pas
généré. Pour l'activer sur une machine disposant de PostgreSQL :

```bash
# 1. Variables d'environnement
cp .env.example .env            # renseigner DATABASE_URL + AUTH_SECRET

# 2. Lancer PostgreSQL (Docker) — ou pointer vers Supabase
docker compose -f docker/docker-compose.yml up -d db

# 3. Générer le client + appliquer le schéma + données de démo
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Retirer l'exclusion de build (tsconfig.json → "exclude")
#    puis brancher les pages sur les services (voir src/server/*).
```

**Comptes de démonstration** (mot de passe `demo1234`) :

| Rôle | E-mail |
|------|--------|
| Super Admin | `sami.idrissi@lmp.ma` |
| Admin | `karim.benali@lmp.ma` |
| Manager | `salma.haddadi@lmp.ma` |
| Auteur | `yasmine.elamrani@exemple.ma` |

### Ce que fournit la fondation back-end
- `prisma/schema.prisma` — 13 modèles (User, Dossier, Stage, Payment, PaymentSchedule, Document, Ticket, TicketMessage, TerminationRequest, Notification, ActivityLog, Setting, InviteToken) + enums + relations + index.
- `src/server/auth.ts` — sessions JWT HS256 (cookie httpOnly, SameSite=Lax), bcrypt, login.
- `src/server/rbac.ts` — permissions par rôle, `requireRole`, `requirePermission`, `assertDossierAccess`.
- `src/server/validators.ts` — schémas Zod pour chaque mutation.
- `src/server/dossier-service.ts` — n° de suivi auto (`#LMP{année}{séquence}`), recalcul de progression, mise à jour d'étape → notification + audit.
- `src/server/notifications.ts` — in-app + e-mail (Resend).
- `src/server/audit.ts` — journal d'audit (ActivityLog).
- `src/server/rate-limit.ts` — limitation de débit (auth & routes sensibles).

---

## 🔐 Sécurité (OWASP)
- En-têtes de sécurité dans `next.config.mjs` : CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- Mots de passe hachés **bcrypt** (coût 12) ; sessions **JWT** signées, comparaison à temps constant.
- **RBAC** côté serveur (4 rôles) + contrôle d'accès par dossier.
- **Validation Zod** systématique des entrées.
- **Rate-limiting** sur l'authentification.
- **Journal d'audit** sur les actions sensibles.
- CSRF : Server Actions (protégés nativement) ; double-submit pour les Route Handlers.

---

## 🌍 Internationalisation & thèmes
- next-intl : `messages/fr.json` & `messages/en.json` (toutes les pages traduites).
- Ajouter une langue : ajouter la locale dans `src/i18n/routing.ts` + un fichier `messages/<locale>.json`.
- next-themes : clair / sombre / système, détection auto + persistance (synchronisable au profil DB).

---

## 🐳 Docker / Production

```bash
# Stack complète (app + PostgreSQL)
docker compose -f docker/docker-compose.yml up --build

# Première initialisation (dans un autre terminal)
docker compose -f docker/docker-compose.yml exec app npx prisma migrate deploy
docker compose -f docker/docker-compose.yml exec app npm run db:seed
```

- Image multi-stage, sortie **standalone** Next.js (`output: "standalone"`).
- Variables requises : `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (≥ 32 octets), `AUTH_URL`, et `SMTP_*` pour l'e-mail.
- **Production** : générer `AUTH_SECRET` (`openssl rand -base64 32`), activer HTTPS (HSTS déjà configuré), pointer `DATABASE_URL` vers la base managée, exécuter `npm run db:deploy`.

---

## 📂 Structure

```
src/
  app/[locale]/
    page.tsx                 # Connexion / landing
    author/                  # Front-office (12 modules + tickets/[id], /new, notifications)
    admin/                   # Back-office (dossiers, users, tickets, payments, statistics, settings)
  components/
    ui/                      # Primitives (card, button, badge, progress)
    shared/                  # Sidebar, topbar, toggles, stat-card, stepper, action-button
    author/                  # Gauge, timeline, galerie, GED, notifications, composer
    admin/                   # Tables dossiers / utilisateurs
    charts/                  # Graphiques Recharts
  i18n/                      # Config next-intl
  lib/                       # types, mock-data, utils, nav, status
  server/                    # ⚙️ Couche DB : prisma, auth, rbac, validators, services… (exclue du build démo)
prisma/                      # schema.prisma · seed.ts
messages/                    # fr.json · en.json
docker/                      # Dockerfile · docker-compose.yml
```

---

*Référence projet : #LMP20260001 — Document confidentiel réservé à l'usage interne de LMP.*
