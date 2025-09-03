// supabase/functions/stripe-webhook/index.ts
// Deno Edge Function: verifies Stripe signatures, handles key events, writes to DB

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'

/** Util: JSON/CORS reply */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

/** Create a service-role client for writes */
function sbClient() {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return new (globalThis as any).SupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, stripe-signature',
      },
    })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // 1) Read raw body for signature verification
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed.', err?.message)
    return json({ error: 'Invalid signature' }, 400)
  }

  // 2) Idempotency guard: store event id, ignore duplicates
  const supabase = sbClient()
  try {
    const { error: insertEvtError } = await supabase
      .from('stripe_events')
      .insert({
        id: event.id,            // PK
        type: event.type,
        created: new Date(event.created * 1000).toISOString(),
        raw: event,              // JSON for later debugging
      })
    if (insertEvtError) {
      if (insertEvtError.code === '23505') {
        // duplicate (we already processed this event)
        return json({ ok: true, duplicate: true })
      }
      throw insertEvtError
    }
  } catch (e) {
    console.error('event insert error', e)
    return json({ error: 'DB error (event)' }, 500)
  }

  // 3) Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only handle fully paid sessions (should be true for Checkout)
        // Payment intents can be expanded/also handled in payment_intent.succeeded
        const amount_total = session.amount_total ?? 0
        const currency = session.currency ?? 'eur'
        const metadata = session.metadata || {}
        const purpose = (metadata.purpose || '').toString()
        const email =
          (metadata.email ||
            session.customer_details?.email ||
            session.customer_email ||
            ''
          ).toString().toLowerCase()

        // A few defensive checks for your €1 verification flow:
        const isVerification = purpose === 'verification'
        const isOneEuro = amount_total === 100 && currency === 'eur'

        // Persist a normalized order row
        const { error: orderErr } = await supabase.from('stripe_orders').insert({
          session_id: session.id,
          payment_intent_id: (session.payment_intent as string) ?? null,
          customer_id: (typeof session.customer === 'string' ? session.customer : session.customer?.id) ?? null,
          email,
          amount_total,
          currency,
          status: session.payment_status, // 'paid'
          purpose,
          user_type: metadata.userType || null,
          raw: session,
        })
        if (orderErr) throw orderErr

        // If this was a verification payment, mark email as verified (pre-signup) for later use
        if (isVerification && isOneEuro && email) {
          // upsert means: create or update if exists
          const { error: verErr } = await supabase
            .from('verification_emails')
            .upsert({
              email,
              is_verified: true,
              verified_at: new Date().toISOString(),
              last_session_id: session.id,
            }, { onConflict: 'email' })
          if (verErr) throw verErr
        }

        break
      }

      case 'payment_intent.succeeded': {
        // Optional: additional accounting hooks, logs, etc.
        break
      }

      case 'charge.succeeded': {
        // Optional: fine-grained charge data if you need it
        break
      }

      default:
        // Keep for observability; you already store the raw event above
        break
    }

    return json({ ok: true })
  } catch (err) {
    console.error('handler error', err)
    return json({ error: 'Webhook handler failure' }, 500)
  }
})
