/**
 * POST /api/check-premium
 * Body: { email: "user@example.com" }
 *
 * Returns { premium: true } if email has an active subscription,
 * { premium: false } otherwise.
 *
 * The client stores a simple localStorage flag — no JWT needed since
 * the checklist is client-side only and premium content isn't sensitive
 * enough to require server-side enforcement on every request.
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email required' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT status FROM premium_subscribers WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    const active = rows.length > 0 && rows[0].status === 'active';
    return res.status(200).json({ premium: active });
  } catch (err) {
    console.error('[check-premium]', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
