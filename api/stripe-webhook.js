/**
 * POST /api/stripe-webhook
 *
 * Receives Stripe events and keeps the premium_subscribers table in sync.
 * Handles: checkout.session.completed, customer.subscription.deleted,
 *          customer.subscription.updated, invoice.payment_failed
 *
 * Required Vercel env vars:
 *   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET  — whsec_... (from Stripe Dashboard → Webhooks)
 *   DATABASE_URL           — already set
 *
 * Supabase table (run once):
 *   CREATE TABLE IF NOT EXISTS premium_subscribers (
 *     id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     email                  TEXT UNIQUE NOT NULL,
 *     stripe_customer_id     TEXT,
 *     stripe_subscription_id TEXT,
 *     status                 TEXT DEFAULT 'active',
 *     created_at             TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at             TIMESTAMPTZ DEFAULT NOW()
 *   );
 */

import Stripe from 'stripe';
import pkg from 'pg';
const { Pool } = pkg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

export const config = { api: { bodyParser: false } }; // Stripe needs raw body

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end',  ()    => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function upsertSubscriber(client, { email, customerId, subscriptionId, status }) {
  await client.query(`
    INSERT INTO premium_subscribers (email, stripe_customer_id, stripe_subscription_id, status, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (email) DO UPDATE
      SET stripe_customer_id     = EXCLUDED.stripe_customer_id,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          status                 = EXCLUDED.status,
          updated_at             = NOW()
  `, [email, customerId, subscriptionId, status]);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const client = await pool.connect();
  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        const email          = session.customer_details?.email || session.customer_email;
        const customerId     = session.customer;
        const subscriptionId = session.subscription;
        if (email) {
          await upsertSubscriber(client, { email, customerId, subscriptionId, status: 'active' });
          console.log('[stripe-webhook] new subscriber:', email);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub      = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const email    = customer.email;
        const status   = sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status;
        if (email) {
          await upsertSubscriber(client, { email, customerId: sub.customer, subscriptionId: sub.id, status });
          console.log('[stripe-webhook] subscription updated:', email, status);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub      = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const email    = customer.email;
        if (email) {
          await client.query(
            `UPDATE premium_subscribers SET status = 'canceled', updated_at = NOW() WHERE email = $1`,
            [email]
          );
          console.log('[stripe-webhook] subscription canceled:', email);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice  = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const email    = customer.email;
        if (email) {
          await client.query(
            `UPDATE premium_subscribers SET status = 'past_due', updated_at = NOW() WHERE email = $1`,
            [email]
          );
          console.log('[stripe-webhook] payment failed:', email);
        }
        break;
      }

      default:
        // Ignore other events
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] DB error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}
