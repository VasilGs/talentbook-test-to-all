import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StripeCheckout } from "@/components/StripeCheckout";
import { verificationProduct } from "@/stripe-config";
import type { User } from "@supabase/supabase-js";

export function VerifyButton({
  user,
  className,
  label = "Verify for €1",
}: {
  user: User | null;
  className?: string;
  label?: string;
}) {
  if (!user) return null;

  // pass userId & type so webhook can update the right table
  const productWithMeta = {
    ...verificationProduct,
    metadata: { userId: user.id, purpose: "verification" },
    // if your StripeCheckout supports URLs via props, pass them here:
    successPath: "/checkout/success?type=verification",
    cancelPath: "/checkout/cancel?type=verification",
  };

  return (
    <StripeCheckout
      product={productWithMeta as any}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "bg-transparent text-white border-white/30 hover:bg-[#FFC107] hover:text-black hover:border-[#FFC107]",
        className
      )}
    >
      {label}
    </StripeCheckout>
  );
}
