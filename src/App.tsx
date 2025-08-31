import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, X, ArrowLeft, ArrowRight, Sparkles, Users, Briefcase, Star, Crown, Zap } from 'lucide-react'
import { JobCard } from './components/JobCard'
import { JobDetailsModal } from './components/JobDetailsModal'
import { LoginModal } from './components/login-modal'
import { SignupModal } from './components/signup-modal'
import { JobSeekerProfileCompletion } from './components/JobSeekerProfileCompletion'
import { CompanyProfileCompletion } from './components/CompanyProfileCompletion'
import { UserProfileView } from './components/UserProfileView'
import { CompanyProfileView } from './components/CompanyProfileView'
import { PrivacyTermsModal } from './components/PrivacyTermsModal'
import { JobCandidateAnimation } from './components/job-candidate-animation'
import { Pricing } from './components/ui/pricing'
import { AddOnsModal } from './components/AddOnsModal'
import { supabase, type User } from './lib/supabase'

interface Job {
  id: string;
  company_name: string;
  company_logo: string | null;
  position: string;
  location: string;
  salary: string | null;
  job_type: string | null;
  experience_level: string | null;
  short_description: string | null;
  requirements: string | null;
  skills: string[] | null;
  application_link: string | null;
  is_remote: boolean | null;
  status: string | null;
  created_at: string;
}

interface SignupData {
  name: string
  email: string
  password: string
  userType: 'job_seeker' | 'company'
}

interface CompanyData {
  id: string
  company_name: string
  company_logo: string | null
  industry: string | null
  website_link: string | null
  short_introduction: string | null
  mol_name: string | null
  uic_company_id: string | null
  address: string | null
  phone_number: string | null
  contact_email: string | null
  responsible_person_name: string | null
  number_of_employees: number | null
  subscription_package: string | null
  created_at: string
  updated_at: string
  user_id: string | null
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showPrivacyTermsModal, setShowPrivacyTermsModal] = useState(false)
  const [showAddOnsModal, setShowAddOnsModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userType, setUserType] = useState<'job_seeker' | 'company' | null>(null)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [signupData, setSignupData] = useState<SignupData | null>(null)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

  // Check for existing session on app load
  useEffect(() => {
    checkSession()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSignIn(session.user)
      } else if (event === 'SIGNED_OUT') {
        handleSignOut()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await handleUserSignIn(session.user)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setLoading(false)
    }
  }

  const handleUserSignIn = async (user: User) => {
    setUser(user)
    const userTypeFromMetadata = user.user_metadata?.user_type as 'job_seeker' | 'company' | undefined
    setUserType(userTypeFromMetadata || 'job_seeker')

    // If user is a company, fetch company data
    if (userTypeFromMetadata === 'company') {
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching company data:', error)
        } else {
          setCompanyData(company)
        }
      } catch (error) {
        console.error('Error fetching company data:', error)
      }
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setUser(null)
      setUserType(null)
      setCompanyData(null)
      setLoading(false)
    }
  }

  // Fetch jobs when component mounts
  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching jobs:', error)
      } else {
        setJobs(data || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    setExitDirection(direction)
    
    setTimeout(() => {
      if (currentJobIndex < jobs.length - 1) {
        setCurrentJobIndex(currentJobIndex + 1)
      } else {
        setCurrentJobIndex(0) // Loop back to first job
      }
      setExitDirection(null)
    }, 400)
  }

  const handleCardClick = (job: Job) => {
    setSelectedJob(job)
    setShowJobDetails(true)
  }

  const handleContinueSignup = (data: SignupData) => {
    setSignupData(data)
    setShowProfileCompletion(true)
  }

  const handleProfileComplete = () => {
    setShowProfileCompletion(false)
    setSignupData(null)
    // The auth state change will handle the rest
  }

  const handleCompanyUpdateSuccess = () => {
    // Refresh company data
    if (user && userType === 'company') {
      handleUserSignIn(user)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img 
              src="/talent book singular icon.png" 
              alt="TalentBook Icon" 
              className="w-full h-full object-contain animate-pulse"
            />
          </div>
          <p className="text-white text-lg">Loading TalentBook...</p>
        </div>
      </div>
    )
  }

  // Show profile completion if user is signing up
  if (showProfileCompletion && signupData) {
    if (signupData.userType === 'job_seeker') {
      return (
        <JobSeekerProfileCompletion
          signupData={signupData}
          onProfileComplete={handleProfileComplete}
        />
      )
    } else {
      return (
        <CompanyProfileCompletion
          signupData={signupData}
          onProfileComplete={handleProfileComplete}
        />
      )
    }
  }

  // Show company profile view if user is logged in as company
  if (user && userType === 'company' && companyData) {
    return (
      <CompanyProfileView
        company={companyData}
        onUpdateSuccess={handleCompanyUpdateSuccess}
        onSignOut={handleSignOut}
      />
    )
  }

  // Show user profile view if user is logged in as job seeker
  if (user && userType === 'job_seeker') {
    return (
      <UserProfileView onSignOut={handleSignOut} />
    )
  }

  // Default landing page for non-authenticated users
  const currentJob = jobs[currentJobIndex]

  const pricingPlans = [
    {
      name: "Free",
      price: "0",
      yearlyPrice: "0",
      period: "month",
      features: [
        "Create basic profile",
        "Browse job listings",
        "Apply to unlimited jobs",
        "Save up to 10 jobs",
        "Basic search filters"
      ],
      description: "Perfect for getting started",
      buttonText: "Get Started Free",
      href: "#",
      isPopular: false,
      userType: 'job_seeker' as const
    },
    {
      name: "Premium",
      price: "29",
      yearlyPrice: "290",
      period: "month",
      features: [
        "Everything in Free",
        "Advanced profile features",
        "Priority in search results",
        "Unlimited saved jobs",
        "Advanced search filters",
        "Profile analytics",
        "Direct messaging with employers"
      ],
      description: "Best for active job seekers",
      buttonText: "Upgrade to Premium",
      href: "#",
      isPopular: true,
      userType: 'job_seeker' as const
    },
    {
      name: "Pro",
      price: "49",
      yearlyPrice: "490",
      period: "month",
      features: [
        "Everything in Premium",
        "Featured profile placement",
        "Career coaching session",
        "Resume optimization",
        "Interview preparation",
        "Salary negotiation tips",
        "Priority customer support"
      ],
      description: "For serious career advancement",
      buttonText: "Go Pro",
      href: "#",
      isPopular: false,
      userType: 'job_seeker' as const
    },
    {
      name: "Starter",
      price: "99",
      yearlyPrice: "990",
      period: "month",
      features: [
        "Post up to 5 jobs",
        "Basic company profile",
        "Standard applicant filtering",
        "Email notifications",
        "Basic analytics"
      ],
      description: "Perfect for small businesses",
      buttonText: "Start Hiring",
      href: "#",
      isPopular: false,
      userType: 'employer' as const
    },
    {
      name: "Professional",
      price: "299",
      yearlyPrice: "2990",
      period: "month",
      features: [
        "Post unlimited jobs",
        "Enhanced company profile",
        "Advanced candidate search",
        "Priority job placement",
        "Detailed analytics dashboard",
        "Bulk messaging tools",
        "Dedicated account manager"
      ],
      description: "Best for growing companies",
      buttonText: "Go Professional",
      href: "#",
      isPopular: true,
      userType: 'employer' as const
    },
    {
      name: "Enterprise",
      price: "599",
      yearlyPrice: "5990",
      period: "month",
      features: [
        "Everything in Professional",
        "Custom branding options",
        "API access",
        "Advanced integrations",
        "Custom reporting",
        "Priority support",
        "Training sessions",
        "Custom contract terms"
      ],
      description: "For large organizations",
      buttonText: "Contact Sales",
      href: "#",
      isPopular: false,
      userType: 'employer' as const
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img 
                src="/talent book singular icon.png" 
                alt="TalentBook Icon" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white font-poppins">TalentBook</span>
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-1 rounded-md text-xs font-bold">
                BETA
              </div>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-white hover:text-[#FFC107] transition-colors duration-200 font-medium"
            >
              Log In
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight font-poppins">
                  <JobCandidateAnimation />
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  The revolutionary platform that connects talent with opportunity through intelligent matching. 
                  Swipe your way to your dream job or perfect candidate.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25 hover:-translate-y-1"
                >
                  Start Swiping Jobs
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 border-2 border-white/20 hover:border-white/40 backdrop-blur-sm"
                >
                  Post a Job
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FFC107] mb-2">10K+</div>
                  <div className="text-gray-400 text-sm">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FFC107] mb-2">50K+</div>
                  <div className="text-gray-400 text-sm">Professionals</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FFC107] mb-2">95%</div>
                  <div className="text-gray-400 text-sm">Match Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column - Job Card Demo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                {/* Background Cards */}
                <div className="absolute inset-0 transform rotate-3 scale-95 opacity-30">
                  <div className="w-full h-96 bg-white/5 rounded-3xl border border-white/10"></div>
                </div>
                <div className="absolute inset-0 transform -rotate-2 scale-97 opacity-50">
                  <div className="w-full h-96 bg-white/5 rounded-3xl border border-white/10"></div>
                </div>

                {/* Main Card */}
                <div className="relative z-10">
                  <AnimatePresence mode="wait">
                    {currentJob && (
                      <JobCard
                        key={currentJob.id}
                        job={{
                          id: parseInt(currentJob.id),
                          company: currentJob.company_name,
                          position: currentJob.position,
                          location: currentJob.location,
                          salary: currentJob.salary || 'Competitive',
                          logo: currentJob.company_logo || ''
                        }}
                        onSwipe={handleSwipe}
                        onCardClick={handleCardClick}
                        exitDirection={exitDirection}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Swipe Buttons */}
                <div className="flex justify-center space-x-8 mt-8">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="w-16 h-16 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  >
                    <X className="w-8 h-8 text-red-400 group-hover:text-red-300" />
                  </button>
                  <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  >
                    <Heart className="w-8 h-8 text-green-400 group-hover:text-green-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[#FFC107]/10 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-red-600/10 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-600/10 rounded-full blur-xl animate-pulse-slow"></div>
      </div>

      {/* Features Section */}
      <div className="py-16 lg:py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-poppins">
              Why Choose TalentBook?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of recruitment with our innovative swipe-based matching system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFC107] to-[#FFB300] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-poppins">Smart Matching</h3>
              <p className="text-gray-300 leading-relaxed">
                Our AI-powered algorithm analyzes skills, experience, and preferences to suggest the most relevant opportunities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-poppins">Swipe to Match</h3>
              <p className="text-gray-300 leading-relaxed">
                Discover opportunities effortlessly with our intuitive swipe interface. Like what you see? Swipe right to connect.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-poppins">Direct Connect</h3>
              <p className="text-gray-300 leading-relaxed">
                Skip the middleman. Connect directly with hiring managers and candidates for faster, more personal interactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <Pricing 
          plans={pricingPlans}
          onViewAddOns={() => setShowAddOnsModal(true)}
        />
      </div>

      {/* CTA Section */}
      <div className="py-16 lg:py-24 bg-gradient-to-r from-[#FFC107]/10 to-red-600/10">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-poppins">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already discovered their ideal career opportunities through TalentBook.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowSignupModal(true)}
              className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25 hover:-translate-y-1"
            >
              Get Started Free
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 border-2 border-white/20 hover:border-white/40 backdrop-blur-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900/50 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <img 
                    src="/talent book singular icon.png" 
                    alt="TalentBook Icon" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-white font-poppins">TalentBook</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Revolutionizing recruitment through intelligent matching and seamless user experience.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">How it Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">For Job Seekers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">For Employers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Success Stories</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">API Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Status Page</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => setShowPrivacyTermsModal(true)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPrivacyTermsModal(true)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 TalentBook. All rights reserved. Made with ❤️ for the future of work.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => setShowSignupModal(true)}
      />

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => setShowLoginModal(true)}
        onContinueSignup={handleContinueSignup}
        onOpenPrivacyTerms={() => setShowPrivacyTermsModal(true)}
      />

      <PrivacyTermsModal
        isOpen={showPrivacyTermsModal}
        onClose={() => setShowPrivacyTermsModal(false)}
      />

      <AddOnsModal
        isOpen={showAddOnsModal}
        onClose={() => setShowAddOnsModal(false)}
      />

      {selectedJob && (
        <JobDetailsModal
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          job={selectedJob}
          userId={user?.id || null}
        />
      )}
    </div>
  )
}

export default App