export interface StripeProduct {
  id: string
  priceId: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
  price: number
  currency: string
  category: 'verification' | 'boost' | 'subscription' | 'job_posts' | 'enterprise' | 'outreach' | 'promotion'
  popular?: boolean
  premium?: boolean
}

export const stripeProducts: StripeProduct[] = [
  // Verification
  {
    id: 'prod_SxkyxEVxeDOsi4',
    priceId: 'price_1S1pS7B0UOyKXg2VjEtaunLm',
    name: 'Account Verification Fee',
    description: 'Verify your account to unlock premium features and build trust with employers.',
    mode: 'payment',
    price: 100, // 1.00 EUR in cents
    currency: 'eur',
    category: 'verification'
  },

  // Boost
  {
    id: 'prod_Sxkxm8chH8YAIF',
    priceId: 'price_1S1pRBB0UOyKXg2VGIxGJhu8',
    name: 'Spotlight Boost',
    description: 'Boost your profile visibility and get noticed by top employers.',
    mode: 'payment',
    price: 499, // 4.99 EUR in cents
    currency: 'eur',
    category: 'boost',
    popular: true
  },

  // Subscription Plans
  {
    id: 'prod_SxkwP250qwXKUS',
    priceId: 'price_1S1pQnB0UOyKXg2Va1kY2zIz',
    name: 'Candidates Pro',
    description: 'Advanced candidate search and unlimited profile views.',
    mode: 'subscription',
    price: 1200, // 12.00 EUR in cents
    currency: 'eur',
    category: 'subscription'
  },

  {
    id: 'prod_SxkmZ7X1toSBbM',
    priceId: 'price_1S1pGeB0UOyKXg2ViDCraScF',
    name: 'Employer Scale (Unlimited)',
    description: 'Unlimited job posts and advanced recruiting tools for large enterprises.',
    mode: 'subscription',
    price: 500000, // 5,000.00 EUR in cents
    currency: 'eur',
    category: 'subscription',
    premium: true
  },

  {
    id: 'prod_SxklBPemcQRFwy',
    priceId: 'price_1S1pG0B0UOyKXg2Vv0yQHhgi',
    name: 'Employer Growth',
    description: 'Enhanced recruiting capabilities with priority support.',
    mode: 'subscription',
    price: 150000, // 1,500.00 EUR in cents
    currency: 'eur',
    category: 'subscription',
    popular: true
  },

  {
    id: 'prod_SxkkMUCwtSAfTM',
    priceId: 'price_1S1pFTB0UOyKXg2Vin1jzpnm',
    name: 'Employer Starter',
    description: 'Perfect for small businesses starting their recruitment journey.',
    mode: 'subscription',
    price: 60000, // 600.00 EUR in cents
    currency: 'eur',
    category: 'subscription'
  },

  // Job Posts
  {
    id: 'prod_SxkvVDuP0XlWWM',
    priceId: 'price_1S1pPUB0UOyKXg2VMn1YWHeH',
    name: '2 Job Posts',
    description: 'Purchase 2 additional job post credits for your account.',
    mode: 'payment',
    price: 50000, // 500.00 EUR in cents
    currency: 'eur',
    category: 'job_posts'
  },

  // Enterprise
  {
    id: 'prod_Sxku8Np2VVIbRB',
    priceId: 'price_1S1pOiB0UOyKXg2VA1puq0U9',
    name: 'Top 100 Brand Leaderboard',
    description: 'Elite brand visibility and recognition in our Top 100 Brand Leaderboard.',
    mode: 'subscription',
    price: 10000000, // 100,000.00 EUR in cents
    currency: 'eur',
    category: 'enterprise',
    premium: true
  },

  {
    id: 'prod_SxkuRIJ1jpTYSf',
    priceId: 'price_1S1pOHB0UOyKXg2VPHBBOAnT',
    name: 'Enterprise Connect',
    description: 'GDPR-safe contact access with premium support and compliance tools.',
    mode: 'subscription',
    price: 5000000, // 50,000.00 EUR in cents
    currency: 'eur',
    category: 'enterprise',
    premium: true
  },

  // Outreach
  {
    id: 'prod_Sxktl0mR8KJ2eB',
    priceId: 'price_1S1pNRB0UOyKXg2V6EuAmmVH',
    name: 'Unlimited Invites',
    description: 'Connect with unlimited professionals with fair-use protections.',
    mode: 'subscription',
    price: 2500000, // 25,000.00 EUR in cents
    currency: 'eur',
    category: 'outreach',
    premium: true
  },

  {
    id: 'prod_SxksQ5iDHzefCC',
    priceId: 'price_1S1pMnB0UOyKXg2Va3NK6Rpm',
    name: 'InMails 500',
    description: 'Extended messaging for active recruiting with advanced targeting.',
    mode: 'subscription',
    price: 150000, // 1,500.00 EUR in cents
    currency: 'eur',
    category: 'outreach',
    popular: true
  },

  {
    id: 'prod_SxksfJjgjwhntB',
    priceId: 'price_1S1pMRB0UOyKXg2VOlHCkfW2',
    name: 'InMails 200',
    description: 'Direct messaging to potential candidates with message templates.',
    mode: 'subscription',
    price: 100000, // 1,000.00 EUR in cents
    currency: 'eur',
    category: 'outreach'
  },

  // Promotion
  {
    id: 'prod_SxkqbNkV7FdLQr',
    priceId: 'price_1S1pL9B0UOyKXg2VhM6XaOHD',
    name: 'Promotional Package Platinum',
    description: 'Ultimate promotion package with exclusive placement and dedicated support.',
    mode: 'subscription',
    price: 200000, // 2,000.00 EUR in cents
    currency: 'eur',
    category: 'promotion',
    premium: true
  },

  {
    id: 'prod_SxkqZwSsRHpvlO',
    priceId: 'price_1S1pKjB0UOyKXg2VUpKr7uY4',
    name: 'Promotional Package Diamond',
    description: 'Maximum exposure with top-tier placement guarantee and analytics.',
    mode: 'subscription',
    price: 150000, // 1,500.00 EUR in cents
    currency: 'eur',
    category: 'promotion'
  },

  {
    id: 'prod_SxkpSa2Ger5PlY',
    priceId: 'price_1S1pKGB0UOyKXg2VEMcjsKFm',
    name: 'Promotional Package Gold',
    description: 'Premium visibility with featured badges and enhanced branding.',
    mode: 'subscription',
    price: 100000, // 1,000.00 EUR in cents
    currency: 'eur',
    category: 'promotion',
    popular: true
  },

  {
    id: 'prod_Sxkp58iB2y0Nqa',
    priceId: 'price_1S1pJgB0UOyKXg2VCVnTcrLf',
    name: 'Promotion Package Silver',
    description: 'Boost visibility for all your job posts with priority placement.',
    mode: 'subscription',
    price: 50000, // 500.00 EUR in cents
    currency: 'eur',
    category: 'promotion'
  },

  {
    id: 'prod_SxknQzq2VbqDtB',
    priceId: 'price_1S1pHeB0UOyKXg2VJiaoH7FQ',
    name: 'Annual Promotion Add-on',
    description: 'Best value for year-round visibility with significant cost savings.',
    mode: 'subscription',
    price: 900000, // 9,000.00 EUR in cents
    currency: 'eur',
    category: 'promotion'
  }
]

export const getProductsByCategory = (category: StripeProduct['category']) => {
  return stripeProducts.filter(product => product.category === category)
}

export const getProductByPriceId = (priceId: string) => {
  return stripeProducts.find(product => product.priceId === priceId)
}

export const formatPrice = (price: number, currency: string = 'eur') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price / 100)
}