import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { StripeProduct } from '../stripe-config'

type UserType = 'job_seeker' | 'company'

interface StripeCheckoutProps {
  product: StripeProduct
  /** Optional overrides; if not provided and category==="verification", we read sessionStorage.pendingSignupData */
  emailOverride?: string
  userTypeOverride?: UserType
  /** Extra metadata merged into the payload (won’t overwrite reserved keys) */
  metadata?: Record<string, string | number | boolean>
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

/** Prefer a dedicated FUNCTIONS URL if present (VITE_SUPABASE_FUNCTIONS_URL), else fall back to <SUPABASE_URL>/functions/v1 */
function getFunctionsBase() {
  const f = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL?.toString().replace(/\/+$/, '')
  if (f) return f
  const u = import.meta.env.VITE_SUPABASE_URL?.toString().replace(/\/+$/, '')
  return `${u}/functions/v1`
}

export function StripeCheckout({
  product,
  emailOverride,
  userTypeOverride,
  metadata,
  onSuccess,
  onError,
  className,
  children,
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!product?.priceId || !product?.mode) {
      onError?.('Checkout not configured: missing price or mode.')
      return
    }

    setLoading(true)
    try {
      // 1) Auth is required for all products EXCEPT the verification fee
      let accessToken: string | undefined
      if (product.category !== 'verification') {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data?.session?.access_token) {
          throw new Error('Please log in to continue with checkout.')
        }
        accessToken = data.session.access_token
      }

      // 2) Build URLs
      const origin = window.location.origin
      const successUrl =
        product.category === 'verification'
          ? `${origin}/checkout/verify-success?session_id={CHECKOUT_SESSION_ID}`
          : `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/checkout/cancel`

      // 3) For verification, we must pass email + user_type + purpose=verification
      let verificationEmail: string | undefined
      let verificationUserType: UserType | undefined

      if (product.category === 'verification') {
        // Prefer explicit overrides
        verificationEmail = (emailOverride || '').trim().toLowerCase()
        verificationUserType = userTypeOverride

        // If not provided, use the saved pending signup data
        if (!verificationEmail || !verificationUserType) {
          try {
            const raw = sessionStorage.getItem('pendingSignupData')
            if (raw) {
              const parsed = JSON.parse(raw) as {
                email?: string
                userType?: UserType
              }
              verificationEmail = verificationEmail || parsed?.email?.toLowerCase()
              verificationUserType = verificationUserType || parsed?.userType
            }
          } catch {
            // ignore parse errors; we’ll validate below
          }
        }

        if (!verificationEmail || !verificationUserType) {
          throw new Error('We could not find your signup info. Please fill out the signup form again.')
        }
      }

      // 4) Compose payload for the Edge Function
      // Reserved metadata keys: purpose, email, userType — your function should treat them as top-level too
      const payload: Record<string, any> = {
        price_id: product.priceId,       // IMPORTANT: this must be a PRICE, not a PRODUCT
        mode: product.mode,              // 'payment' | 'subscription'
        category: product.category,      // 'verification' | 'plan' | etc.
        success_url: successUrl,
        cancel_url: cancelUrl,
      }

      if (product.category === 'verification') {
        payload.email = verificationEmail
        payload.user_type = verificationUserType
        payload.metadata = {
          purpose: 'verification',
          email: verificationEmail,
          userType: verificationUserType,
          ...(metadata ?? {}),
        }
      } else if (metadata) {
        payload.metadata = { ...(metadata ?? {}) }
      }

      // 5) Call the function
      const resp = await fetch(`${getFunctionsBase()}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      let data: any = null
      try {
        data = await resp.json()
      } catch {
        // non-JSON error
      }

      if (!resp.ok) {
        const msg = data?.error || `Failed to create checkout session (${resp.status})`
        throw new Error(msg)
      }

      const url = data?.url
      if (!url) throw new Error('No checkout URL received from server.')

      // 6) Redirect to Stripe Checkout
      window.location.href = url
      onSuccess?.()
    } catch (err: any) {
      console.error('Checkout error:', err)
      onError?.(err?.message || 'An error occurred during checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={loading} className={className}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span>Processing…</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children ?? <span>Purchase</span>}
        </>
      )}
    </Button>
  )
}
