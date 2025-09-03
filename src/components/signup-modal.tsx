import React, { useState } from 'react'
import { Modal } from './ui/modal'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { User, Mail, Lock, Briefcase, Building2 } from 'lucide-react'

interface SignupData {
  name: string
  email: string
  password: string
  userType: 'job_seeker' | 'company'
}

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
  onContinueSignup: (signupData: SignupData) => void
  onOpenPrivacyTerms: () => void
}

export function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onContinueSignup,
  onOpenPrivacyTerms,
}: SignupModalProps) {
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    userType: 'job_seeker',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof SignupData, value: string | 'job_seeker' | 'company') => {
    setFormData(prev => ({ ...prev, [field]: value as any }))
  }

  const handleSwitchToLogin = () => {
    onClose()
    onSwitchToLogin()
  }

  const handleUserTypeChange = (type: 'job_seeker' | 'company') => {
    setFormData(prev => ({ ...prev, userType: type }))
  }

  const handleVerificationCheckout = async () => {
    try {
      setError(null)

      // Basic guard
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        setError('Please fill your name, email and password.')
        return
      }

      setLoading(true)

      // Save the signup data so we can complete account creation on success page
      sessionStorage.setItem('pendingSignupData', JSON.stringify(formData))

      const base =
        import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

      const priceId = import.meta.env.VITE_STRIPE_PRICE_VERIFICATION
      if (!priceId) {
        throw new Error('Missing VITE_STRIPE_PRICE_VERIFICATION env var')
      }

      const res = await fetch(`${base}/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Unauthenticated verification flow
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/checkout/success?type=verification`,
          cancel_url: `${window.location.origin}/checkout/cancel?type=verification`,
          mode: 'payment',
          category: 'verification',
          // helpful metadata for your webhook
          email: formData.email,
          user_type: formData.userType,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.assign(data.url)
    } catch (err: any) {
      console.error('Checkout error:', err)
      setLoading(false)
      setError(err?.message || 'Failed to start verification checkout')
      // Clean up the saved data if creation didn’t start
      sessionStorage.removeItem('pendingSignupData')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      className="bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 border border-white/20"
    >
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img
              src="/talent book singular icon.png"
              alt="TalentBook Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-poppins">Join TalentBook</h2>
          <p className="text-gray-300">Verify your account with a €1 one-time check</p>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Form (no submit; we trigger Stripe directly) */}
        <div className="space-y-6">
          {/* User Type Selection */}
          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-3">I am looking to:</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUserTypeChange('job_seeker')}
                disabled={loading}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${
                  formData.userType === 'job_seeker'
                    ? 'border-[#FFC107] bg-[#FFC107]/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                      formData.userType === 'job_seeker'
                        ? 'bg-[#FFC107] text-black'
                        : 'bg-white/10 text-gray-400 group-hover:text-white'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      formData.userType === 'job_seeker' ? 'text-[#FFC107]' : 'text-gray-300 group-hover:text-white'
                    }`}
                  >
                    Find a Job
                  </span>
                </div>
                {formData.userType === 'job_seeker' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFC107] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleUserTypeChange('company')}
                disabled={loading}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 group ${
                  formData.userType === 'company'
                    ? 'border-[#FFC107] bg-[#FFC107]/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                      formData.userType === 'company'
                        ? 'bg-[#FFC107] text-black'
                        : 'bg-white/10 text-gray-400 group-hover:text-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      formData.userType === 'company' ? 'text-[#FFC107]' : 'text-gray-300 group-hover:text-white'
                    }`}
                  >
                    Hire Talent
                  </span>
                </div>
                {formData.userType === 'company' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFC107] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Create a secure password"
              />
            </div>
          </div>

          {/* Pay & Verify */}
          <Button
            type="button"
            onClick={handleVerificationCheckout}
            disabled={loading}
            className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25"
          >
            {loading ? 'Starting Checkout…' : 'Pay €1.00 to Verify & Create Account'}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <button
              onClick={handleSwitchToLogin}
              disabled={loading}
              className="text-[#FFC107] hover:text-[#FFB300] font-medium transition-colors duration-200"
            >
              Log in instead
            </button>
          </p>
        </div>

        {/* Terms */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onOpenPrivacyTerms()
              }}
              className="text-[#FFC107] hover:text-[#FFB300] transition-colors duration-200 underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onOpenPrivacyTerms()
              }}
              className="text-[#FFC107] hover:text-[#FFB300] transition-colors duration-200 underline"
            >
              Privacy Policy
            </button>
            <br />
            <span className="text-gray-400">
              A €1.00 verification fee is required to create your account and unlock all features.
            </span>
          </p>
        </div>
      </div>
    </Modal>
  )
}
