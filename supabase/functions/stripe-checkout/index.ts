// supabase/functions/create-checkout/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'

/**
 * This function is purposely AUTH-LESS so users can verify BEFORE account creation.
 * It expects:
 *  - price_id: Stripe Price ID for the €1 verification
 *  - success_url: where to send the user after successful payment
 *  - cancel_url: where to send the user if they cancel
 *  - email: the email they plan to sign up with
 *  - user_type: 'job_seeker' | 'company' (optional but helpful metadata)
 */

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'TalentBook', version: '1.0.0' },
})

function cors(body: any, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  }
  if (status === 204) return new Response(null, { status, headers })
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

type StartVerificationPayload = {
  price_id: string
  success_url: string
  cancel_url: string
  email: string
  user_type?: 'job_seeker' | 'company'
}

Deno.serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') return cors({}, 204)

    if (req.method !== 'POST') {
      return cors({ error: 'Method not allowed' }, 405)
    }

    const { price_id, success_url, cancel_url, email, user_type } =
      (await req.json()) as StartVerificationPayload

    // Basic validation
    if (!price_id || typeof price_id !== 'string') {
      return cors({ error: 'Missing or invalid price_id' }, 400)
    }
    if (!success_url || typeof success_url !== 'string') {
      return cors({ error: 'Missing or invalid success_url' }, 400)
    }
    if (!cancel_url || typeof cancel_url !== 'string') {
      return cors({ error: 'Missing or invalid cancel_url' }, 400)
    }
    if (!email || typeof email !== 'string') {
      return cors({ error: 'Missing or invalid email' }, 400)
    }

    // Create a temporary Stripe customer – no Supabase user exists yet.
    const customer = await stripe.customers.create({
      email,
      metadata: {
        purpose: 'verification',
        pending_signup: 'true',
        userType: user_type ?? '',
      },
    })

    // Create a payment-mode Checkout Session for the €1 verification
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: {
        purpose: 'verification',
        email,
        userType: user_type ?? '',
      },
    })

    return cors({ sessionId: session.id, url: session.url })
  } catch (e: any) {
    console.error('create-checkout error:', e)
    return cors({ error: e?.message ?? 'Unknown error' }, 500)
  }
})
