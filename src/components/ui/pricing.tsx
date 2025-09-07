"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StripeCheckout } from "../StripeCheckout";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Check, Star } from "lucide-react";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { Briefcase, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripeProducts, getProductsByCategory, formatPrice } from "../../stripe-config";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  userType: 'job_seeker' | 'employer';
}

interface PricingProps {
  plans?: PricingPlan[];
  title?: string;
  description?: string;
  onViewAddOns?: () => void;
}

export function Pricing({
  plans = [],
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
  onViewAddOns,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const [selectedUserType, setSelectedUserType] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "#dc2626",
          "#f59e0b",
          "#ef4444",
          "#fbbf24",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  // Get subscription plans from Stripe config
  const subscriptionPlans = getProductsByCategory('subscription').filter(product => {
    // Filter by user type based on product name
    if (selectedUserType === 'job_seeker') {
      return product.name.includes('Candidates')
    } else {
      return product.name.includes('Employer')
    }
  })

  const handleCheckoutError = (error: string) => {
    setCheckoutError(error)
    setTimeout(() => setCheckoutError(null), 5000)
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-poppins">
          {title}
        </h2>
        <p className="text-gray-300 text-lg whitespace-pre-line max-w-3xl mx-auto">
          {description}
        </p>
        
        {/* User Type Selection */}
        <div className="flex justify-center mt-8 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10 flex items-center space-x-2">
            <button
              onClick={() => setSelectedUserType('job_seeker')}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedUserType === 'job_seeker'
                  ? 'bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/25'
                  : 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>For Job Seekers</span>
            </button>
            <button
              onClick={() => setSelectedUserType('employer')}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedUserType === 'employer'
                  ? 'bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/25'
                  : 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>For Employers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {checkoutError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm text-center">{checkoutError}</p>
          </div>
        </div>
      )}
      <div className="flex justify-center items-center mb-10 space-x-4">
        <span className="text-white font-medium">Monthly</span>
        <Label>
          <Switch
            ref={switchRef as any}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
            className="relative"
          />
        </Label>
        <span className="text-white font-medium">
          Annual <span className="text-red-400">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {subscriptionPlans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: subscriptionPlans.length === 3 ? (index === 2 ? -30 : index === 0 ? 30 : 0) : 0,
                    scale: subscriptionPlans.length === 3 && (index === 0 || index === 2) ? 0.94 : 1.0,
                  }
                : { y: 0, opacity: 1 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              `rounded-2xl border p-8 bg-white/5 backdrop-blur-sm text-center lg:flex lg:flex-col lg:justify-center relative`,
              plan.popular ? "border-[#FFC107] border-2" : "border-white/20",
              "flex flex-col",
              !plan.popular && "mt-5",
              subscriptionPlans.length === 3 && (index === 0 || index === 2)
                ? "z-0 transform translate-x-0 translate-y-0"
                : "z-10",
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#FFC107] py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center">
                <Star className="text-white h-4 w-4 fill-current" />
                <span className="text-black ml-1 font-sans font-semibold text-sm">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-gray-300 uppercase tracking-wide">
                {plan.name}
              </p>
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-white">
                  <NumberFlow
                    value={
                      isMonthly ? plan.price / 100 : (plan.price * 12 * 0.8) / 100
                    }
                    format={{
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    formatter={(value) => `€${value}`}
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                    className="font-variant-numeric: tabular-nums"
                  />
                </span>
                {plan.mode === 'subscription' && (
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-400">
                    / month
                  </span>
                )}
              </div>

              <p className="text-xs leading-5 text-gray-400 mb-6">
                {isMonthly ? "billed monthly" : "billed annually"}
              </p>

              <ul className="mt-5 gap-3 flex flex-col">
                {plan.description.split('.').filter(f => f.trim()).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-left text-gray-300">{feature.trim()}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-6 border-white/20" />

              <StripeCheckout
                product={plan}
                onError={handleCheckoutError}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-[#FFC107] hover:ring-offset-1",
                  plan.popular
                    ? "bg-[#FFC107] text-black border-[#FFC107] hover:bg-[#FFB300]"
                    : "bg-transparent text-white border-white/30 hover:bg-[#FFC107] hover:text-black hover:border-[#FFC107]"
                )}
              >
                Get Started
              </StripeCheckout>
              <p className="mt-4 text-xs leading-5 text-gray-400">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New button for Add-ons */}
      {onViewAddOns && (
        <div className="mt-12 text-center">
          <Button
            onClick={onViewAddOns}
            className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25 text-lg flex items-center justify-center mx-auto space-x-3"
          >
            <Zap className="w-6 h-6" />
            <span>Explore Premium Add-ons</span>
          </Button>
        </div>
      )}

    </div>
  );
}