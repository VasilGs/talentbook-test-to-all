import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Home, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import confetti from 'canvas-confetti'

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFC107', '#FFB300', '#dc2626', '#ef4444']
      })
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleContinue = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FFC107] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Processing your purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-white mb-4 font-poppins">
            Payment Successful!
          </h1>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Thank you for your purchase. Your payment has been processed successfully and your account has been updated.
          </p>

          {/* Session Info */}
          {sessionId && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
              <p className="text-gray-400 text-sm">
                Transaction ID: <span className="text-white font-mono">{sessionId.slice(-8)}</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleContinue}
              className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25 flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Return to Dashboard</span>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm">
              You will receive a confirmation email shortly. If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}