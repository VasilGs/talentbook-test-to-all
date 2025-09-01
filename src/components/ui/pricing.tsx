"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StripeCheckout } from "../StripeCheckout";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Check, Star } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { Briefcase, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

type Billing = "free" | "monthly" | "yearly" | "both";

type LocalPlan = {
  key: string;
  name: string;
  popular?: boolean;
  billing: Billing;
  monthlyPrice?: number; // in EUR
  yearlyPrice?: number;  // in EUR
  description?: string;  // short copy under price
  features: string[];
  // Optional Stripe wiring; if omitted, we'll show a "Get Started" button
  priceIdMonthly?: string;
  priceIdYearly?: string;
};

interface PricingProps {
  title?: string;
  description?: string;
  user?: User | null;
  openSignup?: () => void;
  onViewAddOns?: () => void;
}

export function Pricing({
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform and support.",
  user,
  openSignup,
  onViewAddOns,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const [selectedUserType, setSelectedUserType] =
    useState<"job_seeker" | "employer">("job_seeker");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleToggle = (checked: boolean) => {
    // checked === Annual
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#dc2626", "#f59e0b", "#ef4444", "#fbbf24"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  /* ------------------------ Data ------------------------ */
  const candidatePlans: LocalPlan[] = useMemo(
    () => [
      {
        key: "cand-basic",
        name: "Basic",
        billing: "free",
        monthlyPrice: 0,
        description: "forever free",
        features: [
          "View and apply to all job posts",
          "Saved searches + email/push notifications",
          "Public profile/portfolio",
        ],
      },
      {
        key: "cand-pro",
        name: "Pro",
        popular: true,
        billing: "both",
        monthlyPrice: 12,
        yearlyPrice: 99,
        description:
          "Advanced visibility & tools. Includes boosts, filters, and employer messaging.",
        features: [
          "Profile boost (higher in searches): up to 5 boosts/month",
          "Top of the stack in applications: 3 priority highlights/week",
          "Advanced filters (salary, remote, tech stack, etc.)",
          "“Who viewed me” + read receipts on messages",
          "Up to 20 direct messages (InMails) to employers/month (cap: 10/day)",
          "CV/cover letter templates + AI suggestions for optimization",
          "Add-on (optional): Spotlight Boost — €4.99 / 48h extra visibility",
        ],
        // priceIdMonthly: "price_xxx",
        // priceIdYearly: "price_yyy",
      },
    ],
    []
  );

  const employerPlans: LocalPlan[] = useMemo(
    () => [
      {
        key: "emp-starter",
        name: "Starter",
        billing: "monthly",
        monthlyPrice: 600,
        description: "Great for small teams starting to hire.",
        features: [
          "3 active job posts simultaneously",
          "1 recruiter seat",
          "Candidate search: up to 50 profiles/month (full profile view)",
          "Contact invites: 200/month (cap: 50/day/seat)",
          "Support: email, SLA 48h",
          "7-day free trial (auto-renews → paid unless canceled)",
          "One-time mini-package option: 2 job posts / €500",
        ],
        // priceIdMonthly: "price_starter_monthly",
      },
      {
        key: "emp-growth",
        name: "Growth",
        popular: true,
        billing: "monthly",
        monthlyPrice: 1500,
        description: "Enhanced recruiting capabilities with priority support.",
        features: [
          "6 active job posts",
          "Silver promotion for all job posts (value €500/m)",
          "200 InMails/month included (value €1,000/m)",
          "3 recruiter seats",
          "Search: up to 300 profiles/month",
          "Contact invites: 1,000/month (cap: 50/day/seat)",
          "Support: email + chat, SLA 24h",
          "10% off additional promo packages / InMails",
        ],
        // priceIdMonthly: "price_growth_monthly",
      },
      {
        key: "emp-scale",
        name: "Scale (Unlimited)",
        billing: "yearly",
        yearlyPrice: 5000,
        description:
          "Unlimited job posts with advanced recruiting tools for large enterprises.",
        features: [
          "Unlimited job posts (fair use: up to 25 active simultaneously)",
          "5 recruiter seats",
          "Advanced search + shortlist export",
          "Account manager (QBR/quarterly)",
          "25% off promo packages (Silver/Gold/Diamond/Platinum)",
          "Add-on bundle: Annual promotion for all job posts — €9,000/year",
          "Support: priority, SLA 4h",
        ],
        // priceIdYearly: "price_scale_yearly",
      },
    ],
    []
  );

  const plans = selectedUserType === "job_seeker" ? candidatePlans : employerPlans;

  /* ---------------------- Helpers ---------------------- */
  const unitForPlan = (plan: LocalPlan): "month" | "year" | "" => {
    if (plan.billing === "free") return "";
    if (plan.billing === "both") return isMonthly ? "month" : "year";
    return plan.billing === "monthly" ? "month" : "year";
  };

  const priceForPlan = (plan: LocalPlan): number => {
    if (plan.billing === "free") return 0;
    if (plan.billing === "both") {
      return isMonthly ? plan.monthlyPrice! : plan.yearlyPrice!;
    }
    if (plan.billing === "monthly") return plan.monthlyPrice!;
    return plan.yearlyPrice!;
  };

  const canStripeCheckout = (plan: LocalPlan) => {
    if (plan.billing === "both") {
      return isMonthly ? !!plan.priceIdMonthly : !!plan.priceIdYearly;
    }
    if (plan.billing === "monthly") return !!plan.priceIdMonthly;
    if (plan.billing === "yearly") return !!plan.priceIdYearly;
    return false;
  };

  const stripePayloadFor = (plan: LocalPlan) => {
    // StripeCheckout expects cents
    const euros = priceForPlan(plan);
    const cents = Math.round(euros * 100);
    const priceId =
      plan.billing === "both"
        ? isMonthly
          ? plan.priceIdMonthly
          : plan.priceIdYearly
        : plan.billing === "monthly"
        ? plan.priceIdMonthly
        : plan.priceIdYearly;

    return {
      id: plan.key,
      priceId: priceId || plan.key, // fallback (won't be used if not wired)
      name: plan.name,
      description: plan.description ?? "",
      mode: "subscription" as const,
      price: cents,
      currency: "eur",
      category: "subscription" as const,
      popular: plan.popular,
    };
  };

  const handleCheckoutError = (msg: string) => {
    setCheckoutError(msg);
    setTimeout(() => setCheckoutError(null), 5000);
  };

  const gridColsMd =
    plans.length <= 1 ? "md:grid-cols-1" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  const gridColsLg = plans.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  const showBillingToggle =
    // show the toggle when at least one plan supports both cycles
    plans.some((p) => p.billing === "both");

  const unitLabel = (u: string) => (u ? ` / ${u}` : "");

  /* ----------------------- UI ----------------------- */
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
              onClick={() => setSelectedUserType("job_seeker")}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedUserType === "job_seeker"
                  ? "bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/25"
                  : "bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>For Candidates</span>
            </button>
            <button
              onClick={() => setSelectedUserType("employer")}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedUserType === "employer"
                  ? "bg-[#FFC107] text-black shadow-lg shadow-[#FFC107]/25"
                  : "bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>For Employers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout error */}
      {checkoutError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm text-center">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Billing Toggle (only if relevant) */}
      {showBillingToggle && (
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
          <span className="text-white font-medium">Annual</span>
        </div>
      )}

      {/* Plans */}
      <div
        className={cn(
          "grid grid-cols-1 gap-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8",
          gridColsMd,
          gridColsLg
        )}
      >
        {plans.map((plan, index) => {
          const price = priceForPlan(plan);
          const unit = unitForPlan(plan);

          return (
            <motion.div
              key={plan.key}
              initial={{ y: 50, opacity: 0 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.popular ? -20 : 0,
                      opacity: 1,
                      x:
                        plans.length === 2
                          ? index === 1
                            ? -30
                            : 30
                          : plans.length === 3
                          ? index === 2
                            ? -30
                            : index === 0
                            ? 30
                            : 0
                          : 0,
                      scale:
                        (plans.length === 2 && (index === 0 || index === 1)) ||
                        (plans.length === 3 && (index === 0 || index === 2))
                          ? 0.94
                          : 1.0,
                    }
                  : { y: 0, opacity: 1 }
              }
              viewport={{ once: true }}
              transition={{
                duration: 1.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.4 + index * 0.1,
                opacity: { duration: 0.5 },
              }}
              className={cn(
                "rounded-2xl border p-8 bg-white/5 backdrop-blur-sm text-center lg:flex lg:flex-col lg:justify-center relative",
                plan.popular ? "border-[#FFC107] border-2" : "border-white/20",
                "flex flex-col",
                !plan.popular && "mt-5",
                (plans.length === 2 && (index === 0 || index === 1)) ||
                  (plans.length === 3 && (index === 0 || index === 2))
                  ? "z-0 transform translate-x-0 translate-y-0"
                  : "z-10"
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

                {/* Price + unit */}
                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-white">
                    {plan.billing === "free" ? (
                      "€0"
                    ) : (
                      <NumberFlow
                        value={price}
                        format={{
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }}
                        formatter={(v) => `€${v}`}
                        transformTiming={{ duration: 500, easing: "ease-out" }}
                        willChange
                        className="font-variant-numeric: tabular-nums"
                      />
                    )}
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-400">
                    {unitLabel(unit)}
                  </span>
                </div>

                <p className="text-xs leading-5 text-gray-400 mb-6">
                  {plan.billing === "free"
                    ? "forever free"
                    : unit === "month"
                    ? "billed monthly"
                    : "billed annually"}
                </p>

                <ul className="mt-5 gap-3 flex flex-col">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-left text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <hr className="w-full my-6 border-white/20" />

                {/* Checkout or fallback */}
                {canStripeCheckout(plan) ? (
                  <StripeCheckout
                    product={stripePayloadFor(plan)}
                    onError={(e) => handleCheckoutError(e)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                      "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-[#FFC107] hover:ring-offset-1",
                      plan.popular
                        ? "bg-[#FFC107] text-black border-[#FFC107] hover:bg-[#FFB300]"
                        : "bg-transparent text-white border-white/30 hover:bg-[#FFC107] hover:text-black hover:border-[#FFC107]"
                    )}
                  >
                    Get Started
                  </StripeCheckout>
                ) : (
                  <Button
                    onClick={user ? undefined : openSignup}
                    disabled={!!user}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                      "transform-gpu ring-offset-current transition-all duration-300 ease-out",
                      user
                        ? "bg-gray-600 text-gray-300 border-gray-600 cursor-not-allowed"
                        : "bg-transparent text-white border-white/30 hover:bg-[#FFC107] hover:text-black hover:border-[#FFC107] hover:ring-2 hover:ring-[#FFC107] hover:ring-offset-1"
                    )}
                  >
                    {plan.billing === "free"
                      ? user
                        ? "Current Plan"
                        : "Get Started Free"
                      : "Get Started"}
                  </Button>
                )}

                {plan.description && (
                  <p className="mt-4 text-xs leading-5 text-gray-400">
                    {plan.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Optional Add-ons button */}
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
