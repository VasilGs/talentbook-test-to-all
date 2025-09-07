import React, { useState } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { StripeCheckout } from './StripeCheckout'
import { 
  Zap, 
  Star, 
  Crown, 
  Diamond, 
  Mail, 
  Users, 
  Trophy, 
  Shield,
  Check,
  Sparkles,
  Target,
  Globe,
  Lock
} from 'lucide-react'
import { stripeProducts, getProductsByCategory, formatPrice } from '../stripe-config'

interface AddOnsModalProps {
  isOpen: boolean
  onClose: () => void
}


export function AddOnsModal({ isOpen, onClose }: AddOnsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'promotion' | 'outreach' | 'enterprise'>('promotion')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Get add-ons from Stripe config
  const getAddOnsForCategory = (category: 'promotion' | 'outreach' | 'enterprise') => {
    return getProductsByCategory(category).map(product => ({
      ...product,
      icon: getIconForProduct(product.name),
      features: getFeaturesForProduct(product.name)
    }))
  }

  const getIconForProduct = (name: string) => {
    if (name.includes('Silver')) return <Star className="w-6 h-6" />
    if (name.includes('Gold')) return <Crown className="w-6 h-6" />
    if (name.includes('Diamond')) return <Diamond className="w-6 h-6" />
    if (name.includes('Platinum')) return <Sparkles className="w-6 h-6" />
    if (name.includes('Annual')) return <Target className="w-6 h-6" />
    if (name.includes('InMails')) return <Mail className="w-6 h-6" />
    if (name.includes('Unlimited')) return <Users className="w-6 h-6" />
    if (name.includes('Leaderboard')) return <Trophy className="w-6 h-6" />
    if (name.includes('Enterprise Connect')) return <Shield className="w-6 h-6" />
    return <Zap className="w-6 h-6" />
  }

  const getFeaturesForProduct = (name: string): string[] => {
    // Define features based on product name
    if (name.includes('Silver')) {
      return [
        'Enhanced job post visibility',
        'Priority placement in search results',
        'Applies to all job posts in account',
        'Monthly billing'
      ]
    }
    if (name.includes('Gold')) {
      return [
        'All Silver features',
        'Featured job post badges',
        'Higher search ranking',
        'Enhanced company branding'
      ]
    }
    if (name.includes('Diamond')) {
      return [
        'All Gold features',
        'Top-tier placement guarantee',
        'Premium company spotlight',
        'Advanced analytics dashboard'
      ]
    }
    if (name.includes('Platinum')) {
      return [
        'All Diamond features',
        'Exclusive placement zones',
        'Dedicated account manager',
        'Custom branding options'
      ]
    }
    if (name.includes('Annual')) {
      return [
        'Equivalent to Gold level monthly',
        'Significant cost savings',
        'Consistent year-round promotion',
        'Priority customer support'
      ]
    }
    if (name.includes('InMails 200')) {
      return [
        '200 InMail messages per month',
        'Direct candidate outreach',
        'Cap: 50 messages per day per seat',
        'Message templates included'
      ]
    }
    if (name.includes('InMails 500')) {
      return [
        '500 InMail messages per month',
        'Advanced candidate targeting',
        'Cap: 50 messages per day per seat',
        'Priority message delivery',
        'Advanced analytics'
      ]
    }
    if (name.includes('Unlimited')) {
      return [
        'Unlimited connection requests',
        'Cap: 50 invites per day per seat',
        'Fair-use protections included',
        'Network expansion tools',
        'Connection analytics'
      ]
    }
    if (name.includes('Leaderboard')) {
      return [
        'Featured in Top 100 Brand Leaderboard',
        'Premium brand positioning',
        'Enhanced company visibility',
        'Exclusive networking opportunities',
        'Quarterly brand reports'
      ]
    }
    if (name.includes('Enterprise Connect')) {
      return [
        'Double opt-in Contact Reveal',
        'GDPR-compliant contact access',
        'Dedicated support team',
        'Priority campaign management',
        'Advanced compliance tools'
      ]
    }
    return ['Premium features included']
  }

  const categories = [
    { id: 'promotion', name: 'Promotion', icon: <Zap className="w-5 h-5" /> },
    { id: 'outreach', name: 'Outreach', icon: <Mail className="w-5 h-5" /> },
    { id: 'enterprise', name: 'Enterprise', icon: <Globe className="w-5 h-5" /> }
  ] as const

  const filteredAddOns = getAddOnsForCategory(selectedCategory)

  const getAddOnCardStyle = (addon: any) => {
    if (addon.premium) {
      return 'bg-gradient-to-br from-purple-600/20 to-purple-700/10 border-purple-500/40 hover:border-purple-400/60'
    }
    if (addon.popular) {
      return 'bg-gradient-to-br from-[#FFC107]/20 to-[#FFB300]/10 border-[#FFC107]/40 hover:border-[#FFC107]/60'
    }
    return 'bg-white/5 border-white/10 hover:border-white/30'
  }

  const getIconStyle = (addon: any) => {
    if (addon.premium) {
      return 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
    }
    if (addon.popular) {
      return 'bg-gradient-to-br from-[#FFC107] to-[#FFB300] text-black'
    }
    return 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
  }

  const getBadge = (addon: any) => {
    if (addon.premium) {
      return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Crown className="w-3 h-3" />
          <span>PREMIUM</span>
        </div>
      )
    }
    if (addon.popular) {
      return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FFC107] to-[#FFB300] text-black px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Star className="w-3 h-3" />
          <span>POPULAR</span>
        </div>
      )
    }
    return null
  }

  const handleCheckoutError = (error: string) => {
    setCheckoutError(error)
    setTimeout(() => setCheckoutError(null), 5000) // Clear error after 5 seconds
  }
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className="bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 border border-white/20 max-w-6xl max-h-[90vh] overflow-y-auto"
    >
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FFC107] to-[#FFB300] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
            Premium Add-ons
          </h1>
          <p className="text-gray-300">
            Enhance your recruiting capabilities with our premium features
          </p>
        </div>

        {/* Error Message */}
        {checkoutError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{checkoutError}</p>
          </div>
        )}
        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10 flex items-center space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/25'
                    : 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add-ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddOns.map((addon) => (
            <div 
              key={addon.id}
              className={`relative backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${getAddOnCardStyle(addon)}`}
            >
              {getBadge(addon)}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${getIconStyle(addon)}`}>
                {addon.icon}
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {addon.name}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {addon.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-white">
                    {formatPrice(addon.price, addon.currency)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {addon.mode === 'subscription' ? '/ month' : 'one-time'}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {addon.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <StripeCheckout
                  product={addon}
                  onError={handleCheckoutError}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                    addon.premium
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                      : addon.popular
                      ? 'bg-[#FFC107] hover:bg-[#FFB300] text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {addon.premium ? 'Contact Sales' : 'Purchase'}
                </StripeCheckout>
              </div>
            </div>
          ))}
        </div>

        {/* Special Notes */}
        <div className="mt-8 space-y-4">
          {selectedCategory === 'outreach' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-2">Fair-Use Protections</h4>
                  <p className="text-blue-300 text-sm">
                    All outreach features include built-in fair-use protections to ensure compliance with platform guidelines and maintain a positive user experience for all members.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedCategory === 'enterprise' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-semibold mb-2">Enterprise Features</h4>
                  <p className="text-purple-300 text-sm">
                    Enterprise add-ons include dedicated support, priority processing, and advanced compliance features. Contact our sales team for custom enterprise solutions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Need a custom solution? Our enterprise team can create a tailored package for your specific needs.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium border border-white/20">
              Contact Sales
            </Button>
            <Button 
              onClick={onClose}
              className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-2 rounded-lg font-medium"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}