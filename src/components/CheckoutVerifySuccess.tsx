import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react'
import { Button } from './ui/button'
import { supabase } from '../lib/supabase'

interface SignupData {
  name: string
  email: string
  password: string
  userType: 'job_seeker' | 'company'
}

export function CheckoutVerifySuccess() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [signupStatus, setSignupStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processAccountCreation = async () => {
      try {
        // Retrieve pending signup data from sessionStorage
        const pendingDataStr = sessionStorage.getItem('pendingSignupData')
        
        if (!pendingDataStr) {
          setError('No pending signup data found. Please try signing up again.')
          setSignupStatus('error')
          setLoading(false)
          return
        }

        const signupData: SignupData = JSON.parse(pendingDataStr)

        // Create the user account now that payment is verified
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: signupData.email,
          password: signupData.password,
          options: {
            data: {
              full_name: signupData.name,
              user_type: signupData.userType,
              verified: true // Mark as verified since they paid
            }
          }
        })

        if (authError) {
          throw new Error(`Account creation failed: ${authError.message}`)
        }

        if (!authData.user) {
          throw new Error('Account creation failed: No user returned')
        }

        // Clear the pending signup data
        sessionStorage.removeItem('pendingSignupData')
        
        // Set success status
        setSignupStatus('success')
        
        // Redirect to appropriate profile completion page after a short delay
        setTimeout(() => {
          if (signupData.userType === 'job_seeker') {
            navigate('/complete-profile-job-seeker')
          } else {
            navigate('/complete-profile-company')
          }
        }, 2000)

      } catch (err: any) {
        console.error('Account creation error:', err)
        setError(err.message || 'Failed to create account after payment verification')
        setSignupStatus('error')
        // Clear the pending signup data on error
        sessionStorage.removeItem('pendingSignupData')
      } finally {
        setLoading(false)
      }
    }

    processAccountCreation()
  }, [navigate])

  const handleReturnHome = () => {
    // Clear any remaining data and go home
    sessionStorage.removeItem('pendingSignupData')
    navigate('/')
  }

  const handleTryAgain = () => {
    // Clear data and redirect to signup
    sessionStorage.removeItem('pendingSignupData')
    navigate('/')
  }

  if (loading || signupStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <Loader2 className="w-16 h-16 text-[#FFC107] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4 font-poppins">
              Creating Your Account
            </h1>
            <p className="text-gray-300 leading-relaxed">
              Payment verified! We're setting up your TalentBook account now...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (signupStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4 font-poppins">
              Account Creation Failed
            </h1>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {error || 'An error occurred while creating your account after payment verification.'}
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleTryAgain}
                className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25"
              >
                Try Again
              </Button>
              <Button
                onClick={handleReturnHome}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium border border-white/20"
              >
                Return to Home
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                If you continue to experience issues, please contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state (briefly shown before redirect)
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 font-poppins">
            Account Created Successfully!
          </h1>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Your payment has been verified and your TalentBook account is ready. Redirecting you to complete your profile...
          </p>

          <div className="flex items-center justify-center space-x-2 text-[#FFC107]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    </div>
  )
}