// supabase/functions/create-checkout/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!
const stripe = new Stripe(stripeSecret, {
  appInfo: { name: 'Bolt Integration', version: '1.0.0' },
})

// ---------- tiny helpers ----------
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  }
  if (status === 204) return new Response(null, { status, headers })
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

type ExpectedType = 'string' | { values: string[] }
type Expectations<T> = { [K in keyof T]: ExpectedType }
function validateParameters<T extends Record<string, any>>(values: T, expected: Expectations<T>) {
  for (const parameter in expected) {
    const expectation = expected[parameter]
    const value = values[parameter]
    if (expectation === 'string') {
      if (value == null) return `Missing required parameter ${parameter}`
      if (typeof value !== 'string') return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`
    } else {
      if (!expectation.values.includes(value))
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`
    }
  }
  return undefined
}

// ---------- handler ----------
Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return corsResponse({}, 204)
    if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405)

    const body = await req.json()

    // required for all
    const { price_id, success_url, cancel_url, mode, category } = body as {
      price_id: string
      success_url: string
      cancel_url: string
      mode: 'payment' | 'subscription'
      category: 'verification' | 'subscription' | string
    }

    const paramError = validateParameters(
      { price_id, success_url, cancel_url, mode, category },
      {
        price_id: 'string',
        success_url: 'string',
        cancel_url: 'string',
        mode: { values: ['payment', 'subscription'] },
        category: 'string',
      }
    )
    if (paramError) return corsResponse({ error: paramError }, 400)

    // optional context (works pre/post auth)
    const user_id: string | undefined = body.user_id // when you already created the Supabase user
    const user_type: 'job_seeker' | 'company' | undefined = body.user_type
    const email: string | undefined = body.email // use if pre-auth and you know the email
    const extra_meta: Record<string, string> | undefined = body.metadata

    let customerId: string | undefined
    let authUserId: string | undefined

    // ---- Verification flow: allow NO auth; we’ll pass strong metadata ----
    if (category === 'verification') {
      // If you already have a Supabase user, try to map to existing stripe customer
      if (user_id) {
        authUserId = user_id
        // Do we have a mapped customer already?
        const { data: existing, error } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user_id)
          .is('deleted_at', null)
          .maybeSingle()

        if (error) {
          console.error('Failed to query stripe_customers for verification:', error)
          // Not fatal: we’ll just create a customer below
        }
        if (existing?.customer_id) {
          customerId = existing.customer_id
        } else {
          const created = await stripe.customers.create({
            email: email,
            metadata: { userId: user_id, purpose: 'verification' },
          })
          customerId = created.id
          await supabase.from('stripe_customers').insert({
            user_id,
            customer_id: created.id,
          }).select().single().catch(() => {})
        }
      } else {
        // Pre-auth: create a temp customer; we’ll rely on session.metadata + webhook reconciliation
        const created = await stripe.customers.create({
          email, // best effort; Stripe will still collect if missing
          metadata: { pending_signup: 'true', purpose: 'verification' },
        })
        customerId = created.id
      }
    } else {
      // ---- Non-verification (subscriptions, etc.): require Authorization ----
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return corsResponse({ error: 'Authorization header required' }, 401)
      const token = authHeader.replace('Bearer ', '')
      const { data: auth, error: getUserError } = await supabase.auth.getUser(token)
      if (getUserError || !auth?.user) return corsResponse({ error: 'Failed to authenticate user' }, 401)
      authUserId = auth.user.id

      // find/create stripe customer mapping
      const { data: customerMap } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', authUserId)
        .is('deleted_at', null)
        .maybeSingle()

      if (customerMap?.customer_id) {
        customerId = customerMap.customer_id
      } else {
        const created = await stripe.customers.create({
          email: auth.user.email ?? undefined,
          metadata: { userId: authUserId },
        })
        customerId = created.id
        await supabase.from('stripe_customers').insert({
          user_id: authUserId,
          customer_id: created.id,
        })
      }

      // ensure a subscription row exists pre-checkout if needed
      if (mode === 'subscription') {
        const { data: sub } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle()
        if (!sub) {
          await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          })
        }
      }
    }

    // ---------- create checkout session ----------
    const session = await stripe.checkout.sessions.create({
      mode,                              // 'payment' for €1 verification
      customer: customerId,
      customer_email: customerId ? undefined : email, // pre-auth convenience
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url,
      cancel_url: cancel_url,
      // >>> IMPORTANT: pass robust metadata so the webhook can flip is_verified
      metadata: {
        purpose: 'verification',
        userId: user_id ?? authUserId ?? '',
        userType: user_type ?? '',
        category,
        ...(extra_meta ?? {}),
      },
    })

    console.log(`Created checkout session ${session.id} for customer ${customerId}`)
    return corsResponse({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return corsResponse({ error: error?.message ?? 'Unknown error' }, 500)
  }
})
