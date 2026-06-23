/**
 * POST /api/unlock-premium
 * Body: { code: "ABC123" }
 *
 * Verifies a one-time or recurring unlock code set via the PREMIUM_CODE env var.
 * Admin sets PREMIUM_CODE in Vercel env vars and sends it to users via WhatsApp.
 *
 * Returns { valid: true } or { valid: false }
 *
 * Required Vercel env var:
 *   PREMIUM_CODE — the secret code you share with paying users (e.g. "VISA2024")
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'code required' });
  }

  const secret = process.env.PREMIUM_CODE;
  if (!secret) {
    console.error('[unlock-premium] PREMIUM_CODE env var not set');
    return res.status(500).json({ valid: false, error: 'server misconfigured' });
  }

  const valid = code.trim().toUpperCase() === secret.trim().toUpperCase();
  return res.status(200).json({ valid });
}
