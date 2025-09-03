import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

function cors(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors({})
  try {
    const { session_id } = await req.json()
    if (!session_id) return cors({ error: 'Missing session_id' }, 400)

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'customer'],
    })

    if (session.payment_status !== 'paid' || session.mode !== 'payment') {
      return cors({ ok: false, reason: 'Not paid' }, 400)
    }

    // Pull email from metadata or customer_details as a fallback
    const metaEmail = (session.metadata?.email || session.customer_details?.email || '').toLowerCase()
    return cors({
      ok: true,
      email: metaEmail,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    })
  } catch (e: any) {
    console.error('verify-session error', e)
    return cors({ error: e?.message ?? 'Unknown error' }, 500)
  }
})
