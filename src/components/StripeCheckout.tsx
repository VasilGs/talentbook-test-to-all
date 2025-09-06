import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StripeProduct } from '../stripe-config'

interface StripeCheckoutProps {
  product: StripeProduct
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export function StripeCheckout({ 
  product, 
  onSuccess, 
  onError, 
  className,
  children 
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    
    try {
      // Get the current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Please log in to continue with checkout')
      }

      // Create checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/checkout/cancel`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }

      onSuccess?.()
    } catch (error: any) {
      console.error('Checkout error:', error)
      onError?.(error.message || 'An error occurred during checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span>Processing...</span>
        </>
      ) : children ? (
        children
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          <span>Purchase</span>
        </>
      )}
    </Button>
  )
}