import React from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

export function CheckoutCancel() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1) // Go back to previous page
  }

  const handleReturnHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-white" />
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-white mb-4 font-poppins">
            Payment Canceled
          </h1>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Your payment was canceled and no charges were made to your account. You can try again or return to browse our plans.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleGoBack}
              className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-black py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </Button>

            <Button
              onClick={handleReturnHome}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium border border-white/20 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Return to Home</span>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
            <p className="text-gray-300 text-sm">
              Need help? Contact our support team and we'll be happy to assist you with your purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}