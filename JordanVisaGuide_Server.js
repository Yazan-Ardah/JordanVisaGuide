/**
 * Jordan Visa Guide — Express API
 * src/server.js
 *
 * Stack: Node.js 20, Express 5, PostgreSQL (pg), Redis (ioredis),
 *        Zod (validation), Helmet (security), Winston (logging)
 *
 * Run:  node src/server.js
 * Env:  DATABASE_URL, REDIS_URL, PORT, JWT_SECRET, ADMIN_API_KEY
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import pg from 'pg';
import Redis from 'ioredis';
import winston from 'winston';
import 'dotenv/config';

// ── Logger ────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.prettyPrint()
  ),
  transports: [new winston.transports.Console()],
});

// ── Database ──────────────────────────────────────────────
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error', { err }));

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) logger.warn('Slow query detected', { text, duration });
  return res;
}

// ── Redis Cache ───────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

redis.on('error', (err) => logger.warn('Redis unavailable, cache bypassed', { err }));

const TTL = {
  POPULAR: 60 * 60 * 6,    // 6 hours
  COUNTRY: 60 * 60 * 12,   // 12 hours
  SEARCH:  60 * 60 * 1,    // 1 hour
  FAQ:     60 * 60 * 24,   // 24 hours
};

async function cacheGet(key) {
  try { const v = await redis.get(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

async function cacheSet(key, value, ttl = TTL.COUNTRY) {
  try { await redis.setex(key, ttl, JSON.stringify(value)); }
  catch { /* fail silently */ }
}

async function cacheDelete(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch { /* fail silently */ }
}

// ── Middleware ────────────────────────────────────────────
const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://flagcdn.com'],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info('→ request', { method: req.method, path: req.path, ip: req.ip });
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many search requests. Please slow down.' },
});

app.use('/api/', apiLimiter);

// Admin auth middleware
const requireAdmin = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
};

// ─────────────────────────────────────────────────────────
// ROUTES: /api/v1/countries
// ─────────────────────────────────────────────────────────

const countriesRouter = express.Router();

/**
 * GET /api/v1/countries
 * List all countries with their visa type for the Jordanian passport.
 * Supports ?region= ?type= ?search=
 */
countriesRouter.get('/', async (req, res) => {
  try {
    const { region, type, search, passport = 'JOR', limit = 250, offset = 0 } = req.query;

    const cacheKey = `countries:${passport}:${region}:${type}:${search}:${limit}:${offset}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, cached: true });

    const conditions = [`vs.passport_id = $1`];
    const params = [passport];
    let p = 2;

    if (region) {
      conditions.push(`vs.region = $${p++}`);
      params.push(region);
    }

    if (type) {
      conditions.push(`vs.visa_type = $${p++}`);
      params.push(type);
    }

    if (search) {
      conditions.push(`(
        vs.country_name ILIKE $${p} OR
        vs.iso2 ILIKE $${p} OR
        vs.iso3 ILIKE $${p}
      )`);
      params.push(`%${search}%`);
      p++;
    }

    const sql = `
      SELECT
        iso2, iso3, country_name, country_name_ar, flag_emoji, region,
        is_schengen, is_arab_league, visa_type, max_stay_days, stay_notes,
        fee_usd, fee_notes, processing_days_min, processing_days_max,
        entry_type, is_verified, last_verified_at, slug, updated_at
      FROM visa_summary vs
      WHERE ${conditions.join(' AND ')}
      ORDER BY country_name ASC
      LIMIT $${p++} OFFSET $${p++}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await query(sql, params);

    await cacheSet(cacheKey, rows, TTL.SEARCH);
    res.json({ data: rows, count: rows.length, cached: false });
  } catch (err) {
    logger.error('GET /countries failed', { err });
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

/**
 * GET /api/v1/countries/:iso2
 * Full detail for one destination country
 */
countriesRouter.get('/:iso2', async (req, res) => {
  try {
    const iso2 = req.params.iso2.toUpperCase();
    const passport = req.query.passport || 'JOR';

    const cacheKey = `country:${iso2}:${passport}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, cached: true });

    const [visaRes, embassyRes] = await Promise.all([
      query(
        `SELECT * FROM visa_summary WHERE iso2 = $1 AND passport_id = $2`,
        [iso2, passport]
      ),
      query(
        `SELECT * FROM embassies WHERE country_iso2 = $1 AND passport_id = $2 AND is_active = TRUE`,
        [iso2, passport]
      ),
    ]);

    if (!visaRes.rows.length) {
      return res.status(404).json({ error: `No visa data found for destination: ${iso2}` });
    }

    const result = { ...visaRes.rows[0], embassies: embassyRes.rows };
    await cacheSet(cacheKey, result, TTL.COUNTRY);
    res.json({ data: result, cached: false });
  } catch (err) {
    logger.error('GET /countries/:iso2 failed', { err });
    res.status(500).json({ error: 'Failed to fetch country detail' });
  }
});

// ─────────────────────────────────────────────────────────
// ROUTES: /api/v1/visas
// ─────────────────────────────────────────────────────────

const visasRouter = express.Router();

/**
 * GET /api/v1/visas/popular
 * Top 12 most searched destinations
 */
visasRouter.get('/popular', async (req, res) => {
  try {
    const passport = req.query.passport || 'JOR';
    const cacheKey = `popular:${passport}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, cached: true });

    const { rows } = await query(
      `SELECT * FROM popular_destinations WHERE passport_id = $1 LIMIT 12`,
      [passport]
    );

    await cacheSet(cacheKey, rows, TTL.POPULAR);
    res.json({ data: rows, cached: false });
  } catch (err) {
    logger.error('GET /visas/popular failed', { err });
    res.status(500).json({ error: 'Failed to fetch popular destinations' });
  }
});

/**
 * GET /api/v1/visas/search?q=turkey
 * Fuzzy search with pg_trgm
 */
visasRouter.get('/search', searchLimiter, async (req, res) => {
  try {
    const SearchSchema = z.object({
      q:        z.string().min(1).max(100),
      passport: z.string().length(3).default('JOR'),
      type:     z.enum(['visa_free','visa_on_arrival','evisa','embassy_visa','not_permitted']).optional(),
      region:   z.string().max(60).optional(),
    });

    const parsed = SearchSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid search parameters', details: parsed.error.issues });
    }

    const { q, passport, type, region } = parsed.data;

    // Log for analytics (fire and forget, no PII)
    query(
      `INSERT INTO search_analytics (query, passport_id, session_id)
       VALUES ($1, $2, $3)`,
      [q, passport, req.headers['x-session-id'] || null]
    ).catch(() => {});

    const conditions = [`vs.passport_id = $1`];
    const params = [passport];
    let p = 2;

    conditions.push(`(
      vs.country_name ILIKE $${p} OR
      vs.iso2 ILIKE $${p} OR
      similarity(vs.country_name, $${p+1}) > 0.2
    )`);
    params.push(`%${q}%`, q);
    p += 2;

    if (type) { conditions.push(`vs.visa_type = $${p++}`); params.push(type); }
    if (region) { conditions.push(`vs.region = $${p++}`); params.push(region); }

    const { rows } = await query(`
      SELECT iso2, iso3, country_name, flag_emoji, region, visa_type,
             max_stay_days, fee_usd, processing_days_min, entry_type, slug,
             similarity(country_name, $${p}) AS relevance
      FROM visa_summary vs
      WHERE ${conditions.join(' AND ')}
      ORDER BY relevance DESC, country_name ASC
      LIMIT 30
    `, [...params, q]);

    res.json({ data: rows, query: q, count: rows.length });
  } catch (err) {
    logger.error('GET /visas/search failed', { err });
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/v1/visas/by-type
 * Group all destinations by visa type
 */
visasRouter.get('/by-type', async (req, res) => {
  try {
    const passport = req.query.passport || 'JOR';
    const cacheKey = `by-type:${passport}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, cached: true });

    const { rows } = await query(`
      SELECT
        visa_type,
        COUNT(*) AS count,
        json_agg(json_build_object(
          'iso2', iso2, 'name', country_name, 'flag', flag_emoji,
          'region', region, 'max_stay_days', max_stay_days, 'slug', slug
        ) ORDER BY country_name) AS countries
      FROM visa_summary
      WHERE passport_id = $1
      GROUP BY visa_type
      ORDER BY CASE visa_type
        WHEN 'visa_free'      THEN 1
        WHEN 'visa_on_arrival' THEN 2
        WHEN 'evisa'          THEN 3
        WHEN 'embassy_visa'   THEN 4
        ELSE 5
      END
    `, [passport]);

    await cacheSet(cacheKey, rows, TTL.POPULAR);
    res.json({ data: rows, cached: false });
  } catch (err) {
    logger.error('GET /visas/by-type failed', { err });
    res.status(500).json({ error: 'Failed to fetch visa types' });
  }
});

/**
 * GET /api/v1/visas/slug/:slug
 * Lookup by SEO slug (used by country detail page)
 */
visasRouter.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `slug:${slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, cached: true });

    const { rows } = await query(
      `SELECT * FROM visa_summary WHERE slug = $1`,
      [slug]
    );

    if (!rows.length) return res.status(404).json({ error: 'Page not found' });

    await cacheSet(cacheKey, rows[0], TTL.COUNTRY);
    res.json({ data: rows[0], cached: false });
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

// ─────────────────────────────────────────────────────────
// ROUTES: /api/v1/faqs
// ─────────────────────────────────────────────────────────

const faqsRouter = express.Router();

/**
 * GET /api/v1/faqs
 * General FAQs, or filtered by country / category
 */
faqsRouter.get('/', async (req, res) => {
  try {
    const { country, category, passport = 'JOR' } = req.query;
    const cacheKey = `faqs:${passport}:${country}:${category}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ data: cached, cached: true });

    const conditions = [`(passport_id = $1 OR passport_id IS NULL)`, `is_published = TRUE`];
    const params = [passport];
    let p = 2;

    if (country) { conditions.push(`(country_iso2 = $${p++} OR country_iso2 IS NULL)`); params.push(country); }
    else { conditions.push(`country_iso2 IS NULL`); }
    if (category) { conditions.push(`category = $${p++}`); params.push(category); }

    const { rows } = await query(
      `SELECT id, question, answer, category, display_order
       FROM faqs WHERE ${conditions.join(' AND ')}
       ORDER BY display_order ASC, created_at ASC`,
      params
    );

    await cacheSet(cacheKey, rows, TTL.FAQ);
    res.json({ data: rows, cached: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// ─────────────────────────────────────────────────────────
// ROUTES: /api/v1/leads  (consultation form submissions)
// ─────────────────────────────────────────────────────────

const leadsRouter = express.Router();

const LeadSchema = z.object({
  full_name:                  z.string().min(1).max(200),
  country_code:               z.string().max(10).default('+962'),
  phone_number:               z.string().min(5).max(30),
  destination_country:        z.string().min(1).max(100),
  destination_country_hidden: z.string().max(100).optional().nullable(),
  notes:                      z.string().max(1000).optional().nullable(),
});

const leadsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                      // 5 submissions per IP per hour
  message: { error: 'Too many submissions. Please try again later.' },
});

/**
 * POST /api/v1/leads
 * Store a consultation request from the visa guide form.
 */
leadsRouter.post('/', leadsLimiter, async (req, res) => {
  try {
    const parsed = LeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const d = parsed.data;
    const ipRaw = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    const ipHash = ipRaw
      ? Buffer.from(ipRaw).toString('base64').substring(0, 64)
      : null;

    const { rows } = await query(
      `INSERT INTO consultation_leads
         (full_name, country_code, phone_number, destination_country, page_country, notes, source_url, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        d.full_name.trim(),
        d.country_code,
        d.phone_number.trim(),
        d.destination_country.trim(),
        d.destination_country_hidden?.trim() || null,
        d.notes?.trim() || null,
        req.headers.referer || null,
        ipHash,
      ]
    );

    logger.info('New consultation lead', { id: rows[0].id, destination: d.destination_country });
    return res.status(200).json({ success: true, id: rows[0].id });
  } catch (err) {
    logger.error('POST /leads failed', { err });
    return res.status(500).json({ error: 'Failed to save your request. Please try again.' });
  }
});

/**
 * GET /api/v1/leads  (admin only — returns all leads)
 */
leadsRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, destination, limit = 100, offset = 0 } = req.query;
    const conditions = [];
    const params = [];
    let p = 1;

    if (status) { conditions.push(`status = $${p++}`); params.push(status); }
    if (destination) { conditions.push(`destination_country ILIKE $${p++}`); params.push(`%${destination}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM leads_dashboard ${where}
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ data: rows, count: rows.length });
  } catch (err) {
    logger.error('GET /leads failed', { err });
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ─────────────────────────────────────────────────────────
// ADMIN ROUTES: /api/v1/admin (protected)
// ─────────────────────────────────────────────────────────

const adminRouter = express.Router();
adminRouter.use(requireAdmin);

const VisaUpdateSchema = z.object({
  passport_id:         z.string().length(3).default('JOR'),
  destination_iso2:    z.string().length(2),
  visa_type:           z.enum(['visa_free','visa_on_arrival','evisa','embassy_visa','not_permitted']),
  max_stay_days:       z.number().int().positive().nullable().optional(),
  stay_notes:          z.string().max(500).optional(),
  fee_usd:             z.number().nonnegative().nullable().optional(),
  fee_notes:           z.string().max(500).optional(),
  processing_days_min: z.number().int().nonnegative().nullable().optional(),
  processing_days_max: z.number().int().nonnegative().nullable().optional(),
  entry_type:          z.enum(['single','double','multiple']).default('single'),
  apply_online_url:    z.string().url().nullable().optional(),
  required_docs:       z.array(z.object({ name: z.string(), details: z.string().optional() })).default([]),
  warnings:            z.array(z.string()).default([]),
  tips:                z.array(z.string()).default([]),
  data_source:         z.string().max(100).optional(),
  is_verified:         z.boolean().default(false),
  confidence_score:    z.number().int().min(0).max(100).optional(),
  meta_title:          z.string().max(160).optional(),
  meta_description:    z.string().max(320).optional(),
});

/**
 * POST /api/v1/admin/visas
 * Create or update a visa requirement
 */
adminRouter.post('/visas', async (req, res) => {
  try {
    const parsed = VisaUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const d = parsed.data;
    const slug = `jordan-to-${d.destination_iso2.toLowerCase()}-visa`;

    const { rows } = await query(`
      INSERT INTO visa_requirements (
        passport_id, destination_iso2, visa_type, max_stay_days, stay_notes,
        fee_usd, fee_notes, processing_days_min, processing_days_max,
        entry_type, apply_online_url, required_docs, warnings, tips,
        data_source, is_verified, confidence_score, slug, meta_title,
        meta_description, last_verified_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
      ON CONFLICT (passport_id, destination_iso2) DO UPDATE SET
        visa_type            = EXCLUDED.visa_type,
        max_stay_days        = EXCLUDED.max_stay_days,
        stay_notes           = EXCLUDED.stay_notes,
        fee_usd              = EXCLUDED.fee_usd,
        fee_notes            = EXCLUDED.fee_notes,
        processing_days_min  = EXCLUDED.processing_days_min,
        processing_days_max  = EXCLUDED.processing_days_max,
        entry_type           = EXCLUDED.entry_type,
        apply_online_url     = EXCLUDED.apply_online_url,
        required_docs        = EXCLUDED.required_docs,
        warnings             = EXCLUDED.warnings,
        tips                 = EXCLUDED.tips,
        data_source          = EXCLUDED.data_source,
        is_verified          = EXCLUDED.is_verified,
        confidence_score     = EXCLUDED.confidence_score,
        meta_title           = EXCLUDED.meta_title,
        meta_description     = EXCLUDED.meta_description,
        last_verified_at     = NOW(),
        updated_at           = NOW()
      RETURNING *
    `, [
      d.passport_id, d.destination_iso2, d.visa_type, d.max_stay_days, d.stay_notes,
      d.fee_usd, d.fee_notes, d.processing_days_min, d.processing_days_max,
      d.entry_type, d.apply_online_url,
      JSON.stringify(d.required_docs), JSON.stringify(d.warnings), JSON.stringify(d.tips),
      d.data_source, d.is_verified, d.confidence_score, slug, d.meta_title, d.meta_description,
    ]);

    // Invalidate related cache entries
    await cacheDelete(`country:${d.destination_iso2}:*`);
    await cacheDelete(`popular:*`);
    await cacheDelete(`by-type:*`);
    await cacheDelete(`slug:jordan-to-${d.destination_iso2.toLowerCase()}*`);

    logger.info('Visa updated via admin', { destination: d.destination_iso2 });
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    logger.error('POST /admin/visas failed', { err });
    res.status(500).json({ error: 'Failed to save visa data' });
  }
});

/**
 * POST /api/v1/admin/cache/clear
 * Manually clear all cache
 */
adminRouter.post('/cache/clear', async (req, res) => {
  try {
    await redis.flushdb();
    logger.info('Cache cleared by admin');
    res.json({ message: 'Cache cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ─────────────────────────────────────────────────────────
// Mount routers
// ─────────────────────────────────────────────────────────

app.use('/api/v1/countries', countriesRouter);
app.use('/api/v1/visas', visasRouter);
app.use('/api/v1/faqs', faqsRouter);
app.use('/api/v1/leads', leadsRouter);
app.use('/api/v1/admin', adminRouter);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    const redisStatus = await redis.ping().catch(() => 'unavailable');
    res.json({
      status: 'healthy',
      db: 'connected',
      cache: redisStatus === 'PONG' ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { err });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🇯🇴 Jordan Visa Guide API running on port ${PORT}`);
});

export default app;
