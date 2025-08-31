import React, { useState, useEffect } from 'react'
import { Crown, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getProductByPriceId, formatPrice } from '../stripe-config'

interface SubscriptionData {
  subscription_status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

interface SubscriptionStatusProps {
  className?: string
}

export function SubscriptionStatus({ className }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error) {
        throw error
      }

      setSubscription(data)
    } catch (err: any) {
      console.error('Error fetching subscription status:', err)
      setError(err.message || 'Failed to load subscription status')
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionLabel = (status: string, priceId: string | null) => {
    if (!priceId) return 'Free Plan'
    
    const product = getProductByPriceId(priceId)
    if (product) {
      return product.name
    }
    
    // Fallback based on status
    switch (status) {
      case 'active':
        return 'Premium Plan'
      case 'trialing':
        return 'Trial Plan'
      case 'past_due':
        return 'Payment Required'
      case 'canceled':
        return 'Canceled Plan'
      default:
        return 'Free Plan'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'from-green-600 to-green-700'
      case 'trialing':
        return 'from-blue-600 to-blue-700'
      case 'past_due':
        return 'from-yellow-600 to-yellow-700'
      case 'canceled':
        return 'from-red-600 to-red-700'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-gray-400 text-sm">Loading plan...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-red-400 text-sm">Failed to load plan</span>
      </div>
    )
  }

  const status = subscription?.subscription_status || 'not_started'
  const isActive = status === 'active' || status === 'trialing'

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`bg-gradient-to-r ${getStatusColor(status)} px-3 py-1 rounded-full flex items-center space-x-2`}>
        <Crown className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">
          {getSubscriptionLabel(status, subscription?.price_id || null)}
        </span>
      </div>
      
      {subscription?.current_period_end && isActive && (
        <span className="text-gray-400 text-xs">
          Until {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
        </span>
      )}
    </div>
  )
}