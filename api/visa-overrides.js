/**
 * GET  /api/visa-overrides        — returns all country overrides as JSON
 * POST /api/visa-overrides        — saves override for one country
 * DELETE /api/visa-overrides?country=Germany — removes override
 *
 * Table (run once in Supabase SQL editor):
 *   CREATE TABLE IF NOT EXISTS visa_overrides (
 *     country_name TEXT PRIMARY KEY,
 *     data         JSONB NOT NULL,
 *     updated_at   TIMESTAMPTZ DEFAULT NOW()
 *   );
 */

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Simple key check for write operations
  const adminKey = req.headers['x-admin-key'];
  if ((req.method === 'POST' || req.method === 'DELETE') && adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    // ── GET: return all overrides ───────────────────────────────────────────
    if (req.method === 'GET') {
      const { rows } = await client.query(
        'SELECT country_name, data FROM visa_overrides ORDER BY country_name'
      );
      const out = {};
      rows.forEach(r => { out[r.country_name] = r.data; });
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.status(200).json(out);
    }

    // ── POST: upsert one country ────────────────────────────────────────────
    if (req.method === 'POST') {
      const { country, data } = req.body;
      if (!country || !data) return res.status(400).json({ error: 'country and data required' });
      await client.query(`
        INSERT INTO visa_overrides (country_name, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (country_name) DO UPDATE
          SET data = $2, updated_at = NOW()
      `, [country, JSON.stringify(data)]);
      return res.status(200).json({ success: true });
    }

    // ── DELETE: remove override ─────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const country = req.query.country;
      if (!country) return res.status(400).json({ error: 'country param required' });
      await client.query('DELETE FROM visa_overrides WHERE country_name = $1', [country]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('visa-overrides error:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
