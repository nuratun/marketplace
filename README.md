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
- [Next Session](#next-session)

---

## Project Overview

Shamna is a Sahibinden/Craigslist-style classifieds platform built specifically for the Syrian market. Core features include:

- Phone number + OTP authentication (no email required)
- Post, browse, and search listings across categories
- Category-specific listing attributes via JSONB
- Arabic-first design with full RTL layout
- Image uploads per listing and profile photos (Cloudflare R2 — live)
- My Listings page — view, mark as sold, delete your own listings
- Mobile app (React Native) planned for phase 2
- Business/advertiser login planned for a later phase

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Backend API** | Python + FastAPI | Chosen for long-term ML integration (recommendations, fraud detection, price suggestions) |
| **ORM** | SQLAlchemy 2.x | Using `Mapped` + `mapped_column` style — required for Pylance compatibility |
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
| **Web Frontend** | Vercel | Next.js hosting | Live at `https://www.shamna.shop` — auto-deploy from GitHub |
| **Backend API** | Railway | FastAPI server | Live at `https://railway.shamna.shop` — migrate to Hetzner + Coolify pre-launch |
| **Database** | Supabase | PostgreSQL | Use Session Pooler URL (IPv4 compatible). Free tier pauses after 1 week inactivity |
| **DNS / CDN** | Cloudflare | DNS (proxy disabled for Vercel compatibility) | Both `www.shamna.shop` and `railway.shamna.shop` resolve correctly |
| **Image Storage** | Cloudflare R2 | Listing photos + profile pics | Live — bucket: `shamna-listings`, public URL: `https://media.shamna.shop` |
| **Search** | Meilisearch | Self-hosted on Hetzner | Planned |

### Domain setup (completed)
- Frontend: `https://www.shamna.shop` → Vercel
- API: `https://railway.shamna.shop` → Railway (port 8080)
- Both sit under the same root domain (`.shamna.shop`), which means cookies with `domain=".shamna.shop"` are shared across both — this fully resolves the cross-domain cookie issue.
- Cloudflare proxy is **disabled** on both records (Vercel requires DNS-only mode).

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
│   │   │   │   ├── user.py         ← User model (Mapped style)
│   │   │   │   ├── otp.py          ← OTPCode model
│   │   │   │   └── listing.py      ← Listing model
│   │   │   ├── routers/
│   │   │   │   ├── auth.py         ← /auth/* endpoints including /auth/me (GET + PUT)
│   │   │   │   ├── listings.py     ← /listings CRUD + /listings/mine + phone reveal + delete
│   │   │   │   └── uploads.py      ← /uploads/presign + /uploads/presign-profile
│   │   │   └── main.py             ← FastAPI app, CORS, router registration
│   │   ├── alembic.ini
│   │   ├── Procfile                ← Railway: uvicorn app.main:app
│   │   └── pyproject.toml          ← Python dependencies (managed by uv)
│   ├── web/                        ← Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── auth/               ← OTP login flow (2 steps: phone → code)
│   │   │   ├── category/[slug]/    ← Category listing page + filters
│   │   │   ├── listing/[id]/       ← Listing detail page (server component)
│   │   │   ├── my-listings/        ← Owner listing management page
│   │   │   │   └── page.tsx        ← View all own listings, mark as sold, delete
│   │   │   ├── post/               ← Multi-step post an ad wizard
│   │   │   │   └── page.tsx        ← Owns all form state, handles submit to /listings
│   │   │   ├── profile/            ← User profile page (inline editable fields)
│   │   │   │   └── page.tsx        ← Name, email, bio, profile pic, standing badge
│   │   │   ├── layout.tsx          ← Root layout: IBM Plex Sans Arabic, RTL, AuthProvider, Navbar + Footer
│   │   │   ├── page.tsx            ← Homepage: Hero + per-category listing sections
│   │   │   └── globals.css         ← CSS vars: brand, surface, border, text colors
│   │   ├── components/
│   │   │   ├── post/               ← step-indicator, step-category, step-details,
│   │   │   │                          step-photos, step-review
│   │   │   ├── navbar.tsx          ← Auth-aware: logged-out = two buttons; logged-in = icon row + avatar dropdown
│   │   │   ├── footer.tsx
│   │   │   ├── hero.tsx            ← 3-panel layout: category sidebar (hover) + animated banner + post-ad promo card
│   │   │   ├── category-section.tsx ← Per-category block: colored feature card + 2×4 mini listing grid
│   │   │   ├── listing-card.tsx    ← Grid card (homepage + category page)
│   │   │   ├── listing-list-card.tsx ← Horizontal card for list view
│   │   │   ├── listing-gallery.tsx ← Image carousel with thumbnails
│   │   │   ├── category-filters.tsx ← URL-based filters: condition, city, price, sort
│   │   │   ├── view-toggle.tsx     ← Grid/list toggle
│   │   │   ├── phone-reveal.tsx    ← Reveal phone button + WhatsApp button
│   │   │   └── report-button.tsx
│   │   ├── contexts/
│   │   │   └── auth-context.tsx    ← AuthProvider, useAuth(), AuthUser type
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
ENVIRONMENT=development               # set to "production" in Railway

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=shamna-listings
R2_PUBLIC_URL=https://media.shamna.shop
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=https://railway.shamna.shop
API_URL=https://railway.shamna.shop
R2_PUBLIC_URL=https://media.shamna.shop
```

> `NEXT_PUBLIC_API_URL` is used by client components. `API_URL` is used by server components and is not exposed to the browser.

### Railway environment variables (FastAPI service)

```
DATABASE_URL         → Supabase session pooler URL
JWT_SECRET           → same as .env above
OTP_DEV_BYPASS       → 1234 (remove before launch)
ENVIRONMENT          → production
R2_ACCOUNT_ID        → Cloudflare account ID
R2_ACCESS_KEY_ID     → R2 API token access key
R2_SECRET_ACCESS_KEY → R2 API token secret
R2_BUCKET_NAME       → shamna-listings
R2_PUBLIC_URL        → https://media.shamna.shop
```

### Vercel environment variables

```
NEXT_PUBLIC_API_URL  → https://railway.shamna.shop
API_URL              → https://railway.shamna.shop
R2_PUBLIC_URL        → https://media.shamna.shop
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
| `users` | id, phone, name, email, bio, profile_pic, user_type, standing, warning_reason, is_active, created_at |
| `otp_codes` | phone, code, used, expires_at, created_at |
| `listings` | Full listing record — see columns below |

### Users table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `phone` | String | Unique, indexed |
| `name` | String | Nullable |
| `email` | String | Nullable |
| `bio` | String | Nullable — short user bio |
| `profile_pic` | String | Nullable — R2 public URL (`profiles/{user_id}.ext`) |
| `user_type` | String | `"regular"` (business accounts planned) |
| `standing` | String | `"good"` \| `"warned"` \| `"suspended"` — default `"good"` |
| `warning_reason` | String | Nullable — populated when standing is warned/suspended |
| `is_active` | Boolean | Default true |
| `created_at` | DateTime | |

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

### Migration history

| Revision | Description |
|---|---|
| `8a5d4dc3c4c1` | Initial — users, otp_codes, listings tables |
| `1.2_user_profile_fields` | Add bio, standing, warning_reason to users |

---

## API Reference

Base URL: `https://railway.shamna.shop`

Interactive docs: `https://railway.shamna.shop/docs`

### Auth endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/request-otp` | No | Send OTP to phone number |
| POST | `/auth/verify-otp` | No | Verify OTP → returns access token + sets refresh cookie |
| POST | `/auth/refresh` | Cookie | Exchange refresh token for new access token |
| GET | `/auth/me` | Required | Get current user profile |
| PUT | `/auth/me` | Required | Update name, email, bio |
| PUT | `/auth/me/profile-pic` | Required | Save R2 profile pic URL on user record |

**verify-otp response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "phone": "+963...",
    "name": null,
    "email": null,
    "bio": null,
    "profile_pic": null,
    "user_type": "regular",
    "standing": "good",
    "warning_reason": null,
    "created_at": "2026-05-01T..."
  }
}
```

**PUT /auth/me request:**
```json
{ "name": "أحمد", "email": "ahmed@example.com", "bio": "بائع موثوق" }
```

> Dev OTP bypass: code `1234` always works (controlled by `OTP_DEV_BYPASS` env var)

### Listings endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/listings` | No | List with filters + pagination |
| POST | `/listings` | Required | Create a listing |
| GET | `/listings/mine` | Required | Get all listings owned by current user |
| GET | `/listings/{id}` | Optional | Get listing detail (increments views) |
| PATCH | `/listings/{id}/status` | Required (owner only) | Mark as sold |
| DELETE | `/listings/{id}` | Required (owner only) | Hard delete a listing |
| GET | `/listings/{id}/phone` | Required | Reveal seller phone number |

> ⚠️ Route order matters in FastAPI: `/listings/mine` must be registered **before** `/listings/{id}` in `listings.py`, otherwise the string `"mine"` is matched as a listing ID.

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

**GET /listings/mine query params:**

| Param | Type | Values |
|---|---|---|
| `status` | string | active, sold, expired (optional — omit for all) |
| `page` | int | default 1 |
| `limit` | int | default 20, max 100 |

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
  "image_urls": ["https://media.shamna.shop/listings/user-id/uuid.jpg"],
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
| POST | `/uploads/presign` | Required | Get presigned R2 PUT URLs for listing images (max 5) |
| POST | `/uploads/presign-profile` | Required | Get presigned R2 PUT URL for profile picture |

**POST /uploads/presign request:**
```json
[
  { "filename": "photo.jpg", "content_type": "image/jpeg" },
  { "filename": "photo2.png", "content_type": "image/png" }
]
```

**POST /uploads/presign-profile request:**
```json
{ "content_type": "image/jpeg" }
```

**POST /uploads/presign-profile response:**
```json
{
  "upload_url": "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=...",
  "public_url": "https://media.shamna.shop/profiles/user-id.jpg"
}
```

> Listing images keyed as `listings/{user_id}/{uuid}.ext`. Profile pics keyed as `profiles/{user_id}.ext` — re-uploads overwrite the previous pic automatically.

**Authorization for protected endpoints:**
```
Authorization: Bearer <access_token>
```

---

## Key Architectural Decisions

**Arabic-first:** `lang="ar"` and `dir="rtl"` on root HTML element. IBM Plex Sans Arabic as primary font. All UI copy in Arabic.

**Phone OTP auth:** No email/password. Syrian phone numbers (+963). Access token in `localStorage` (client API calls) + `session=1` non-httpOnly cookie (Next.js middleware route protection). Refresh token in httpOnly cookie. Post-OTP redirect uses `window.location.href` (not `router.push`) to force a full page load so middleware re-evaluates with the fresh cookie.

**Cookie strategy — two cookies on login:**
- `refresh_token` — httpOnly, `secure=True`, `samesite="lax"`, `domain=".shamna.shop"`. Used by `/auth/refresh` to silently renew access tokens.
- `session` — non-httpOnly, `secure=True`, `samesite="lax"`, `domain=".shamna.shop"`, value `"1"`. Presence signal only — no sensitive data. Readable by Next.js middleware to gate protected routes.

Both cookies use `domain=".shamna.shop"` so they are scoped to the entire root domain and readable by both `www.shamna.shop` (frontend) and `railway.shamna.shop` (API). This is what makes same-site cookie auth work across Vercel and Railway.

**Cookie `secure` flag:** Always `True` in production — both frontend and API are on HTTPS. The `ENVIRONMENT` setting in `config.py` still controls this; Railway has `ENVIRONMENT=production`.

**Cross-domain cookie fix (resolved):** Previously the frontend (Vercel) and API (Railway) were on different root domains, causing the `session` cookie set by the API to not be visible to the Next.js middleware on the frontend. Resolved by wiring both services under `shamna.shop` and setting `domain=".shamna.shop"` on all cookies in `auth.py`.

**Cloudflare R2 CORS:** The R2 bucket (`shamna-listings`) must have a CORS policy allowing `PUT` from `https://www.shamna.shop` and `http://localhost:3000`. The `AllowedHeaders: ["*"]` entry is required because presigned URLs include `content-type` in the signed headers — without it the browser preflight fails.

```json
[
  {
    "AllowedOrigins": ["https://www.shamna.shop", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Next.js image domains:** The `next.config.js` `images.remotePatterns` must include the R2 public hostname (`media.shamna.shop`) for `<Image>` to render R2-hosted photos. Without this, Next.js blocks the image and renders a broken icon.

**`/listings/mine` endpoint ordering:** In FastAPI, routes are matched in registration order. `GET /listings/mine` must appear in `listings.py` **before** `GET /listings/{listing_id}`, otherwise the literal string `"mine"` is interpreted as a UUID listing ID and returns a 404.

**My Listings page — client component:** `/my-listings/page.tsx` is a client component (not server) because it needs `localStorage` access for the auth token header, and requires interactive optimistic UI updates (instant removal on delete, instant status badge change on mark-as-sold) without a page reload.

**SQLAlchemy 2.x `Mapped` style:** User model uses `Mapped[type]` + `mapped_column()` annotations instead of the legacy `Column()` style. This is required for Pylance to correctly type-check attribute assignments (e.g. `user.name = "Ahmed"` without errors).

**`ENVIRONMENT` setting:** `config.py` exposes `ENVIRONMENT: str = "development"`. Cookie `secure` flag is conditioned on this. Set `ENVIRONMENT=production` in Railway env vars.

**JSONB for listing attributes:** Category-specific fields (car mileage, apartment rooms, etc.) go in `attrs` JSONB column — no separate table per category. Flexible from day one.

**URL-based filters:** Category page filters stored in URL query params — shareable and bookmarkable. `CategoryFilters` component reads/writes via `useSearchParams` + `router.push`.

**R2 image upload — presigned URL pattern:** Frontend requests presigned PUT URLs from our API. The browser PUTs files directly to R2 — the API server never buffers image bytes. Same pattern for both listing images and profile photos.

**`AuthContext` hydration strategy:** On every app mount, `hydrate()` runs once. It checks localStorage for a stored access token, validates it via `GET /auth/me`, and falls back to a silent cookie refresh if expired. Failed refreshes during hydration call `tryRefreshSilently()` (not `refreshToken()`) — this returns null on failure without calling `logout()`, preventing spurious logouts on 404 pages or cold loads.

**Server vs client API calls:** Server components use `API_URL` env var (not exposed to browser). Client components use `NEXT_PUBLIC_API_URL`. Both point to `https://railway.shamna.shop`.

**Next.js 15 async params:** `params` in server components is a Promise. Always `const { id } = await params` before use.

**CSS variables for design tokens:** Custom colors (`--color-brand`, `--color-border`, `--color-surface`, `--color-text-primary`, `--color-text-muted`) defined in `globals.css`. Always use inline `style={{ ... }}` — never Tailwind utility classes like `bg-brand` which won't be generated for custom vars.

**`uv` for Python deps:** All packages managed through `uv`. Never `pip install` — always `uv add`.

**Pydantic v2 settings:** Use `model_config = SettingsConfigDict(env_file=".env")`. Do NOT use the old inner `class Config:` pattern.

**Homepage category data — single source of truth:** The `CATEGORIES` array in `apps/web/app/page.tsx` serves both the `<Hero>` sidebar and each `<CategorySection>` below it. Adding, removing, or reordering a category only requires editing that one array. CSS gradient strings in `accentColor` must have no spaces (e.g. `linear-gradient(...)` not `linear - gradient(...)`).

**Hero banner image — full-panel background:** `HeroCategory` accepts an optional `bannerImage` field (`string`, path under `/public`). When provided, the image fills the entire center panel as a background layer (using Next.js `<Image fill />` with `objectFit: "cover"`) at `opacity: 0.35` so the gradient and text remain readable. The emoji watermark and inline image are not used when `bannerImage` is set. Recommended export settings: WebP, 880×320px, quality 80%, under 60KB. The emoji-only fallback renders when no `bannerImage` is provided.

**Category mini-grid images:** `category-section.tsx` uses `listing.image_urls?.[0]` (not `listing.images?.[0]`) to render listing thumbnails — the API returns `image_urls`. Using the wrong field silently falls through to the emoji fallback.

**Navbar auth states:** Logged-out shows two buttons (Post an Ad → `/auth?from=/post`, Login → `/auth?from={pathname}`). Logged-in replaces both with an icon row: Bell (`/notifications`), Heart (`/saved`), ClipboardList (`/my-listings`), and avatar circle with dropdown (profile, my listings, logout).

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
| Navbar auth-aware (icon row when logged in, two buttons when logged out) | ✅ Done |
| Homepage — real API data | ✅ Done |
| Homepage — hero 3-panel layout (category sidebar + animated banner + promo card) | ✅ Done |
| Homepage — per-category listing sections (feature card + 2×4 mini grid) | ✅ Done |
| Category page + filters + view toggle — real API | ✅ Done |
| Listing detail page — real API | ✅ Done |
| Post an ad form (multi-step wizard UI) | ✅ Done |
| Auth middleware (protected routes) | ✅ Done |
| Frontend auth flow (OTP UI) — tested end to end | ✅ Done |
| Listings API (create, list, get, status, phone reveal) | ✅ Done |
| Post form wired to API (submit) | ✅ Done |
| Image upload — listings (Cloudflare R2) | ✅ Done |
| AuthContext (user state, login, logout, hydration) | ✅ Done |
| Silent token refresh (tryRefreshSilently) | ✅ Done |
| GET /auth/me endpoint | ✅ Done |
| PUT /auth/me endpoint (name, email, bio) | ✅ Done |
| PUT /auth/me/profile-pic endpoint | ✅ Done |
| POST /uploads/presign-profile endpoint | ✅ Done |
| User model expanded (bio, standing, warning_reason) | ✅ Done |
| SQLAlchemy Mapped style migration | ✅ Done |
| User profile page (inline edit, photo upload, standing badge) | ✅ Done |
| Custom domain — `www.shamna.shop` + `railway.shamna.shop` | ✅ Done |
| Auth persistence across page refresh (middleware + cookie fix) | ✅ Done — `domain=".shamna.shop"` on all cookies resolves cross-subdomain issue |
| Profile page fully functional end-to-end | ✅ Done — unblocked by custom domain |
| Cloudflare R2 CORS for custom domain | ✅ Done — allows PUT from `www.shamna.shop` |
| GET /listings/mine endpoint | ✅ Done |
| DELETE /listings/{id} endpoint | ✅ Done |
| My listings page (owner view, mark as sold, delete) | ✅ Done |
| Hero banner — full-panel background image (no emoji overlap) | ✅ Done |
| Category mini-grid — real listing images (not emoji fallback) | ✅ Done |
| Saved/starred listings | ⏳ Planned — Phase 1 Profile Phase 2 |
| Ratings system | ⏳ Planned — Phase 1 Profile Phase 2 |
| Notifications (bell icon + list) | ⏳ Planned — Phase 1 Profile Phase 2 |
| Notifications page `/notifications` | ⏳ Planned |
| Saved listings page `/saved` | ⏳ Planned |
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
- [x] AuthContext + silent token refresh
- [x] Auth-aware navbar (icon row when logged in, two buttons when logged out)
- [x] User profile page (inline editing, photo upload, account standing)
- [x] Homepage visual refactor (3-panel hero + per-category listing sections)
- [x] Custom domain (`www.shamna.shop` + `railway.shamna.shop`) — fully resolves middleware auth
- [x] My listings page (view, mark sold, delete)
- [ ] Notifications page (`/notifications`)
- [ ] Saved listings page (`/saved`)
- [ ] Profile page Phase 2 (saved listings, ratings, notifications)
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

## Next Session

### Notifications page `/notifications`
Linked in the navbar icon row but no page exists yet. Needs:
- A `notifications` table migration (id, user_id, type, message, read, created_at)
- `GET /notifications` endpoint (current user's notifications, newest first)
- `PATCH /notifications/{id}/read` or a bulk mark-all-read endpoint
- Unread count badge on the bell icon in the navbar
- The page itself: list of notifications with read/unread state, empty state

### Saved listings page `/saved`
Also linked in the navbar but no page or backend yet. Needs:
- A `user_saved_listings` join table migration (user_id, listing_id, created_at)
- `POST /listings/{id}/save` and `DELETE /listings/{id}/save` endpoints
- A save/unsave button on listing detail pages
- `GET /listings/saved` endpoint for the current user
- The `/saved` page: listing cards with unsave action, empty state

### Profile page Phase 2
Three features deferred from the initial profile page build — each needs its own migration + endpoints + UI:
- **Saved/starred listings** — saved tab on profile pulling from `user_saved_listings`
- **Ratings** — `ratings` table, post-transaction review flow, aggregate score on profile
- **Notifications** — notification list on profile, unread count in navbar