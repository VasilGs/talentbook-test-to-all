import React, { useState, useEffect } from 'react';
import { Search, Users, Briefcase, Star, Loader2, X, Check } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { JobCandidateAnimation } from './components/job-candidate-animation';
import { Pricing } from './components/ui/pricing';
import { SignupModal } from './components/signup-modal';
import { LoginModal } from './components/login-modal';
import { UserProfileView } from './components/UserProfileView';
import { JobCard } from './components/JobCard';
import { JobDetailsModal } from './components/JobDetailsModal';
import { JobSeekerProfileCompletion } from './components/JobSeekerProfileCompletion';
import { CompanyProfileCompletion } from './components/CompanyProfileCompletion';
import { CompanyProfileView } from './components/CompanyProfileView';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { supabase, type User } from './lib/supabase';

interface SignupData {
  name: string
  email: string
  password: string
  userType: 'job_seeker' | 'company'
}

// Company interface matching Supabase table structure
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
}

// Job interface matching Supabase table structure
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

export default function App() {
  const [placeholderText, setPlaceholderText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tempSignupData, setTempSignupData] = useState<SignupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'home' | 'search-jobs' | 'complete-profile' | 'user-profile'>('home');
  const [userProfileComplete, setUserProfileComplete] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPrivacyTermsModalOpen, setIsPrivacyTermsModalOpen] = useState(false);

  const texts = [
    "What job are you looking for?",
    "Who are you looking to hire?"
  ];

  useEffect(() => {
    const currentText = texts[currentTextIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setPlaceholderText(currentText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(currentText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((currentTextIndex + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, currentTextIndex, texts]);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    const startTime = Date.now()
    const minLoadingTime = 2500 // 2.5 seconds minimum loading time
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      setTimeout(() => {
        setUser(session?.user ?? null)
        if (session?.user) {
          checkUserProfileCompletion(session.user)
        } else {
          // Clear temp signup data when user logs out
          setTempSignupData(null)
        }
        setLoading(false)
      }, remainingTime)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Show loading screen for auth state changes (login/logout)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(true)
        const authChangeStartTime = Date.now()
        
        setTimeout(() => {
          setUser(session?.user ?? null)
          if (event === 'SIGNED_IN' && session?.user) {
            checkUserProfileCompletion(session.user)
            // Clear temp signup data when user successfully logs in
            setTempSignupData(null)
          } else if (event === 'SIGNED_OUT') {
            setUserProfileComplete(false)
            setCurrentPage('home')
            setTempSignupData(null)
            setCompanyData(null)
          }
          setLoading(false)
          
          // Close modals when user logs in
          if (session?.user) {
            setIsSignupModalOpen(false)
            setIsLoginModalOpen(false)
          }
        }, minLoadingTime)
      } else {
        // For other events, update immediately
        setUser(session?.user ?? null)
        if (session?.user) {
          checkUserProfileCompletion(session.user)
        }
      }
    })
      
    return () => subscription.unsubscribe()
  }, [])

  // Check if user profile is complete
  const checkUserProfileCompletion = async (user: User) => {
    const userType = user.user_metadata?.user_type
    
    if (userType === 'job_seeker') {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        // Check if profile exists (regardless of completeness)
        if (error || !profile) {
          setUserProfileComplete(false)
          return
        }

        // Profile exists, mark as complete
        setUserProfileComplete(true)
      } catch (error) {
        console.error('Error checking profile completion:', error)
        setUserProfileComplete(false)
      }
    } else if (userType === 'company') {
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        // Check if company profile exists (regardless of completeness)
        if (error || !company) {
          setUserProfileComplete(false)
          setCompanyData(null)
        } else {
          setUserProfileComplete(true)
          setCompanyData(company)
        }
      } catch (error) {
        console.error('Error checking company profile completion:', error)
        setUserProfileComplete(false)
        setCompanyData(null)
      }
    }
  }

  const handleProfileComplete = () => {
    setUserProfileComplete(true)
    setTempSignupData(null)
  }

  const handleCompanyProfileUpdate = () => {
    // Re-fetch company data after update
    if (user) checkUserProfileCompletion(user)
  }

  const handleContinueSignup = (signupData: SignupData) => {
    setTempSignupData(signupData)
    setIsSignupModalOpen(false)
    setCurrentPage('complete-profile')
  }

  // Fetch jobs from Supabase
  const fetchJobs = async () => {
    setJobsLoading(true)
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
    } finally {
      setJobsLoading(false)
    }
  }

  // Fetch jobs when user logs in and navigates to search page
  useEffect(() => {
    if (user && currentPage === 'search-jobs') {
      fetchJobs()
    }
  }, [user, currentPage])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Handle logout errors gracefully - the local session will still be cleared
      console.warn('Logout error (local session cleared):', error)
    }
  }

  const handleSearchJobsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentJobIndex(0); // Reset to first job when navigating to search
    setCurrentPage('search-jobs');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage('home');
  };

  const handleUserNameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage('user-profile');
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    console.log(`Swiped ${direction} on job:`, jobs[currentJobIndex]);
    
    // Move to next job
    if (currentJobIndex < jobs.length - 1) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      // Reset to first job when all jobs are swiped
      setCurrentJobIndex(0);
    }
    
    // Reset exit direction after swipe
    setTimeout(() => {
      setExitDirection(null);
    }, 100);
  };

  const handleActionButton = (action: 'reject' | 'approve') => {
    setExitDirection(action === 'reject' ? 'left' : 'right');
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50); // Light haptic feedback
    }
    
    // Trigger the swipe with a slight delay to ensure exitDirection is set
    setTimeout(() => {
      handleSwipe(action === 'reject' ? 'left' : 'right');
    }, 10);
  };

  const handleJobCardClick = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/talent_book_logo_draft_3 copy copy.png" 
              alt="TalentBook Logo" 
              className="h-16 w-auto mx-auto object-contain"
            />
          </div>
          
          {/* Loading Spinner */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Loader2 className="w-6 h-6 text-[#FFC107] animate-spin" />
            <span className="text-white text-lg font-medium">Loading TalentBook...</span>
          </div>
          
          {/* Loading Bar */}
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-red-600 to-[#FFC107] rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Navigation Header */}
      <header className="relative z-10">
        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <button onClick={handleLogoClick} className="focus:outline-none">
                <img 
                  src="/talent_book_logo_draft_3 copy copy.png" 
                  alt="TalentBook Logo" 
                  className="h-12 w-auto object-contain hover:opacity-80 transition-opacity duration-200"
                />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <a 
                href="#search-jobs"
                onClick={handleSearchJobsClick}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium flex items-center space-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
              >
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </a>
            )}
            {!user && (
              <>
                <a href="#about" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium scroll-smooth">
                  About us
                </a>
                <a href="#pricing" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium scroll-smooth">
                  Pricing
                </a>
                <a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-200 font-medium scroll-smooth">
                  Contact us
                </a>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleUserNameClick}
                  className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  Welcome, {user.user_metadata?.full_name || user.email}!
                </button>
                <button 
                  onClick={handleSignOut}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Log In
                </button>
                <button 
                  onClick={() => setIsSignupModalOpen(true)}
                  className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#FFC107]/25"
                >
                  Sign Up For Free
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden px-4 sm:px-6 pb-4">
          {user ? (
            <div className="flex items-center justify-center">
              <a 
                href="#search-jobs"
                onClick={handleSearchJobsClick}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium flex items-center space-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
              >
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </a>
            </div>
          ) : (
          <div className="md:hidden px-4 sm:px-6 pb-4">
            <div className="flex items-center justify-center space-x-6">
              <a href="#about" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium scroll-smooth">
                About us
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium scroll-smooth">
                Pricing
              </a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium scroll-smooth">
                Contact us
              </a>
            </div>
          </div>
          )}
        </div>
      </header>

      {/* User Profile View - When logged in */}
      {user && userProfileComplete && currentPage === 'user-profile' && (
        <>
          {user.user_metadata?.user_type === 'job_seeker' && <UserProfileView onSignOut={handleSignOut} />}
          {user.user_metadata?.user_type === 'company' && companyData && (
            <CompanyProfileView 
              company={companyData} 
              onUpdateSuccess={handleCompanyProfileUpdate} 
              onSignOut={handleSignOut}
            />
          )}
        </>
      )}

      {/* Job Seeker Profile Completion - When logged in as job seeker with incomplete profile */}
      {tempSignupData && tempSignupData.userType === 'job_seeker' && (
        <JobSeekerProfileCompletion 
          signupData={tempSignupData}
          onProfileComplete={handleProfileComplete}
        />
      )}

      {/* Company Profile Completion - When signed up as company */}
      {tempSignupData && tempSignupData.userType === 'company' && (
        <CompanyProfileCompletion 
          signupData={tempSignupData}
          onProfileComplete={handleProfileComplete}
        />
      )}

      {/* Job Search Page - When logged in and on search page */}
      {user && userProfileComplete && currentPage === 'search-jobs' && (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-8 px-4">
          <div className="max-w-md mx-auto">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for job"
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 pr-14"
                />
                <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-400 transition-colors duration-200">
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Job Cards */}
            <div className="relative h-[500px] mb-1">
              <AnimatePresence mode="wait">
                {jobsLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-[#FFC107] animate-spin mx-auto mb-4" />
                      <p className="text-white">Loading jobs...</p>
                    </div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        No jobs available
                      </h3>
                      <p className="text-gray-300 mb-6">
                        Check back later for new opportunities.
                      </p>
                      <button
                        onClick={fetchJobs}
                        className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                ) : currentJobIndex < jobs.length ? (
                  <JobCard
                    key={jobs[currentJobIndex].id}
                    job={{
                      id: jobs[currentJobIndex].id,
                      company: jobs[currentJobIndex].company_name,
                      position: jobs[currentJobIndex].position,
                      location: jobs[currentJobIndex].location,
                      salary: jobs[currentJobIndex].salary || 'Salary not specified',
                      logo: jobs[currentJobIndex].company_logo || ''
                    }}
                    onSwipe={handleSwipe}
                    onCardClick={() => handleJobCardClick(jobs[currentJobIndex])}
                    exitDirection={exitDirection}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        No more jobs!
                      </h3>
                      <p className="text-gray-300 mb-6">
                        You've seen all available positions.
                      </p>
                      <button
                        onClick={() => setCurrentJobIndex(0)}
                        className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            {!jobsLoading && jobs.length > 0 && currentJobIndex < jobs.length && (
              <div className="flex justify-center space-x-12 mt-2">
                {/* Reject Button */}
                <button
                  onClick={() => handleActionButton('reject')}
                  className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border-2 border-red-500/40 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-red-500/40 hover:to-red-600/40 hover:border-red-500/70 hover:scale-110 transition-all duration-300 group shadow-lg shadow-red-500/20"
                >
                  <X className="w-8 h-8 text-red-400 group-hover:text-red-300 transition-colors duration-200" />
                </button>

                {/* Approve Button */}
                <button
                  onClick={() => handleActionButton('approve')}
                  className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border-2 border-green-500/40 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-green-500/40 hover:to-green-600/40 hover:border-green-500/70 hover:scale-110 active:scale-95 transition-all duration-300 group shadow-lg shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                  aria-label="Approve job"
                  disabled={currentJobIndex >= jobs.length}
                >
                  <Check className="w-8 h-8 text-white/60 group-hover:text-green-400 transition-colors duration-200" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hero Section */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <main className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero Content */}
            <div className="pt-6 sm:pt-12 lg:pt-16 pb-20">
              {/* Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-red-600/20 to-amber-500/20 rounded-full px-4 py-2 mb-8 border border-red-600/30">
                <Star className="w-4 h-4 text-amber-400 mr-2" />
                <span className="text-[#FFC107] text-sm font-medium">Trusted by 10,000+ professionals</span>
              </div>

              {/* Headlines */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight font-poppins">
                <JobCandidateAnimation />
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                Swipe and match with your perfect job or candidate.
              </p>

              {/* Search Section */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-[#FFC107] shadow-2xl">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="w-full h-14 pl-12 pr-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all duration-200 text-lg"
                        placeholder={`${placeholderText}${showCursor ? '|' : ''}`}
                        readOnly
                      />
                    </div>
                    <button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 flex items-center justify-center space-x-2 text-lg">
                      <span>Search</span>
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-[#FFC107]" />
                      <span className="text-white text-sm font-medium">For Job Seekers</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-red-400" />
                      <span className="text-white text-sm font-medium">For Employers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">50K+</div>
                  <div className="text-gray-400">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">100K+</div>
                  <div className="text-gray-400">Professionals</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFC107]/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-red-600/5 to-amber-500/5 rounded-full blur-3xl"></div>
          </div>
        </main>
      )}

      {/* About Us Section */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <section id="about" className="relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-red-600/20 to-[#FFC107]/20 rounded-full px-4 py-2 mb-6 border border-red-600/30">
                <Users className="w-4 h-4 text-[#FFC107] mr-2" />
                <span className="text-[#FFC107] text-sm font-medium">About TalentBook</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-poppins">
                Connecting talent with
                <span className="block bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  opportunity
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                We're revolutionizing the way people find jobs and companies discover talent. 
                Our platform makes career connections as simple as a swipe.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
              {/* For Job Seekers */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 font-poppins">For Job Seekers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Discover your dream job through our intuitive matching system. Swipe through opportunities 
                  tailored to your skills and preferences.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3"></div>
                    Smart job matching algorithm
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3"></div>
                    Real-time application tracking
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3"></div>
                    Direct messaging with employers
                  </li>
                </ul>
              </div>

              {/* For Employers */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FFC107] to-[#FFB300] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 font-poppins">For Employers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Find the perfect candidates faster than ever. Our platform connects you with 
                  pre-qualified talent that matches your requirements.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-[#FFC107] rounded-full mr-3"></div>
                    AI-powered candidate screening
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-[#FFC107] rounded-full mr-3"></div>
                    Streamlined hiring process
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-[#FFC107] rounded-full mr-3"></div>
                    Advanced analytics dashboard
                  </li>
                </ul>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-600/10 to-[#FFC107]/10 rounded-3xl p-12 border border-red-600/20">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 font-poppins">
                  Our Mission
                </h3>
                <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  We created TalentBook to help people and companies find their perfect match.
                  <br /><br />
                  That's why we made the process as fast and simple as possible. With AI, you can create your profile and CV in seconds, so you can find your match faster than ever.
                  <br /><br />
                  And to make it even easier – every job seeker can simply swipe through job posts until they find the right one. Then, with just a few clicks, they can apply and send their CV.
                </p>
              </div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-red-600/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[#FFC107]/5 rounded-full blur-3xl"></div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <section id="pricing" className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 -mt-8">
          <Pricing
            title="Choose Your Plan"
            description="Find the perfect plan for your needs. Whether you're a job seeker or employer, we have options that scale with you."
            plans={[
              {
                name: "JOB SEEKER",
                price: "0",
                yearlyPrice: "0",
                period: "forever",
                features: [
                  "Unlimited job applications",
                  "AI-powered profile creation",
                  "Smart job matching",
                  "Direct messaging with employers",
                  "Mobile app access",
                  "Basic analytics",
                ],
                description: "Perfect for professionals looking for their next opportunity",
                buttonText: "Get Started Free",
                href: "/sign-up",
                isPopular: false,
                userType: "job_seeker",
              },
              {
                name: "STARTER",
                price: "600",
                yearlyPrice: "480",
                period: "month",
                features: [
                  "3 active job posts simultaneously",
                  "1 recruiter seat",
                  "Up to 50 profile views/month",
                  "200 connection invites/month",
                  "Email support (48h SLA)",
                  "7 days free trial",
                  "One-time mini-package option available",
                ],
                description: "Perfect for small companies starting their hiring journey",
                buttonText: "Start 7-Day Free Trial",
                href: "/sign-up",
                isPopular: false,
                userType: "employer",
              },
              {
                name: "GROWTH",
                price: "1500",
                yearlyPrice: "1200",
                period: "month",
                features: [
                  "6 active job posts",
                  "Silver promotion included (€500 value)",
                  "200 InMails/month included (€1,000 value)",
                  "3 recruiter seats",
                  "Up to 300 profile views/month",
                  "1,000 connection invites/month",
                  "Email + chat support (24h SLA)",
                  "10% discount on additional packages",
                ],
                description: "Ideal for growing companies and HR teams",
                buttonText: "Start Free Trial",
                href: "/sign-up",
                isPopular: true,
                userType: "employer",
              },
              {
                name: "SCALE (UNLIMITED)",
                price: "5000",
                yearlyPrice: "5000",
                period: "year",
                features: [
                  "Unlimited job posts (up to 25 active)",
                  "5 recruiter seats",
                  "Advanced search + shortlist export",
                  "Dedicated account manager",
                  "25% discount on promo packages",
                  "Annual promotion bundle available",
                  "Priority support (4h SLA)",
                  "Quarterly business reviews",
                ],
                description: "For large organizations with specific requirements",
                buttonText: "Contact Sales",
                href: "/contact",
                isPopular: false,
                userType: "employer",
              },
            ]}
          />

          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl"></div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <section id="contact" className="relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-red-600/20 to-[#FFC107]/20 rounded-full px-4 py-2 mb-6 border border-red-600/30">
                <span className="text-[#FFC107] text-sm font-medium">Get in Touch</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-poppins">
                Do you want to ask a question?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Have questions about TalentBook? Want to learn more about our enterprise solutions? 
                We'd love to hear from you.
              </p>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Contact Form */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-semibold text-white mb-6 font-poppins">Send us a message</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Tell us about your needs..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <h3 className="text-2xl font-semibold text-white mb-6 font-poppins">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">Email</h4>
                        <p className="text-gray-300">hello@talentbook.com</p>
                        <p className="text-gray-300">support@talentbook.com</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFC107] to-[#FFB300] rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">Phone</h4>
                        <p className="text-gray-300">+1 (555) 123-4567</p>
                        <p className="text-gray-400 text-sm">Mon-Fri 9AM-6PM EST</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Quick Links */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4 font-poppins">Quick Help</h3>
                  <div className="space-y-3">
                    <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 transform">
                      → How does TalentBook work?
                    </a>
                    <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 transform">
                      → Pricing and billing questions
                    </a>
                    <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 transform">
                      → Enterprise solutions
                    </a>
                    <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200 hover:translate-x-1 transform">
                      → Technical support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#FFC107]/5 rounded-full blur-3xl"></div>
          </div>
        </section>
      )}

      {/* Footer */}
      {currentPage === 'home' && (
        <footer className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Logo and Copyright */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                © 2025 TalentBook. All rights reserved.
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center space-x-6">
              <a 
                href="/privacy-terms" 
                onClick={(e) => {
                  e.preventDefault();
                  setIsPrivacyTermsModalOpen(true);
                }}
                className="text-gray-400 hover:text-[#FFC107] transition-colors duration-200 text-sm"
              >
                Privacy Policy and Terms of Use
              </a>
            </div>
          </div>
        </div>
        </footer>
      )}

      {/* Signup Modal */}
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
        onSwitchToLogin={() => setIsLoginModalOpen(true)}
        onContinueSignup={handleContinueSignup}
        onOpenPrivacyTerms={() => setIsPrivacyTermsModalOpen(true)}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSwitchToSignup={() => setIsSignupModalOpen(true)}
      />

      {/* Job Details Modal */}
      <JobDetailsModal
        isOpen={isJobDetailsModalOpen}
        onClose={() => setIsJobDetailsModalOpen(false)}
        job={selectedJob}
        userId={user?.id || null}
      />

      {/* Privacy Terms Modal */}
      <PrivacyTermsModal
        isOpen={isPrivacyTermsModalOpen}
        onClose={() => setIsPrivacyTermsModalOpen(false)}
      />
    </div>
  );
}