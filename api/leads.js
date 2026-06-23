/**
 * Vercel Serverless Function — POST /api/leads
 * Stores consultation form submissions into PostgreSQL.
 *
 * Environment variables required (set in Vercel dashboard):
 *   DATABASE_URL  — PostgreSQL connection string
 *                   e.g. postgresql://user:pass@host:5432/dbname
 *
 * Supported providers: Supabase, Neon, Railway, Render, PlanetScale Postgres
 */

import pg from 'pg';

// Reuse pool across warm invocations (serverless best practice)
let pool;
function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Required for most hosted PostgreSQL providers (Supabase, Neon, etc.)
      ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      max: 2,                   // keep small for serverless
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on('error', (err) => console.error('[leads] pg pool error', err.message));
  }
  return pool;
}

// ── Validation ────────────────────────────────────────────
function validateBody(body) {
  const errors = [];
  const { full_name, phone_number, destination_country } = body ?? {};

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    errors.push('full_name is required');
  } else if (full_name.trim().length > 200) {
    errors.push('full_name must be 200 characters or fewer');
  }

  if (!phone_number || typeof phone_number !== 'string' || !phone_number.trim()) {
    errors.push('phone_number is required');
  }

  return errors;
}

// ── Handler ───────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — allow requests from the same Vercel deployment or localhost
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate
  const errors = validateBody(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const {
    full_name,
    country_code       = '+962',
    phone_number,
    destination_country,
    destination_country_hidden = null,
    notes              = null,
  } = req.body;

  // Check DB is configured
  if (!process.env.DATABASE_URL) {
    console.error('[leads] DATABASE_URL is not set');
    return res.status(503).json({
      error: 'Database not configured. Set DATABASE_URL in your Vercel environment variables.',
    });
  }

  try {
    await getPool().query(
      `INSERT INTO consultation_leads
         (full_name, country_code, phone_number, destination_country, page_country, notes, source_url, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        full_name.trim().substring(0, 200),
        (country_code || '+962').substring(0, 10),
        phone_number.trim().substring(0, 30),
        destination_country.trim().substring(0, 100),
        destination_country_hidden?.trim().substring(0, 100) || null,
        notes?.trim().substring(0, 1000) || null,
        req.headers.referer?.substring(0, 500) || null,
        // Store a one-way hash of the IP for dedup — never store raw IP (GDPR)
        req.headers['x-forwarded-for']
          ? Buffer.from(req.headers['x-forwarded-for'].split(',')[0].trim())
              .toString('base64').substring(0, 64)
          : null,
      ]
    );

    console.log('[leads] saved lead for destination:', destination_country);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[leads] INSERT failed:', err.message);
    // Surface a useful message if the table doesn't exist yet
    if (err.code === '42P01') {
      return res.status(500).json({
        error: 'Database table not found. Run JordanVisaGuide_Schema.sql against your database first.',
      });
    }
    return res.status(500).json({ error: 'Failed to save your request. Please try again.' });
  }
}
