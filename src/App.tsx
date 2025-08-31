import React, { useState, useEffect, useRef } from 'react';
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
import { Routes, Route, useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/routes/Protected';
import { getUserType, isCompanyProfileComplete, isSeekerProfileComplete } from '@/lib/role';

// ----------------- Types -----------------
interface SignupData {
  name: string;
  email: string;
  password: string;
  userType: 'job_seeker' | 'company';
}

interface CompanyData {
  id: string;
  company_name: string;
  company_logo: string | null;
  industry: string | null;
  website_link: string | null;
  short_introduction: string | null;
  mol_name: string | null;
  uic_company_id: string | null;
  address: string | null;
  phone_number: string | null;
  contact_email: string | null;
  responsible_person_name: string | null;
  number_of_employees: number | null;
  subscription_package: string | null;
  created_at: string;
  updated_at: string;
}

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

// ----------------- App -----------------
export default function App() {
  // UI typing effect
  const [placeholderText, setPlaceholderText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Auth & global state
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [tempSignupData, setTempSignupData] = useState<SignupData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const routed = useRef(false);

  // Legacy local “pages” inside the landing view
  const [currentPage, setCurrentPage] = useState<'home' | 'search-jobs' | 'complete-profile' | 'user-profile'>('home');

  // Profile state
  const [userProfileComplete, setUserProfileComplete] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [isPrivacyTermsModalOpen, setIsPrivacyTermsModalOpen] = useState(false);

  const texts = [
    'What job are you looking for?',
    'Who are you looking to hire?',
  ];

  // ----------------- Effects -----------------
  // Typing effect
  useEffect(() => {
    const currentText = texts[currentTextIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setPlaceholderText(currentText.substring(0, charIndex + 1));
          setCharIndex((i) => i + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(currentText.substring(0, charIndex - 1));
          setCharIndex((i) => i - 1);
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((idx) => (idx + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, currentTextIndex, texts]);

  // Cursor blink
  useEffect(() => {
    const cursorTimer = setInterval(() => setShowCursor((p) => !p), 500);
    return () => clearInterval(cursorTimer);
  }, []);

  // Auth lifecycle + route-by-role
  useEffect(() => {
    const startTime = Date.now();
    const minLoadingTime = 2500; // 2.5s splash

    supabase.auth.getSession().then(({ data: { session } }) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);

      setTimeout(async () => {
        const u = session?.user ?? null;
        setUser(u);

        if (u) {
          // check profile presence
          await checkUserProfileCompletion(u);
        } else {
          // clear temp data when logged out
          setTempSignupData(null);
        }
        setLoading(false);
      }, remaining);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(true);
        const minLoadingTime = 2500;
        setTimeout(async () => {
          const u = session?.user ?? null;
          setUser(u);

          if (event === 'SIGNED_IN' && u) {
            await checkUserProfileCompletion(u);
            setTempSignupData(null);
            setIsSignupModalOpen(false);
            setIsLoginModalOpen(false);
          } else if (event === 'SIGNED_OUT') {
            setUserProfileComplete(false);
            setCurrentPage('home');
            setTempSignupData(null);
            setCompanyData(null);
            routed.current = false;
            navigate('/', { replace: true });
          }
          setLoading(false);
        }, minLoadingTime);
      } else {
        // other events: update and optionally check completion
        const u = session?.user ?? null;
        setUser(u);
        if (u) await checkUserProfileCompletion(u);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch jobs when user goes to the local "search-jobs" page inside Landing
  useEffect(() => {
    if (user && currentPage === 'search-jobs') {
      fetchJobs();
    }
  }, [user, currentPage]);

  // ----------------- Helpers -----------------
  const checkUserProfileCompletion = async (user: User) => {
    const userType = user.user_metadata?.user_type;

    if (userType === 'job_seeker') {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !profile) {
          setUserProfileComplete(false);
          return;
        }
        setUserProfileComplete(true);
      } catch (e) {
        console.error('Error checking profile completion:', e);
        setUserProfileComplete(false);
      }
    } else if (userType === 'company') {
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || !company) {
          setUserProfileComplete(false);
          setCompanyData(null);
        } else {
          setUserProfileComplete(true);
          setCompanyData(company);
        }
      } catch (e) {
        console.error('Error checking company profile completion:', e);
        setUserProfileComplete(false);
        setCompanyData(null);
      }
    }
  };

  const handleProfileComplete = () => {
    setUserProfileComplete(true);
    setTempSignupData(null);
  };

  const handleCompanyProfileUpdate = () => {
    if (user) checkUserProfileCompletion(user);
  };

  const handleContinueSignup = (signupData: SignupData) => {
    setTempSignupData(signupData);
    setIsSignupModalOpen(false);
    setCurrentPage('complete-profile');
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data || []);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setJobsLoading(false);
    }
  };

  async function routeByRole(userId: string) {
    const type = await getUserType(userId);
    if (type === 'company') {
      if (await isCompanyProfileComplete(userId)) {
        navigate('/company/profile', { replace: true });
      } else {
        navigate('/company/complete', { replace: true });
      }
      return;
    }
    if (type === 'job_seeker') {
      if (await isSeekerProfileComplete(userId)) {
        navigate('/seeker/profile', { replace: true });
      } else {
        navigate('/seeker/complete', { replace: true });
      }
      return;
    }
    navigate('/', { replace: true });
  }

  // Header / UI handlers used by the Landing view
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Logout error (local session cleared):', e);
    }
  };

  const handleSearchJobsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentJobIndex(0);
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
    if (!jobs.length) return;
    // move index
    if (currentJobIndex < jobs.length - 1) {
      setCurrentJobIndex((i) => i + 1);
    } else {
      setCurrentJobIndex(0);
    }
    // reset exit anim
    setTimeout(() => setExitDirection(null), 100);
  };

  const handleActionButton = (action: 'reject' | 'approve') => {
    setExitDirection(action === 'reject' ? 'left' : 'right');
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => handleSwipe(action === 'reject' ? 'left' : 'right'), 10);
  };

  const handleJobCardClick = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailsModalOpen(true);
  };

  // ----------------- Loading Screen -----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <img
              src="/talent_book_logo_draft_3 copy copy.png"
              alt="TalentBook Logo"
              className="h-16 w-auto mx-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Loader2 className="w-6 h-6 text-[#FFC107] animate-spin" />
            <span className="text-white text-lg font-medium">Loading TalentBook...</span>
          </div>
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-red-600 to-[#FFC107] rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
      </div>
    );
  }

  // ----------------- Single return with Routes -----------------
  return (
    <>
      <Routes>
        {/* Landing / marketing (kept as an inner component so we don't lose your UI) */}
        <Route
          path="/"
          element={
            <LandingView
              // state
              user={user}
              tempSignupData={tempSignupData}
              currentPage={currentPage}
              userProfileComplete={userProfileComplete}
              companyData={companyData}
              jobs={jobs}
              jobsLoading={jobsLoading}
              currentJobIndex={currentJobIndex}
              exitDirection={exitDirection}
              placeholderText={placeholderText}
              showCursor={showCursor}
              // handlers
              onLogoClick={handleLogoClick}
              onSearchJobsClick={handleSearchJobsClick}
              onUserNameClick={handleUserNameClick}
              onSignOut={handleSignOut}
              onFetchJobs={fetchJobs}
              onActionButton={handleActionButton}
              onJobCardClick={handleJobCardClick}
              onCompanyUpdated={handleCompanyProfileUpdate}
              onProfileComplete={handleProfileComplete}
              // modal toggles
              openLogin={() => setIsLoginModalOpen(true)}
              openSignup={() => setIsSignupModalOpen(true)}
              openPrivacy={() => setIsPrivacyTermsModalOpen(true)}
            />
          }
        />

        {/* COMPANY */}
        <Route
          path="/company/profile"
          element={
            <ProtectedRoute>
              <CompanyProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/complete"
          element={
            <ProtectedRoute>
              <CompanyProfileCompletion />
            </ProtectedRoute>
          }
        />

        {/* SEEKER */}
        <Route
          path="/seeker/profile"
          element={
            <ProtectedRoute>
              <UserProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seeker/complete"
          element={
            <ProtectedRoute>
              <JobSeekerProfileCompletion />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<div className="p-6 text-white">Not Found</div>} />
      </Routes>

      {/* Global modals kept outside routes so they work anywhere */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => setIsLoginModalOpen(true)}
        onContinueSignup={handleContinueSignup}
        onOpenPrivacyTerms={() => setIsPrivacyTermsModalOpen(true)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => setIsSignupModalOpen(true)}
      />

      <JobDetailsModal
        isOpen={isJobDetailsModalOpen}
        onClose={() => setIsJobDetailsModalOpen(false)}
        job={selectedJob}
        userId={user?.id || null}
      />

      <PrivacyTermsModal
        isOpen={isPrivacyTermsModalOpen}
        onClose={() => setIsPrivacyTermsModalOpen(false)}
      />
    </>
  );
}

// ----------------- LandingView (moved from your second return) -----------------
function LandingView(props: {
  // state
  user: import('@supabase/supabase-js').User | null;
  tempSignupData: SignupData | null;
  currentPage: 'home' | 'search-jobs' | 'complete-profile' | 'user-profile';
  userProfileComplete: boolean;
  companyData: CompanyData | null;
  jobs: Job[];
  jobsLoading: boolean;
  currentJobIndex: number;
  exitDirection: 'left' | 'right' | null;
  placeholderText: string;
  showCursor: boolean;
  // handlers
  onLogoClick: (e: React.MouseEvent) => void;
  onSearchJobsClick: (e: React.MouseEvent) => void;
  onUserNameClick: (e: React.MouseEvent) => void;
  onSignOut: () => Promise<void>;
  onFetchJobs: () => Promise<void>;
  onActionButton: (action: 'reject' | 'approve') => void;
  onJobCardClick: (job: Job) => void;
  onCompanyUpdated: () => void;
  onProfileComplete: () => void;
  // modal toggles
  openLogin: () => void;
  openSignup: () => void;
  openPrivacy: () => void;
}) {
  const {
    user,
    tempSignupData,
    currentPage,
    userProfileComplete,
    companyData,
    jobs,
    jobsLoading,
    currentJobIndex,
    exitDirection,
    placeholderText,
    showCursor,
    onLogoClick,
    onSearchJobsClick,
    onUserNameClick,
    onSignOut,
    onFetchJobs,
    onActionButton,
    onJobCardClick,
    onCompanyUpdated,
    onProfileComplete,
    openLogin,
    openSignup,
    openPrivacy,
  } = props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Navigation Header */}
      <header className="relative z-10">
        <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <button onClick={onLogoClick} className="focus:outline-none">
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
            {user && user.user_metadata?.user_type === 'job_seeker' && (
              <a
                href="#search-jobs"
                onClick={onSearchJobsClick}
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
                  onClick={onUserNameClick}
                  className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  Welcome, {user.user_metadata?.full_name || user.email}!
                </button>
                <button
                  onClick={onSignOut}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button onClick={openLogin} className="text-gray-300 hover:text-white transition-colors duration-200 font-medium">
                  Log In
                </button>
                <button
                  onClick={openSignup}
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
          {user && user.user_metadata?.user_type === 'job_seeker' ? (
            <div className="flex items-center justify-center">
              <a
                href="#search-jobs"
                onClick={onSearchJobsClick}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium flex items-center space-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
              >
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </a>
            </div>
          ) : !user ? (
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
          ) : null}
        </div>
      </header>

      {/* User Profile View */}
      {user && userProfileComplete && currentPage === 'user-profile' && (
        <>
          {user.user_metadata?.user_type === 'job_seeker' && <UserProfileView onSignOut={onSignOut} />}
          {user.user_metadata?.user_type === 'company' && companyData && (
            <CompanyProfileView company={companyData} onUpdateSuccess={onCompanyUpdated} onSignOut={onSignOut} />
          )}
        </>
      )}

      {/* Job Seeker Profile Completion */}
      {tempSignupData && tempSignupData.userType === 'job_seeker' && (
        <JobSeekerProfileCompletion signupData={tempSignupData} onProfileComplete={onProfileComplete} />
      )}

      {/* Company Profile Completion */}
      {tempSignupData && tempSignupData.userType === 'company' && (
        <CompanyProfileCompletion signupData={tempSignupData} onProfileComplete={onProfileComplete} />
      )}

      {/* Job Search Page */}
      {user && userProfileComplete && currentPage === 'search-jobs' && (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-8 px-4">
          <div className="max-w-md mx-auto">
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
                      <h3 className="text-2xl font-bold text-white mb-4">No jobs available</h3>
                      <p className="text-gray-300 mb-6">Check back later for new opportunities.</p>
                      <button onClick={onFetchJobs} className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-200">
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
                      logo: jobs[currentJobIndex].company_logo || '',
                    }}
                    onSwipe={() => {}}
                    onCardClick={() => onJobCardClick(jobs[currentJobIndex])}
                    exitDirection={exitDirection}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-4">No more jobs!</h3>
                      <p className="text-gray-300 mb-6">You've seen all available positions.</p>
                      <button onClick={() => window.location.reload()} className="bg-[#FFC107] hover:bg-[#FFB300] text-black px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                        Start Over
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {!jobsLoading && jobs.length > 0 && currentJobIndex < jobs.length && (
              <div className="flex justify-center space-x-12 mt-2">
                <button
                  onClick={() => onActionButton('reject')}
                  className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border-2 border-red-500/40 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-red-500/40 hover:to-red-600/40 hover:border-red-500/70 hover:scale-110 transition-all duration-300 group shadow-lg shadow-red-500/20"
                >
                  <X className="w-8 h-8 text-red-400 group-hover:text-red-300 transition-colors duration-200" />
                </button>

                <button
                  onClick={() => onActionButton('approve')}
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
            <div className="pt-6 sm:pt-12 lg:pt-16 pb-20">
              <div className="inline-flex items-center bg-gradient-to-r from-red-600/20 to-amber-500/20 rounded-full px-4 py-2 mb-8 border border-red-600/30">
                <Star className="w-4 h-4 text-amber-400 mr-2" />
                <span className="text-[#FFC107] text-sm font-medium">Trusted by 10,000+ professionals</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight font-poppins">
                <JobCandidateAnimation />
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                Swipe and match with your perfect job or candidate.
              </p>

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

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFC107]/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-red-600/5 to-amber-500/5 rounded-full blur-3xl"></div>
          </div>
        </main>
      )}

      {/* About */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <section id="about" className="relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 py-16 lg:py-24">
          {/* ... keep your existing About markup ... */}
        </section>
      )}

      {/* Pricing */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <section id="pricing" className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 -mt-8">
          <Pricing
            title="Choose Your Plan"
            description="Find the perfect plan for your needs. Whether you're a job seeker or employer, we have options that scale with you."
            /* ... keep your plans array as you had it ... */
            plans={[
              // (unchanged) your four plan objects
            ]}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl"></div>
          </div>
        </section>
      )}

      {/* Contact */}
      {!user && !tempSignupData && currentPage === 'home' && (
        <section id="contact" className="relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 py-16 lg:py-24">
          {/* ... keep your existing Contact markup ... */}
        </section>
      )}

      {/* Footer */}
      {currentPage === 'home' && (
        <footer className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-sm">© 2025 TalentBook. All rights reserved.</span>
              </div>
              <div className="flex items-center space-x-6">
                <a
                  href="/privacy-terms"
                  onClick={(e) => {
                    e.preventDefault();
                    openPrivacy();
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
    </div>
  );
}
