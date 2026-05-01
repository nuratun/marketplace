# شامنا (Shamna) — Syrian Classifieds Marketplace

> **"Our Damascus"** — A web and mobile classifieds platform for the Syrian market where users can post listings to sell items, advertise services, or list rentals.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Hosting & Infrastructure](#hosting--infrastructure)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [API Reference](#api-reference)
- [Key Architectural Decisions](#key-architectural-decisions)
- [Development Status](#development-status)
- [Roadmap](#roadmap)

---

## Project Overview

Shamna is a Sahibinden/Craigslist-style classifieds platform built specifically for the Syrian market. Core features include:

- Phone number + OTP authentication (no email required)
- Post, browse, and search listings across categories
- Category-specific listing attributes via JSONB
- Arabic-first design with full RTL layout
- Image uploads per listing (Cloudflare R2 — live)
- Mobile app (React Native) planned for phase 2
- Business/advertiser login planned for a later phase

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Backend API** | Python + FastAPI | Chosen for long-term ML integration (recommendations, fraud detection, price suggestions) |
| **ORM** | SQLAlchemy | |
| **DB Migrations** | Alembic | Run locally via `uv run alembic upgrade head` or via GitHub Actions |
| **Web Frontend** | Next.js 15 + Tailwind CSS | App Router, Arabic/RTL from day one |
| **UI Components** | shadcn/ui | Copy-paste components, no lock-in |
| **Mobile** | React Native + Expo | Phase 2 |
| **Primary Database** | PostgreSQL (Supabase) | Free tier during dev, session pooler for IPv4 compatibility |
| **Search** | Meilisearch | Arabic full-text search — planned |
| **Cache / Queue** | Redis + BullMQ | Planned |
| **Object Storage** | Cloudflare R2 | Live — presigned URL upload, direct browser → R2 |
| **Auth** | Custom JWT + OTP (phone-based) | Access tokens (15 min, localStorage) + refresh tokens in httpOnly cookies (30 days) |
| **Package Manager (API)** | uv | Fast Python package manager — always use `uv add` never `pip install` |
| **Font** | IBM Plex Sans Arabic | Arabic-first, clean for marketplace UI |

---

## Hosting & Infrastructure

| Service | Provider | Purpose | Notes |
|---|---|---|---|
| **Web Frontend** | Vercel | Next.js hosting | Auto-deploy from GitHub |
| **Backend API** | Railway | FastAPI server | Migrate to Hetzner + Coolify pre-launch |
| **Database** | Supabase | PostgreSQL | Use Session Pooler URL (IPv4 compatible). Free tier pauses after 1 week inactivity |
| **DNS / CDN** | Cloudflare | CDN + DNS | Planned |
| **Image Storage** | Cloudflare R2 | Listing photos | Live — bucket: `shamna-listings` |
| **Search** | Meilisearch | Self-hosted on Hetzner | Planned |

### Pre-launch migration plan
Before launch, migrate Railway → **Hetzner Cloud + Coolify** for full control and lower cost. Meilisearch and Redis will also be self-hosted there.

---

## Monorepo Structure

```
shamna/
├── apps/
│   ├── api/                        ← FastAPI backend
│   │   ├── alembic/                ← DB migrations
│   │   │   └── versions/           ← migration files
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── config.py       ← pydantic-settings (reads .env)
│   │   │   │   ├── security.py     ← JWT create/decode helpers
│   │   │   │   ├── dependencies.py ← get_current_user / get_optional_user
│   │   │   │   └── r2.py           ← R2 client, generate_presigned_upload, public_url
│   │   │   ├── db/
│   │   │   │   ├── base.py         ← SQLAlchemy DeclarativeBase
│   │   │   │   └── session.py      ← engine, SessionLocal, get_db
│   │   │   ├── models/
│   │   │   │   ├── user.py         ← User model
│   │   │   │   ├── otp.py          ← OTPCode model
│   │   │   │   └── listing.py      ← Listing model
│   │   │   ├── routers/
│   │   │   │   ├── auth.py         ← /auth/request-otp, /auth/verify-otp, /auth/refresh
│   │   │   │   ├── listings.py     ← /listings CRUD + phone reveal
│   │   │   │   └── uploads.py      ← /uploads/presign — generates R2 presigned PUT URLs
│   │   │   └── main.py             ← FastAPI app, CORS, router registration
│   │   ├── alembic.ini
│   │   ├── Procfile                ← Railway: uvicorn app.main:app
│   │   └── pyproject.toml          ← Python dependencies (managed by uv)
│   ├── web/                        ← Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── auth/               ← OTP login flow (2 steps: phone → code)
│   │   │   ├── category/[slug]/    ← Category listing page + filters
│   │   │   ├── listing/[id]/       ← Listing detail page (server component)
│   │   │   ├── post/               ← Multi-step post an ad wizard
│   │   │   │   └── page.tsx        ← Owns all form state, handles submit to /listings
│   │   │   ├── layout.tsx          ← Root layout: IBM Plex Sans Arabic, RTL, Navbar + Footer
│   │   │   ├── page.tsx            ← Homepage: Hero + CategoryGrid + RecentListings
│   │   │   └── globals.css         ← CSS vars: brand, surface, border, text colors
│   │   ├── components/
│   │   │   ├── post/               ← step-indicator, step-category, step-details,
│   │   │   │                          step-photos, step-review
│   │   │   ├── navbar.tsx          ← Logo, search bar, post ad button, login button
│   │   │   ├── footer.tsx
│   │   │   ├── hero.tsx            ← Large search bar with routing
│   │   │   ├── category-grid.tsx   ← 6-category icon grid
│   │   │   ├── listing-card.tsx    ← Grid card (homepage + category page)
│   │   │   ├── listing-list-card.tsx ← Horizontal card for list view
│   │   │   ├── listing-gallery.tsx ← Image carousel with thumbnails
│   │   │   ├── category-filters.tsx ← URL-based filters: condition, city, price, sort
│   │   │   ├── view-toggle.tsx     ← Grid/list toggle
│   │   │   ├── recent-listings.tsx ← Async server component, fetches /listings
│   │   │   ├── phone-reveal.tsx    ← Reveal phone button + WhatsApp button
│   │   │   └── report-button.tsx
│   │   ├── lib/
│   │   │   └── api.ts              ← apiFetch, getAuthHeaders, getApiBaseUrl
│   │   ├── types/
│   │   │   ├── listing.ts          ← Listing, Seller, ListingsResponse types
│   │   │   └── post.ts             ← PostFormData, EMPTY_POST_FORM
│   │   └── middleware.ts           ← Protects /post, /profile, /my-listings routes
│   └── mobile/                     ← React Native stub (phase 2)
├── .github/
│   └── workflows/
│       └── migrate.yml             ← Manual trigger: runs alembic upgrade head
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.13+
- `uv` — `brew install uv`
- Railway CLI — `brew install railway`

### Web Frontend

```bash
cd apps/web
npm install
npm run dev
# runs on http://localhost:3000
```

### Backend API

```bash
cd apps/api
uv sync                        # install dependencies into .venv
uv run uvicorn app.main:app --reload
# runs on http://localhost:8000
# interactive docs at http://localhost:8000/docs
```

> **Important:** Always use `uv run` to execute Python commands. Never call `python`, `alembic`, or `uvicorn` directly — they will resolve to the wrong Python installation.

---

## Environment Variables

### `apps/api/.env`

```env
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=require
JWT_SECRET=your-generated-secret      # generate with: openssl rand -hex 32
OTP_DEV_BYPASS=1234                   # dev only — remove before launch

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=shamna-listings
R2_PUBLIC_URL=https://media.shamna.com   # or your r2.dev subdomain URL
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=https://shamna-production.up.railway.app
API_URL=https://shamna-production.up.railway.app
R2_PUBLIC_URL=https://media.shamna.com
```

> `NEXT_PUBLIC_API_URL` is used by client components. `API_URL` is used by server components and is not exposed to the browser.

### Railway environment variables (FastAPI service)

```
DATABASE_URL         → Supabase session pooler URL
JWT_SECRET           → same as .env above
OTP_DEV_BYPASS       → 1234 (remove before launch)
R2_ACCOUNT_ID        → Cloudflare account ID
R2_ACCESS_KEY_ID     → R2 API token access key
R2_SECRET_ACCESS_KEY → R2 API token secret
R2_BUCKET_NAME       → shamna-listings
R2_PUBLIC_URL        → https://media.shamna.com
```

### Vercel environment variables

```
NEXT_PUBLIC_API_URL  → https://shamna-production.up.railway.app
API_URL              → https://shamna-production.up.railway.app
R2_PUBLIC_URL        → https://media.shamna.com
```

### GitHub Secrets (for migration CI)

```
DATABASE_URL    → Supabase session pooler URL
```

> ⚠️ Never commit `.env` or `.env.local`. Both are in `.gitignore`.

---

## Database & Migrations

Hosted on **Supabase PostgreSQL**. Direct connection is IPv6 only — always use the **Session Pooler** URL for local dev and Railway.

### Running migrations locally

```bash
cd apps/api
uv run alembic upgrade head
```

### Creating a new migration

```bash
cd apps/api
uv run alembic revision -m "describe your change"
# fill in upgrade() and downgrade() in the generated file
uv run alembic upgrade head
```

### CI migrations

Trigger manually from **GitHub → Actions → Run DB Migrations**.

### Current tables

| Table | Description |
|---|---|
| `users` | id, phone, name, is_active, created_at |
| `otp_codes` | phone, code, used, expires_at, created_at |
| `listings` | Full listing record — see columns below |

### Listings table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id |
| `title` | String(100) | |
| `description` | Text | |
| `price` | Numeric(12,2) | |
| `currency` | String(3) | "USD" or "SYP" |
| `category` | String(50) | electronics, cars, real-estate, furniture, clothing, jobs |
| `condition` | String(10) | "new" or "used" |
| `city` | String(50) | Arabic city name |
| `status` | String(10) | "active", "sold", "expired" |
| `attrs` | JSONB | Category-specific attributes (flexible) |
| `image_urls` | JSONB | Array of R2 public URL strings |
| `views` | Integer | Incremented on each detail page visit (skipped for owner) |
| `expires_at` | DateTime | 30 days from creation |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |

---

## API Reference

Base URL: `https://shamna-production.up.railway.app`

Interactive docs: `https://shamna-production.up.railway.app/docs`

### Auth endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/request-otp` | No | Send OTP to phone number |
| POST | `/auth/verify-otp` | No | Verify OTP → returns access token + sets refresh cookie |
| POST | `/auth/refresh` | Cookie | Exchange refresh token for new access token |

**verify-otp response:**
```json
{
  "access_token": "eyJ...",
  "is_new_user": true,
  "user": { "id": "...", "phone": "+963...", "name": null }
}
```

> Dev OTP bypass: code `1234` always works (controlled by `OTP_DEV_BYPASS` env var)

### Listings endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/listings` | No | List with filters + pagination |
| POST | `/listings` | Required | Create a listing |
| GET | `/listings/{id}` | Optional | Get listing detail (increments views) |
| PATCH | `/listings/{id}/status` | Required (owner only) | Mark as sold |
| GET | `/listings/{id}/phone` | Required | Reveal seller phone number |

**GET /listings query params:**

| Param | Type | Values |
|---|---|---|
| `category` | string | electronics, cars, real-estate, furniture, clothing, jobs |
| `city` | string | Arabic city name e.g. دمشق |
| `condition` | string | new, used |
| `min_price` | float | e.g. 100 |
| `max_price` | float | e.g. 1000 |
| `sort` | string | newest, price_asc, price_desc |
| `page` | int | default 1 |
| `limit` | int | default 20, max 100 |

**GET /listings response shape:**
```json
{
  "total": 42,
  "page": 1,
  "limit": 20,
  "pages": 3,
  "results": [ ...listings ]
}
```

**Listing object shape:**
```json
{
  "id": "uuid",
  "title": "آيفون ١٥ برو ماكس",
  "description": "...",
  "price": 850.0,
  "currency": "USD",
  "category": "electronics",
  "condition": "new",
  "city": "دمشق",
  "status": "active",
  "attrs": {},
  "image_urls": ["https://media.shamna.com/listings/user-id/uuid.jpg"],
  "views": 12,
  "created_at": "2026-04-30T07:58:32Z",
  "expires_at": "2026-05-30T07:58:32Z",
  "seller": {
    "id": "uuid",
    "name": "أحمد",
    "member_since": "April 2026"
  }
}
```

### Upload endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/uploads/presign` | Required | Get presigned R2 PUT URLs for direct browser upload |

**POST /uploads/presign request:**
```json
[
  { "filename": "photo.jpg", "content_type": "image/jpeg" },
  { "filename": "photo2.png", "content_type": "image/png" }
]
```

**POST /uploads/presign response:**
```json
[
  {
    "upload_url": "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=...",
    "public_url": "https://media.shamna.com/listings/user-id/uuid.jpg"
  }
]
```

> Upload flow: frontend calls `/uploads/presign` → PUTs each file directly to R2 using `upload_url` → stores `public_url` strings in `image_urls` on listing create. Max 5 images. Allowed types: jpeg, png, webp.

**Authorization for protected endpoints:**
```
Authorization: Bearer <access_token>
```
> Grab `access_token` from `localStorage.getItem('access_token')` after login, or use `/docs` UI.

---

## Key Architectural Decisions

**Arabic-first:** `lang="ar"` and `dir="rtl"` on root HTML element. IBM Plex Sans Arabic as primary font. All UI copy in Arabic.

**Phone OTP auth:** No email/password. Syrian phone numbers (+963). Access token in `localStorage` (client API calls) + short-lived cookie (Next.js middleware route protection). Refresh token in httpOnly cookie.

**JSONB for listing attributes:** Category-specific fields (car mileage, apartment rooms, etc.) go in `attrs` JSONB column — no separate table per category. Flexible from day one.

**URL-based filters:** Category page filters stored in URL query params — shareable and bookmarkable. `CategoryFilters` component reads/writes via `useSearchParams` + `router.push`.

**R2 image upload — presigned URL pattern:** Frontend requests presigned PUT URLs from our API (`/uploads/presign`). The API generates them using `boto3` (S3-compatible) and returns them alongside the final public URLs. The browser PUTs files directly to R2 — the API server never buffers image bytes. Files are keyed as `listings/{user_id}/{uuid}.ext`. R2 bucket CORS policy allows PUT/GET from `localhost:3000` and the production domain, with `content-type` in allowed headers (required because presigned URLs are signed with content-type).

**Server vs client API calls:** Server components use `API_URL` env var (not exposed to browser). Client components use `NEXT_PUBLIC_API_URL`. Both point to same Railway URL — distinction matters for Next.js build process.

**Next.js 15 async params:** `params` in server components is a Promise. Always `const { id } = await params` before use — never access `params.id` directly.

**CSS variables for design tokens:** Custom colors (`--color-brand`, `--color-border`, `--color-surface`, `--color-text-primary`, `--color-text-muted`) are CSS variables defined in `globals.css`. Always use inline `style={{ ... }}` with these variables in components — never Tailwind utility classes like `bg-brand` or `border-border` which Tailwind won't generate for custom vars.

**`uv` for Python deps:** All packages managed through `uv`. Never `pip install` — always `uv add`.

**Pydantic v2 settings:** Use `model_config = SettingsConfigDict(env_file=".env")` in `Settings` class. Do NOT use the old inner `class Config:` pattern — Pydantic v2 will throw `config-both` error if both are present.

---

## Development Status

| Area | Status |
|---|---|
| Monorepo structure | ✅ Done |
| FastAPI skeleton + Railway deploy | ✅ Done |
| Supabase PostgreSQL connected | ✅ Done |
| Alembic migrations (users, otp_codes, listings) | ✅ Done |
| OTP auth endpoints | ✅ Done |
| JWT access + refresh tokens | ✅ Done |
| Next.js app + Vercel deploy | ✅ Done |
| Arabic/RTL layout + font | ✅ Done |
| Navbar + footer | ✅ Done |
| Homepage — real API data | ✅ Done |
| Category page + filters + view toggle — real API | ✅ Done |
| Listing detail page — real API | ✅ Done |
| Post an ad form (multi-step wizard UI) | ✅ Done |
| Auth middleware (protected routes) | ✅ Done |
| Frontend auth flow (OTP UI) — tested end to end | ✅ Done |
| Listings API (create, list, get, status, phone reveal) | ✅ Done |
| Post form wired to API (submit) | ✅ Done |
| Image upload (Cloudflare R2) | ✅ Done |
| Auth persistence (token survives refresh, AuthContext) | 🔄 Next |
| User profile page | ⏳ Planned |
| My listings page (owner view, mark as sold) | ⏳ Planned |
| Meilisearch integration | ⏳ Planned |
| Redis + BullMQ | ⏳ Planned |
| React Native mobile app | ⏳ Phase 2 |
| Image moderation pipeline | ⏳ Pre-launch |
| Wire real SMS provider (Twilio/Vonage) | ⏳ Pre-launch |
| Business/advertiser login | ⏳ Later phase |

---

## Roadmap

### Phase 1 — Dev / Skeleton (current)
- [x] Monorepo + deployment pipeline
- [x] Auth flow (OTP + JWT)
- [x] Listings CRUD API
- [x] Full frontend shell (homepage, category, detail, post form)
- [x] Post form submission + image upload (R2)
- [ ] Auth persistence (AuthContext + token refresh)
- [ ] User profile + my listings
- [ ] Search (Meilisearch)

### Phase 2 — Pre-launch
- [ ] Migrate Railway → Hetzner + Coolify
- [ ] Self-host Meilisearch + Redis
- [ ] Image moderation pipeline
- [ ] Mobile app (React Native + Expo)
- [ ] Remove OTP dev bypass, wire real SMS provider

### Phase 3 — Launch & Growth
- [ ] Business/advertiser accounts
- [ ] ML features: recommendations, price suggestions, fraud detection
- [ ] Analytics dashboard

---

## Next Session: Auth Persistence

The immediate next task is building proper auth persistence. Currently the session is lost on every page refresh.

**What needs to be built:**

1. **`AuthContext`** (`apps/web/contexts/auth-context.tsx`) — React context that wraps the app, holds `user` and `accessToken` state, reads from `localStorage` on mount, exposes `login()`, `logout()`, and `refreshToken()` methods.

2. **Silent token refresh** — When the 15-min access token expires, automatically call `POST /auth/refresh` using the httpOnly refresh token cookie to get a new access token, without logging the user out.

3. **`useAuth()` hook** — Simple hook that consumes `AuthContext`. Used by navbar (show login vs profile), post form (get token for API calls), and any protected component.

4. **Navbar update** — Currently always shows the login button. Should show the user's name/avatar and a dropdown (profile, my listings, logout) when authenticated.

5. **Post form update** — Currently reads token directly from `localStorage`. Should use `useAuth()` instead.

**Key files to create/modify:**
- Create: `apps/web/contexts/auth-context.tsx`
- Modify: `apps/web/app/layout.tsx` — wrap with `AuthProvider`
- Modify: `apps/web/components/navbar.tsx` — consume `useAuth()`
- Modify: `apps/web/app/post/page.tsx` — use `useAuth()` instead of direct localStorage
- Modify: `apps/web/app/auth/` — call `login()` from context on OTP success