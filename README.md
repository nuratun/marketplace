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
- Save/unsave listings — heart button on cards and detail pages, `/saved` page
- Notifications — admin broadcasts, two-way admin ↔ user threads, system events (expiry, phone reveal, saved listing changes, account standing)
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
| **Cache / Queue** | Redis + BullMQ | Planned — needed for automated notification triggers (expiry warnings, welcome messages) |
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
│   │   │   │   ├── base.py         ← SQLAlchemy DeclarativeBase only — no model imports
│   │   │   │   └── session.py      ← engine, SessionLocal, get_db
│   │   │   ├── models/
│   │   │   │   ├── user.py         ← User model (Mapped style) — includes is_admin bool
│   │   │   │   ├── otp.py          ← OTPCode model
│   │   │   │   ├── listing.py      ← Listing model
│   │   │   │   ├── saved_listing.py ← SavedListing model (user_saved_listings table)
│   │   │   │   ├── notification.py ← Notification, NotificationThread, NotificationMessage models + NotificationType enum
│   │   │   │   └── rating.py       ← Rating model — ratings table with all constraints
│   │   │   ├── routers/
│   │   │   │   ├── auth.py         ← /auth/* endpoints including /auth/me (GET + PUT)
│   │   │   │   ├── listings.py     ← /listings CRUD + /listings/mine + /listings/saved + save/unsave + phone reveal + delete
│   │   │   │   ├── uploads.py      ← /uploads/presign + /uploads/presign-profile
│   │   │   │   ├── notifications.py ← /notifications + /admin/notifications endpoints
│   │   │   │   └── ratings.py      ← POST /listings/{id}/rate + GET /users/{id}/ratings + GET /users/{id}/ratings/summary
│   │   │   └── main.py             ← FastAPI app, CORS, router registration
│   │   ├── alembic/
│   │   │   └── env.py              ← imports all models for autogenerate detection
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
│   │   │   ├── saved/              ← Saved listings page
│   │   │   │   └── page.tsx        ← Grid of saved listings, empty state, auth-gated
│   │   │   ├── notifications/      ← Notifications page
│   │   │   │   └── page.tsx        ← Two tabs: flat notifications + two-way message threads
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
│   │   │   ├── navbar.tsx          ← Auth-aware: logged-out = two buttons; logged-in = icon row (Bell/Heart/ClipboardList) + avatar dropdown; bell shows unread badge
│   │   │   ├── footer.tsx
│   │   │   ├── hero.tsx            ← 3-panel layout: category sidebar (hover) + animated banner + post-ad promo card
│   │   │   ├── category-section.tsx ← Per-category block: colored feature card + 2×4 mini listing grid
│   │   │   ├── listing-card.tsx    ← Grid card (homepage + category page) — includes SaveButton overlay
│   │   │   ├── listing-list-card.tsx ← Horizontal card for list view
│   │   │   ├── listing-gallery.tsx ← Image carousel with thumbnails
│   │   │   ├── category-filters.tsx ← URL-based filters: condition, city, price, sort
│   │   │   ├── view-toggle.tsx     ← Grid/list toggle
│   │   │   ├── save-button.tsx     ← Client component: heart toggle, two variants (icon overlay / full button)
│   │   │   ├── phone-reveal.tsx    ← Reveal phone button + WhatsApp button
│   │   │   └── report-button.tsx
│   │   ├── contexts/
│   │   │   └── auth-context.tsx    ← AuthProvider, useAuth(), AuthUser type
│   │   ├── lib/
│   │   │   └── api.ts              ← apiFetch, getAuthHeaders, getApiBaseUrl
│   │   ├── types/
│   │   │   ├── listing.ts          ← Listing, Seller, ListingsResponse types
│   │   │   ├── post.ts             ← PostFormData, EMPTY_POST_FORM
│   │   │   └── notification.ts     ← Notification, NotificationThread, NotificationMessage, NotificationType, UnreadCount types
│   │   └── middleware.ts           ← Protects /post, /profile, /my-listings, /saved, /notifications routes
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
uv run alembic revision --autogenerate -m "describe your change"
uv run alembic upgrade head
```

> **Adding NOT NULL columns to existing tables:** Alembic autogenerate will produce `ADD COLUMN col BOOLEAN NOT NULL` with no default, which Postgres rejects when rows already exist. Fix by adding `server_default='false'` (or the appropriate default) to the generated `op.add_column()` call before running `upgrade head`.

### CI migrations

Trigger manually from **GitHub → Actions → Run DB Migrations**.

### Current tables

| Table | Description |
|---|---|
| `users` | id, phone, name, email, bio, profile_pic, user_type, standing, warning_reason, is_active, is_admin, average_rating, rating_count, created_at |
| `otp_codes` | phone, code, used, expires_at, created_at |
| `listings` | Full listing record — see columns below |
| `user_saved_listings` | user_id, listing_id, created_at — unique constraint on (user_id, listing_id) |
| `notifications` | Flat one-way notifications (system events + admin broadcasts) |
| `notification_threads` | Two-way admin ↔ user conversation threads |
| `notification_messages` | Individual messages inside a thread |

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
| `is_admin` | Boolean | Default false — grants access to `/admin/*` endpoints |
| `average_rating` | Numeric(3,2) | Nullable — denormalized avg score, updated after each new rating |
| `rating_count` | Integer | Default 0 — denormalized count, updated after each new rating |
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

### user_saved_listings table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id, CASCADE delete, indexed |
| `listing_id` | UUID | FK → listings.id, CASCADE delete, indexed |
| `created_at` | DateTime | |
| — | UniqueConstraint | `(user_id, listing_id)` — one save per user per listing |

### notifications table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id, CASCADE delete, indexed |
| `type` | Enum (NotificationType) | See enum below |
| `title` | String(200) | |
| `body` | Text | |
| `listing_id` | UUID | Nullable FK → listings.id, SET NULL on delete |
| `is_read` | Boolean | Default false |
| `created_at` | DateTime | |

### notification_threads table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id, CASCADE delete, indexed |
| `subject` | String(300) | |
| `type` | Enum (NotificationType) | |
| `is_noreply` | Boolean | Default false — when true, user cannot reply |
| `user_has_unread` | Boolean | Default true — drives bell badge count |
| `created_at` | DateTime | |
| `updated_at` | DateTime | Bumped on every new message — used for sorting |

### notification_messages table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `thread_id` | UUID | FK → notification_threads.id, CASCADE delete, indexed |
| `body` | Text | |
| `sender_is_admin` | Boolean | True = admin sent, False = user sent |
| `created_at` | DateTime | |

### ratings table columns

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `listing_id` | UUID | FK → listings.id, CASCADE delete, indexed — the sold listing that triggered the rating |
| `rater_id` | UUID | FK → users.id, CASCADE delete — who is leaving the rating |
| `ratee_id` | UUID | FK → users.id, CASCADE delete, indexed — who is being rated (always the listing owner) |
| `role` | String(10) | `"buyer"` or `"seller"` — the rater's role in the transaction |
| `score` | SmallInt | 1–5 stars |
| `recommended` | Boolean | Would recommend this user |
| `created_at` | DateTime | |
| — | UniqueConstraint | `(listing_id, rater_id)` — one rating per person per listing |
| — | CheckConstraint | `rater_id != ratee_id` — cannot rate yourself |
| — | CheckConstraint | `score BETWEEN 1 AND 5` |

### NotificationType enum

| Value | Description |
|---|---|
| `ADMIN_BROADCAST` | Admin → all or selected users, always one-way (flat notification) |
| `ADMIN_MESSAGE` | Admin → user, starts a two-way thread |
| `LISTING_EXPIRING_SOON` | System — 3 days before `expires_at` |
| `LISTING_EXPIRED` | System — on `expires_at` |
| `LISTING_REMOVED` | System/admin — listing removed by admin |
| `LISTING_PHONE_REVEALED` | System — someone revealed your phone number |
| `WELCOME` | System — sent to new users on registration |
| `ACCOUNT_WARNING` | System/admin — standing changed to warned |
| `ACCOUNT_SUSPENDED` | System/admin — standing changed to suspended |
| `ACCOUNT_REINSTATED` | System/admin — standing restored to good |
| `SAVED_PRICE_DROP` | System — price changed on a saved listing |
| `SAVED_LISTING_SOLD` | System — saved listing marked as sold |
| `SAVED_LISTING_REMOVED` | System — saved listing deleted |
| `RATING_RECEIVED` | System — someone rated you (phase 2) |

### Migration history

| Revision | Description |
|---|---|
| `8a5d4dc3c4c1` | Initial — users, otp_codes, listings tables |
| `1.2_user_profile_fields` | Add bio, standing, warning_reason to users |
| `add_user_saved_listings` | Add user_saved_listings join table |
| `add_notifications_and_threads` | Add notifications, notification_threads, notification_messages tables + is_admin to users |
| `001_add_ratings` | Add ratings table + average_rating and rating_count columns to users |

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
| GET | `/listings/saved` | Required | Get all listings saved by current user |
| GET | `/listings/{id}` | Optional | Get listing detail (increments views) |
| PATCH | `/listings/{id}/status` | Required (owner only) | Mark as sold |
| DELETE | `/listings/{id}` | Required (owner only) | Hard delete a listing |
| GET | `/listings/{id}/phone` | Required | Reveal seller phone number |
| POST | `/listings/{id}/save` | Required | Save a listing (idempotent) |
| DELETE | `/listings/{id}/save` | Required | Unsave a listing |

> ⚠️ Route order matters in FastAPI: `/listings/mine` and `/listings/saved` must be registered **before** `/listings/{id}` in `listings.py`, otherwise the literal strings `"mine"` and `"saved"` are matched as listing IDs and return 404s. The same rule applies in `notifications.py` — `/notifications/read-all`, `/notifications/threads`, and `/notifications/unread-count` must appear before `/notifications/{id}` and `/notifications/threads/{id}`.

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

**POST /listings/{id}/save response:**
```json
{ "saved": true }
```

**DELETE /listings/{id}/save response:**
```json
{ "saved": false }
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

### Notification endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Required | Current user's flat notifications, newest first |
| GET | `/notifications/unread-count` | Required | Unread counts for bell badge (`unread_notifications`, `unread_threads`, `total`) |
| PATCH | `/notifications/read-all` | Required | Mark all flat notifications as read |
| PATCH | `/notifications/{id}/read` | Required | Mark one flat notification as read |
| GET | `/notifications/threads` | Required | User's thread summaries, newest-updated first |
| GET | `/notifications/threads/{id}` | Required | Full thread with all messages — marks thread as read |
| POST | `/notifications/threads/{id}/reply` | Required | User replies to a thread (403 if `is_noreply=true`) |
| POST | `/admin/notifications/broadcast` | Admin only | Send flat notification to all or selected users |
| POST | `/admin/notifications/threads` | Admin only | Start a two-way thread with a user |
| POST | `/admin/notifications/threads/{id}/reply` | Admin only | Admin replies in an existing thread |

**GET /notifications/unread-count response:**
```json
{ "unread_notifications": 3, "unread_threads": 1, "total": 4 }
```

**POST /admin/notifications/broadcast request:**
```json
{
  "type": "ADMIN_BROADCAST",
  "title": "تحديث مهم",
  "body": "سيتوقف الموقع عن العمل مؤقتاً للصيانة.",
  "user_ids": null
}
```
> `user_ids: null` sends to all active users. Pass an array of UUIDs to target specific users.

**POST /admin/notifications/threads request:**
```json
{
  "user_id": "uuid",
  "subject": "مراجعة الإعلان",
  "type": "ADMIN_MESSAGE",
  "body": "لاحظنا بعض المخالفات في إعلانك، نرجو التوضيح.",
  "is_noreply": false
}
```

**Admin auth:** Requires `is_admin = true` on the user record. Grant via SQL:
```sql
UPDATE users SET is_admin = true WHERE phone = '+963...';
```

**Authorization for protected endpoints:**
```
Authorization: Bearer <access_token>
```

### Ratings endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/listings/{id}/rate` | Required | Submit a rating on a sold listing |
| GET | `/users/{id}/ratings` | No | All ratings received by a user, newest first |
| GET | `/users/{id}/ratings/summary` | No | Aggregate stats: avg score, total count, recommend % |

> ⚠️ Route order note: `/listings/{id}/rate` is a POST so it doesn't conflict with `GET /listings/{id}` — no ordering concern here.

**POST /listings/{id}/rate request:**
```json
{
  "score": 4,
  "recommended": true,
  "role": "buyer"
}
```

**POST /listings/{id}/rate errors:**
- `400` — listing is not yet marked as sold
- `400` — cannot rate your own listing
- `409` — you have already rated this listing
- `404` — listing not found

**GET /users/{id}/ratings/summary response:**
```json
{
  "total": 12,
  "average_score": 4.58,
  "recommend_pct": 91.7
}
```
> `average_score` and `recommend_pct` are `null` when `total` is 0 (no ratings yet).

**Rating object shape:**
```json
{
  "id": "uuid",
  "listing_id": "uuid",
  "rater_id": "uuid",
  "ratee_id": "uuid",
  "role": "buyer",
  "score": 4,
  "recommended": true,
  "created_at": "2026-05-16T...",
  "rater_name": "أحمد"
}
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

**`/listings/mine` and `/listings/saved` endpoint ordering:** In FastAPI, routes are matched in registration order. `GET /listings/mine` and `GET /listings/saved` must appear in `listings.py` **before** `GET /listings/{listing_id}`, otherwise the literal strings `"mine"` and `"saved"` are interpreted as UUID listing IDs and return 404s. The same principle applies to notifications: `/notifications/read-all`, `/notifications/threads`, and `/notifications/unread-count` must be registered before `/notifications/{id}` and `/notifications/threads/{id}`.

**My Listings page — client component:** `/my-listings/page.tsx` is a client component (not server) because it needs `localStorage` access for the auth token header, and requires interactive optimistic UI updates (instant removal on delete, instant status badge change on mark-as-sold) without a page reload.

**SaveButton — isolated client component:** `save-button.tsx` is a `"use client"` component intentionally kept separate from `listing-card.tsx` and `listing/[id]/page.tsx`, both of which are server components. This avoids converting the entire card or detail page to a client component just for one interactive element. The button uses `e.preventDefault()` + `e.stopPropagation()` to prevent the parent `<Link>` from navigating when the heart is tapped on a card.

**SaveButton auth redirect:** Unauthenticated users who tap the heart are redirected to `/auth?from=/listing/{id}` — after login they land back on the listing. Authenticated users get an optimistic toggle (state flips immediately, rolls back on API failure).

**SaveButton initial state:** The heart always renders unfilled on page load because category pages are server components with no user context — there's no cheap way to know which listings the current user has saved at render time. The filled/unfilled state becomes accurate after the user interacts. A future optimization is to fetch `/listings/saved` server-side on authenticated requests and pass the saved IDs as props.

**`db/base.py` — models must NOT be imported here:** `base.py` only defines `DeclarativeBase`. Model imports belong in `alembic/env.py` (for autogenerate detection), not in `base.py`. Importing models in `base.py` creates a circular import: `user.py` imports `Base` from `base.py`, and if `base.py` imports `User` from `user.py`, Python partially initializes `user.py` before `Base` is defined — crashing with `ImportError: cannot import name 'User' from partially initialized module`.

**SQLAlchemy 2.x `Mapped` style:** User model uses `Mapped[type]` + `mapped_column()` annotations instead of the legacy `Column()` style. This is required for Pylance to correctly type-check attribute assignments (e.g. `user.name = "Ahmed"` without errors). New models (`SavedListing`, `Notification`, `NotificationThread`, `NotificationMessage`) follow the same `Mapped` style for consistency.

**`__table_args__` with a single constraint:** When `__table_args__` is a tuple containing constraints (e.g. `UniqueConstraint`), SQLAlchemy requires an empty dict `{}` as the last element of the tuple — e.g. `(UniqueConstraint(...), {})`. Without it, SQLAlchemy raises `ArgumentError: __table_args__ value must be a tuple, dict, or None`.

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

**Navbar auth states:** Logged-out shows two buttons (Post an Ad → `/auth?from=/post`, Login → `/auth?from={pathname}`). Logged-in replaces both with an icon row: Bell (`/notifications`), Heart (`/saved`), ClipboardList (`/my-listings`), and avatar circle with dropdown (profile, my listings, logout). The bell icon shows an unread badge driven by `GET /notifications/unread-count`.

**Notification architecture — two data models:** Flat `notifications` table for one-way system events and admin broadcasts. Separate `notification_threads` + `notification_messages` tables for two-way admin ↔ user conversations. Keeping them separate avoids hacking replies into a flat table. `is_noreply` on a thread prevents user replies while still using the thread UI (rare, but supported). The `user_has_unread` boolean on threads is the cheap flag used for the bell badge count — avoids a message join on every page load.

**Admin access — `is_admin` flag:** No separate admin login. Admins are regular users with `is_admin = true` on their `users` row. The `get_current_admin` FastAPI dependency checks this flag and raises 403 otherwise. Grant admin access via a direct SQL update in Supabase.

**Ratings — open model (no buyer tracking):** Any authenticated user can rate a seller on a sold listing, one rating per person per listing. We don't track who the buyer was (no checkout/offer flow exists yet), so locking rating to a specific buyer isn't possible. The constraint is enforced by a `UNIQUE(listing_id, rater_id)` index — double-submitting returns a clean 409. The ratee is always the listing owner (seller). Tighten this to buyer-only once a messaging/offer flow is added.

**Ratings — denormalized stats on users:** `average_rating` (Numeric 3,2) and `rating_count` (Integer) are stored directly on the `users` row and updated by `_refresh_user_stats()` after every new rating. This avoids an aggregate query across the `ratings` table every time a profile page loads. The tradeoff is that these values are eventually consistent by one write — acceptable for a marketplace context.

**Alembic NOT NULL column gotcha:** Adding a `NOT NULL` column to a table with existing rows requires a `server_default` in the migration. Alembic autogenerate does not add this automatically. Always inspect generated migration files and add `server_default='false'` (or appropriate default) to `op.add_column()` calls for boolean columns on existing tables.

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
| Saved listings — user_saved_listings migration | ✅ Done |
| Saved listings — POST/DELETE /listings/{id}/save endpoints | ✅ Done |
| Saved listings — GET /listings/saved endpoint | ✅ Done |
| Saved listings — SaveButton component (icon + full variants) | ✅ Done |
| Saved listings — heart overlay on listing cards (category page) | ✅ Done |
| Saved listings — full save button on listing detail page | ✅ Done |
| Saved listings — /saved page with empty state | ✅ Done |
| Notifications — is_admin field on users + migration | ✅ Done |
| Notifications — notification.py model (3 tables + NotificationType enum) | ✅ Done |
| Notifications — notifications.py router (all user + admin endpoints) | ✅ Done |
| Notifications — /notifications page (two tabs: flat + threads) | ✅ Done |
| Notifications — thread detail view with reply box | ✅ Done |
| Notifications — unread bell badge on navbar | ✅ Done |
| Notifications — notification.ts types file | ✅ Done |
| Profile page — apiFetch Content-Type bug fixed (spread order) | ✅ Done — `{ headers, ...rest }` destructure pattern prevents options spread clobbering merged headers |
| Ratings — ratings table migration (+ average_rating, rating_count on users) | ✅ Done |
| Ratings — Rating model (rating.py) | ✅ Done |
| Ratings — ratings.py router (POST /listings/{id}/rate, GET /users/{id}/ratings, GET /users/{id}/ratings/summary) | ✅ Done |
| Ratings — frontend UI (profile page star display, rate modal) | ⏳ Next session |
| Automated notifications (welcome, expiry warnings, price drops) | ⏳ Planned — needs Redis + BullMQ |
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
- [x] Saved listings (heart button on cards + detail page, `/saved` page)
- [x] Notifications (admin broadcast + two-way threads + system event types, bell badge, `/notifications` page)
- [x] Ratings backend (ratings table, rating.py model, ratings.py router — 3 endpoints)
- [ ] Ratings frontend (star display on profile, rate modal triggered from sold listings)
- [ ] Search (Meilisearch)

### Phase 2 — Pre-launch
- [ ] Migrate Railway → Hetzner + Coolify
- [ ] Self-host Meilisearch + Redis
- [ ] Automated notifications (welcome message, expiry warnings, price drop alerts) via BullMQ
- [ ] Image moderation pipeline
- [ ] Mobile app (React Native + Expo)
- [ ] Remove OTP dev bypass, wire real SMS provider

### Phase 3 — Launch & Growth
- [ ] Business/advertiser accounts
- [ ] ML features: recommendations, price suggestions, fraud detection
- [ ] Analytics dashboard

---

## Next Session

### Ratings frontend
Backend is fully wired. Frontend deliverables:

- **`apps/web/types/rating.ts`** — `Rating`, `RatingSummary` types matching the API shapes
- **Star display on profile page** — show average score + total count on `GET /users/{id}/ratings/summary`; render filled/half/empty stars inline on the profile header card
- **Ratings list on profile** — collapsible section or tab showing individual `Rating` objects from `GET /users/{id}/ratings` (rater name, score, role badge, recommend pill, timestamp)
- **Rate modal** — triggered from `/my-listings` when a listing is marked as sold; or from the listing detail page when `status === "sold"` and the viewer is not the owner; posts to `POST /listings/{id}/rate`
- **`apps/web/types/rating.ts`** should include:
  ```ts
  export type Rating = {
    id: string
    listing_id: string
    rater_id: string
    ratee_id: string
    role: "buyer" | "seller"
    score: number          // 1–5
    recommended: boolean
    created_at: string
    rater_name: string | null
  }

  export type RatingSummary = {
    total: number
    average_score: number | null
    recommend_pct: number | null
  }
  ```

### Automated notifications (when Redis + BullMQ are live)
The notification infrastructure is in place. Automated triggers to wire up later:
- `WELCOME` — send on user creation (hook into `/auth/verify-otp`)
- `LISTING_EXPIRING_SOON` — BullMQ scheduled job, 3 days before `expires_at`
- `LISTING_EXPIRED` — BullMQ scheduled job, on `expires_at`
- `LISTING_PHONE_REVEALED` — hook into `GET /listings/{id}/phone`
- `SAVED_PRICE_DROP` — hook into listing update endpoint
- `SAVED_LISTING_SOLD` / `SAVED_LISTING_REMOVED` — hook into status/delete endpoints

### Search — Meilisearch integration
- Meilisearch instance (self-hosted on Hetzner, or Meilisearch Cloud for dev)
- Index sync: new/updated/deleted listings pushed to Meilisearch
- Arabic full-text search settings (language tokenizer, stopwords, ranking rules)
- `GET /search?q=` endpoint wired to Meilisearch
- Search bar in the navbar/hero
- Search results page