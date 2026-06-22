# 🇯🇴 Jordan Visa Guide

> The definitive visa resource for Jordanian passport holders.
> Built to scale to every passport in the world.

---

## Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | React 18 + Vite + Tailwind CSS + React Query |
| Routing      | React Router v6                              |
| Backend      | Node.js 20 + Express 5                       |
| Database     | PostgreSQL 16 (JSONB + pg_trgm + tsvector)   |
| Cache        | Redis 7 (ioredis)                            |
| Validation   | Zod                                          |
| Security     | Helmet, express-rate-limit, CORS             |
| Logging      | Winston                                      |
| Deployment   | Vercel (frontend) + Railway/Render (API + DB)|
| CDN          | Cloudflare                                   |

---

## Folder Structure

```
jordan-visa-guide/
├── frontend/                        # React app
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/
│   │   ├── robots.txt
│   │   ├── sitemap.xml              # auto-generated on build
│   │   └── og-image.png
│   └── src/
│       ├── main.jsx                 # entry point
│       ├── App.jsx                  # routes
│       ├── pages/
│       │   ├── HomePage.jsx         # ← built in this session
│       │   ├── SearchPage.jsx       # country grid + filters
│       │   ├── CountryDetailPage.jsx # /country/:iso2
│       │   ├── FAQPage.jsx
│       │   ├── AboutPage.jsx
│       │   └── ContactPage.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   └── Footer.jsx
│       │   ├── search/
│       │   │   ├── SearchBar.jsx
│       │   │   └── SearchFilters.jsx
│       │   ├── country/
│       │   │   ├── CountryCard.jsx
│       │   │   ├── VisaBadge.jsx
│       │   │   ├── RequiredDocs.jsx
│       │   │   └── EmbassyCard.jsx
│       │   └── ui/
│       │       ├── Badge.jsx
│       │       ├── Skeleton.jsx
│       │       └── SEOHead.jsx
│       ├── hooks/
│       │   ├── useCountries.js      # React Query hooks
│       │   ├── useVisaDetail.js
│       │   └── useSearch.js
│       ├── api/
│       │   └── client.js            # axios/fetch wrapper
│       ├── utils/
│       │   ├── formatters.js        # "30 days" → "30-day stay"
│       │   ├── seo.js               # generateMeta()
│       │   └── constants.js
│       └── styles/
│           └── globals.css
│
├── backend/                         # Express API
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js                # ← built in this session
│       ├── routes/
│       │   ├── countries.js
│       │   ├── visas.js
│       │   ├── faqs.js
│       │   └── admin.js
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── cache.js
│       │   └── validate.js
│       ├── services/
│       │   ├── visaService.js
│       │   ├── cacheService.js
│       │   └── analyticsService.js
│       ├── jobs/                    # Cron data update jobs
│       │   ├── sherpaSync.js        # Syncs with Sherpa API
│       │   ├── restCountriesSync.js # Syncs country metadata
│       │   └── scheduler.js        # node-cron runner
│       └── db/
│           ├── pool.js              # pg connection pool
│           ├── migrations/
│           │   └── 001_initial.sql  # ← built in this session
│           └── seeds/
│               └── countries.sql
│
├── docker-compose.yml               # local dev (pg + redis)
└── README.md
```

---

## API Reference

### Public endpoints

```
GET  /api/v1/visas/popular              → Top 12 destinations
GET  /api/v1/visas/search?q=turkey      → Fuzzy search
GET  /api/v1/visas/by-type              → Grouped by visa category
GET  /api/v1/visas/slug/:slug           → SEO lookup
GET  /api/v1/countries                  → All countries + visa type
GET  /api/v1/countries/:iso2            → Full country detail
GET  /api/v1/faqs                       → FAQ list
GET  /health                            → Health check
```

### Admin endpoints (x-admin-key header required)

```
POST /api/v1/admin/visas                → Create or update visa entry
POST /api/v1/admin/cache/clear          → Flush Redis
```

---

## Data Sources & Update Strategy

| Source                    | Type          | Update frequency   | Priority |
|---------------------------|---------------|--------------------|----------|
| Official embassy websites | Manual verify | Weekly             | Highest  |
| Sherpa API                | API           | Daily (cron)       | High     |
| IATA Timatic              | API           | Daily (cron)       | High     |
| REST Countries            | API           | Monthly (metadata) | Medium   |
| Wikipedia (fallback)      | Scrape        | On demand          | Low      |

### How data freshness works

1. **Daily cron job** syncs Sherpa API → updates `visa_requirements` where `confidence_score < 90`
2. **Admin manually verifies** high-traffic countries (top 30) weekly against embassy portals
3. **`last_verified_at`** timestamp shown to users ("verified 3 days ago")
4. **`confidence_score`** drives UI: 90-100 = green ✓, 70-89 = yellow ⚠, <70 = red — call embassy

---

## SEO Strategy

Every country page generates:
- `<title>` → "Jordan to Germany Visa Requirements 2025 | Jordan Visa Guide"
- `<meta description>` → "Jordanian passport holders need a Schengen visa for Germany. Fee: €80. Processing: 15-30 days. Full requirements and application guide."
- `<link rel="canonical">` → enforced
- Open Graph tags → for WhatsApp/social sharing
- `schema.org/FAQPage` JSON-LD → on FAQ and country pages
- `sitemap.xml` → auto-generated with all 193 country URLs
- `hreflang` → en, ar ready from day one

**Target keywords:**
- "Jordan passport visa free countries 2025"
- "Jordan to [Country] visa requirements"
- "Jordanian passport [country] eVisa"

---

## Scalability to Other Passports

The architecture is multi-tenant from day one:

1. Every table has `passport_id VARCHAR(3)` FK referencing `passports.id`
2. All queries are parameterised by passport
3. Frontend reads `VITE_PASSPORT_ID=JOR` from env
4. Subdomain routing: `jordan.visaguide.app`, `egypt.visaguide.app`
5. Adding a new passport = one row in `passports` + data entry. Zero code changes.

---

## Environment Variables

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/jordan_visa_guide
REDIS_URL=redis://localhost:6379
PORT=4000
NODE_ENV=development
ADMIN_API_KEY=your-very-secret-key
ALLOWED_ORIGINS=http://localhost:5173,https://jordanvisaguide.com
LOG_LEVEL=info

# API keys
SHERPA_API_KEY=
IATA_TIMATIC_KEY=

# frontend/.env
VITE_API_URL=http://localhost:4000/api/v1
VITE_PASSPORT_ID=JOR
```

---

## Quick Start (local dev)

```bash
# 1. Start PostgreSQL + Redis
docker-compose up -d

# 2. Run database migrations
psql $DATABASE_URL -f backend/src/db/migrations/001_initial.sql

# 3. Start backend
cd backend && npm install && npm run dev

# 4. Start frontend
cd frontend && npm install && npm run dev

# App: http://localhost:5173
# API: http://localhost:4000
```

---

## MVP Checklist

- [x] Database schema (multi-passport ready)
- [x] REST API (countries, visas, search, FAQs, admin)
- [x] Redis caching layer
- [x] Homepage (hero, search, category grid, country cards, features)
- [ ] Search page with filters
- [ ] Country detail page
- [ ] FAQ page
- [ ] About + Contact pages
- [ ] Admin CMS for data updates
- [ ] Daily Sherpa sync cron job
- [ ] Sitemap generator
- [ ] Vercel + Railway deployment

> Next session: build the Search page and Country Detail page.
