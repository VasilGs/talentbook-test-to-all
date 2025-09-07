// supabase/functions/create-checkout/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'

/**
 * Auth-less Stripe Checkout creator.
 * Accepts:
 *  - price_id:   REQUIRED (Stripe Price ID, not Product ID)
 *  - success_url: REQUIRED
 *  - cancel_url:  REQUIRED
 *  - mode:       OPTIONAL ('payment' | 'subscription') default 'payment'
 *  - category:   OPTIONAL ('verification' | 'plan' | ...)
 *  - email:      REQUIRED when category === 'verification'
 *  - user_type:  OPTIONAL ('job_seeker' | 'company')
 *  - metadata:   OPTIONAL (Record<string, string|number|boolean>)
 *
 * For verification, we tag metadata.purpose='verification' and pass customer_email.
 */

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  appInfo: { name: 'TalentBook', version: '1.0.0' },
})

function cors(body: unknown, status = 200) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  }
  if (status === 204) return new Response(null, { status, headers })
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
}

type Payload = {
  price_id?: string
  success_url?: string
  cancel_url?: string
  mode?: 'payment' | 'subscription'
  category?: string
  email?: string
  user_type?: 'job_seeker' | 'company'
  metadata?: Record<string, string | number | boolean>
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return cors({}, 204)
  if (req.method !== 'POST') return cors({ error: 'Method not allowed' }, 405)

  try {
    let json: Payload | null = null
    try {
      json = (await req.json()) as Payload
    } catch {
      return cors({ error: 'Invalid JSON body' }, 400)
    }

    const {
      price_id,
      success_url,
      cancel_url,
      mode = 'payment',
      category,
      email,
      user_type,
      metadata,
    } = json ?? {}

    // --- Validation ---
    if (!price_id || typeof price_id !== 'string') return cors({ error: 'Missing or invalid price_id' }, 400)
    if (!success_url || typeof success_url !== 'string') return cors({ error: 'Missing or invalid success_url' }, 400)
    if (!cancel_url || typeof cancel_url !== 'string') return cors({ error: 'Missing or invalid cancel_url' }, 400)
    if (mode !== 'payment' && mode !== 'subscription') return cors({ error: 'Invalid mode' }, 400)

    const isVerification = category === 'verification'
    const normalizedEmail = (email || '').toLowerCase().trim()

    if (isVerification && !normalizedEmail) {
      return cors({ error: 'Email is required for verification checkout' }, 400)
    }

    // --- Build metadata (reserve keys won't be overwritten by caller) ---
    const meta: Record<string, string | number | boolean> = {
      ...(metadata ?? {}),
      ...(isVerification
        ? { purpose: 'verification', email: normalizedEmail, userType: user_type ?? '' }
        : {}),
    }

    // --- Create Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url,
      cancel_url,
      ...(isVerification ? { customer_email: normalizedEmail } : {}),
      metadata: meta,
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      // You can add: automatic_tax, shipping_address_collection, etc. if needed
    })

    if (!session?.url) {
      return cors({ error: 'Failed to create checkout session URL' }, 500)
    }

    return cors({ sessionId: session.id, url: session.url })
  } catch (e: any) {
    console.error('create-checkout error:', e)
    return cors({ error: e?.message ?? 'Unknown error' }, 500)
  }
})
