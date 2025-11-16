import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getDashboard, addProblems, markProblemComplete } from '../services/api';
import TodayProblems from './TodayProblems';
import RepetitionSection from './RepetitionSection';
import BacklogSection from './BacklogSection';
import AllProblems from './AllProblems';
import Statistics from './Statistics';
import ProgressCalendar from './ProgressCalendar';
import PracticePlan from './PracticePlan';
import QuickStats from './QuickStats';
import ProblemRecommendations from './ProblemRecommendations';
import DailyMotivation from './DailyMotivation';
import QuickTips from './QuickTips';
import { 
  HiOutlineBookOpen,
  HiOutlineCalendar,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBar,
  HiOutlineSparkles,
  HiOutlineBars3,
  HiOutlineXMark
} from 'react-icons/hi2';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('daily'); // 'daily', 'all', 'stats', 'plan'
  const [refreshKey, setRefreshKey] = useState(0); // For calendar refresh
  const [selectedDate, setSelectedDate] = useState(null); // For date navigation from calendar
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalendarCardOpen, setIsCalendarCardOpen] = useState(false);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
      console.error('Error fetching dashboard:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddProblems = async (problemNumbers, topic, difficulty, notes = '', problemSlug = '', problemTitle = '') => {
    try {
      const response = await addProblems(problemNumbers, topic, difficulty, notes, problemSlug, problemTitle);
      await fetchDashboard(true); // Refresh dashboard silently
      setRefreshKey(prev => prev + 1); // Trigger calendar refresh
      return response; // Return response so component can check for duplicates
    } catch (err) {
      throw err; // Let the component handle the error
    }
  };

  const handleMarkComplete = async (problemId) => {
    try {
      // TEMPORARY: Handle mock data (IDs starting with 'temp-')
      if (problemId.startsWith('temp-')) {
        // Just update local state for mock data
        setDashboardData(prev => ({
          ...prev,
          repetitionProblems: prev.repetitionProblems.map(p => 
            p.id === problemId ? { ...p, isCompleted: !p.isCompleted } : p
          )
        }));
        toast.success('Problem marked as complete! 🎉');
        return;
      }
      
      await markProblemComplete(problemId);
      toast.success('Problem marked as complete! 🎉');
      await fetchDashboard(true); // Refresh dashboard silently
      setRefreshKey(prev => prev + 1); // Trigger calendar refresh
    } catch (err) {
      console.error('Error marking problem complete:', err);
      toast.error('Failed to mark problem as complete. Please try again.');
    }
  };

  if (loading) {
    // Full-viewport overlay to ensure no background shows through
    return (
      <div className="fixed inset-0 z-50 bg-dark-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            {/* Base ring */}
            <div className="absolute inset-0 rounded-full border-4 border-indigo-700/20" />
            {/* Spinning gradient arc */}
            <div className="absolute inset-0 rounded-full border-t-4 border-indigo-400 animate-spin" />
            {/* Orbiting glow dot */}
            <div
              className="absolute left-1/2 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              style={{ transformOrigin: '50% 100%', animation: 'spin 2s linear infinite' }}
            />
          </div>
          <div className="font-extrabold text-lg bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            MyLeetPlan
          </div>
          <p className="text-sm text-dark-text-secondary">Preparing your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="bg-dark-bg-tertiary rounded-lg shadow-lg p-6 max-w-md border border-dark-border">
          <div className="text-red-400 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mb-2 text-dark-text">Error Loading Dashboard</h2>
            <p className="text-dark-text-secondary mb-4">{error}</p>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Full Width Navbar */}
      <div className="w-full bg-dark-bg-secondary shadow-lg sticky top-0 z-10 border-b border-dark-border">
        <div className="w-full px-2 sm:px-3 lg:px-4 py-2.5">
          <div className="flex items-center justify-between lg:justify-start gap-3 lg:gap-4 min-h-[60px] w-full">
            {/* Website Name - Left */}
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="bg-dark-bg-tertiary rounded-lg p-2 shadow-lg border border-dark-border">
                <HiOutlineBookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  MyLeetPlan
                </h1>
                <p className="text-xs text-dark-text-secondary mt-0.5 hidden sm:block">Your Daily Practice Companion</p>
              </div>
            </div>

            {/* Mobile Hamburger - Right on small screens */}
            <button
              type="button"
              aria-label="Open navigation menu"
              className="ml-auto inline-flex items-center justify-center rounded-lg p-2 text-dark-text hover:text-white hover:bg-dark-bg-tertiary border border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <HiOutlineBars3 className="w-6 h-6" />
            </button>

            {/* Navigation Tabs - Centered in navbar */}
            <div className="hidden sm:flex flex-1 justify-center items-center">
              <div className="inline-flex bg-dark-bg-tertiary rounded-xl p-1 gap-1 shadow-inner border border-dark-border items-center">
                    <button
                      onClick={() => setView('daily')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        view === 'daily'
                          ? 'bg-dark-bg-hover shadow-md border border-dark-border-light font-semibold'
                          : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <HiOutlineCalendar className={`w-4 h-4 ${view === 'daily' ? 'text-blue-500' : 'text-inherit'}`} />
                        <span className={view === 'daily' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>
                          Daily
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => setView('all')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        view === 'all'
                          ? 'bg-dark-bg-hover shadow-md border border-dark-border-light font-semibold'
                          : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <HiOutlineClipboardDocumentList className={`w-4 h-4 ${view === 'all' ? 'text-blue-500' : 'text-inherit'}`} />
                        <span className={view === 'all' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>
                          All Problems
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => setView('stats')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        view === 'stats'
                          ? 'bg-dark-bg-hover shadow-md border border-dark-border-light font-semibold'
                          : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <HiOutlineChartBar className={`w-4 h-4 ${view === 'stats' ? 'text-blue-500' : 'text-inherit'}`} />
                        <span className={view === 'stats' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>
                          Statistics
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => setView('plan')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                        view === 'plan'
                          ? 'bg-dark-bg-hover shadow-md border border-dark-border-light font-semibold'
                          : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-hover'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <HiOutlineSparkles className={`w-4 h-4 ${view === 'plan' ? 'text-blue-500' : 'text-inherit'}`} />
                        <span className={view === 'plan' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>
                          Practice Plan
                        </span>
                      </span>
                    </button>
                  </div>
            </div>

            {/* Date - Right */}
            <div className="hidden lg:block flex-shrink-0">
              <div className="flex items-center gap-3 text-dark-text">
                <div className="bg-dark-bg-tertiary rounded-lg p-2 shadow-lg border border-dark-border">
                  <HiOutlineCalendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="text-base sm:text-lg font-bold leading-tight text-dark-text">
                    {(() => {
                      // Parse date string (YYYY-MM-DD) as local date, not UTC
                      const [year, month, day] = dashboardData.date.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      const today = new Date();
                      const isToday = date.toDateString() === today.toDateString();
                      
                      if (isToday) {
                        // Format time as 12-hour format hh:mm:ss AM/PM
                        let hours = currentTime.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12; // the hour '0' should be '12'
                        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
                        const seconds = currentTime.getSeconds().toString().padStart(2, '0');
                        const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
                        
                        return (
                          <span className="flex items-baseline gap-2">
                            <span>Today</span>
                            <span className="text-indigo-400 font-mono text-sm sm:text-base font-normal">{timeString}</span>
                          </span>
                        );
                      }
                      
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });
                    })()}
                  </p>
                  <p className="text-xs sm:text-sm text-dark-text-secondary font-medium leading-tight mt-0.5">
                    {(() => {
                      const [year, month, day] = dashboardData.date.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      });
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar & Backdrop (animated) */}
      {/* Backdrop (always mounted for smooth opacity transition) */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />
      {/* Sidebar Panel (always mounted for smooth slide transition) */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 w-72 max-w-[80vw] bg-dark-bg-secondary border-l border-dark-border shadow-2xl transform transition-transform duration-300 ease-out sm:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-dark-border">
            <div className="flex items-center gap-2.5">
              <div className="bg-dark-bg-tertiary rounded-lg p-2 shadow-lg border border-dark-border">
                <HiOutlineBookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                MyLeetPlan
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="inline-flex items-center justify-center rounded-lg p-2 text-dark-text hover:text-white hover:bg-dark-bg-tertiary border border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-3 space-y-2">
            <button
              onClick={() => { setView('daily'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 border ${view === 'daily' ? 'bg-dark-bg-hover border-dark-border-light' : 'border-dark-border hover:bg-dark-bg-hover text-dark-text-secondary hover:text-dark-text'}`}
            >
              <HiOutlineCalendar className={`w-5 h-5 ${view === 'daily' ? 'text-blue-500' : ''}`} />
              <span className={view === 'daily' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>Daily</span>
            </button>
            <button
              onClick={() => { setView('all'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 border ${view === 'all' ? 'bg-dark-bg-hover border-dark-border-light' : 'border-dark-border hover:bg-dark-bg-hover text-dark-text-secondary hover:text-dark-text'}`}
            >
              <HiOutlineClipboardDocumentList className={`w-5 h-5 ${view === 'all' ? 'text-blue-500' : ''}`} />
              <span className={view === 'all' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>All Problems</span>
            </button>
            <button
              onClick={() => { setView('stats'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 border ${view === 'stats' ? 'bg-dark-bg-hover border-dark-border-light' : 'border-dark-border hover:bg-dark-bg-hover text-dark-text-secondary hover:text-dark-text'}`}
            >
              <HiOutlineChartBar className={`w-5 h-5 ${view === 'stats' ? 'text-blue-500' : ''}`} />
              <span className={view === 'stats' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>Statistics</span>
            </button>
            <button
              onClick={() => { setView('plan'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 border ${view === 'plan' ? 'bg-dark-bg-hover border-dark-border-light' : 'border-dark-border hover:bg-dark-bg-hover text-dark-text-secondary hover:text-dark-text'}`}
            >
              <HiOutlineSparkles className={`w-5 h-5 ${view === 'plan' ? 'text-blue-500' : ''}`} />
              <span className={view === 'plan' ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent' : ''}>Practice Plan</span>
            </button>
          </nav>
          {/* Date/Time - Footer of Sidebar */}
          <div className="mt-auto px-3 pt-2 pb-3 border-t border-dark-border">
            <div className="flex items-center gap-3 text-dark-text">
              <div className="bg-dark-bg-tertiary rounded-lg p-2 shadow-lg border border-dark-border">
                <HiOutlineCalendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold leading-tight text-dark-text">
                  {(() => {
                    const [year, month, day] = dashboardData.date.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    const today = new Date();
                    const isToday = date.toDateString() === today.toDateString();
                    
                    if (isToday) {
                      let hours = currentTime.getHours();
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      hours = hours % 12;
                      hours = hours ? hours : 12;
                      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
                      const seconds = currentTime.getSeconds().toString().padStart(2, '0');
                      const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
                      return (
                        <span className="flex items-baseline gap-2">
                          <span>Today</span>
                          <span className="text-indigo-400 font-mono text-sm font-normal">{timeString}</span>
                        </span>
                      );
                    }
                    
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  })()}
                </p>
                <p className="text-xs text-dark-text-secondary font-medium leading-tight mt-0.5">
                  {(() => {
                    const [year, month, day] = dashboardData.date.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-2 sm:px-3 md:px-4 py-3 sm:py-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 max-w-none md:max-w-[1920px] md:mx-auto h-full w-full">
          {/* Left Sidebar - Quick Stats */}
          <div className="lg:col-span-2 hidden lg:block h-full overflow-y-auto pr-2 custom-scrollbar">
            <QuickStats refreshKey={refreshKey} />
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-9 lg:col-span-8 space-y-4 h-full overflow-y-auto pr-0 md:pr-2 custom-scrollbar">

            {view === 'stats' ? (
              <Statistics />
            ) : view === 'plan' ? (
              <PracticePlan onUpdate={fetchDashboard} />
            ) : view === 'all' ? (
              <AllProblems 
                onSwitchToDaily={() => setView('daily')}
                onUpdate={() => setRefreshKey(prev => prev + 1)}
                selectedDate={selectedDate}
              />
            ) : (
              <>
                {/* Problem Recommendations (Priority 0 - Highest) */}
                <ProblemRecommendations
                  onUpdate={() => {
                    fetchDashboard(true); // silent
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Repetition Section (Priority 1) */}
                <RepetitionSection
                  topic={dashboardData.repetitionTopic}
                  problems={dashboardData.repetitionProblems}
                  onMarkComplete={handleMarkComplete}
                  onUpdate={() => {
                    fetchDashboard(true);
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Today's Problems Section (Priority 2) - Add new problems */}
                <TodayProblems
                  anchorTopic={dashboardData.anchorTopic}
                  onAddProblems={handleAddProblems}
                  onUpdate={() => {
                    fetchDashboard(true);
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Backlog Section (Priority 3) */}
                {dashboardData && dashboardData.backlog && dashboardData.backlog.length > 0 && (
                  <BacklogSection
                    problems={dashboardData.backlog}
                    onMarkComplete={handleMarkComplete}
                    onUpdate={() => {
                      fetchDashboard(true);
                      setRefreshKey(prev => prev + 1);
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Calendar Sidebar */}
          <div className="md:col-span-3 lg:col-span-2 space-y-3 h-full overflow-y-auto custom-scrollbar hidden md:block">
            <ProgressCalendar 
              key={refreshKey}
              onDateClick={(dateStr) => {
                setSelectedDate(dateStr);
                setView('all');
              }}
            />
            <DailyMotivation />
            <QuickTips topic={dashboardData?.anchorTopic} />
          </div>
        </div>
      </div>

      {/* Mobile-only Calendar Bubble (FAB) */}
      <button
        type="button"
        aria-label="Open calendar"
        className="fixed bottom-4 right-4 md:hidden z-20 rounded-full p-4 bg-indigo-600 text-white shadow-lg border border-dark-border hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        onClick={() => setIsCalendarCardOpen(true)}
      >
        <HiOutlineCalendar className="w-6 h-6" />
      </button>

      {/* Mobile Calendar Card Overlay */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-opacity duration-200 ${isCalendarCardOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isCalendarCardOpen}
        onClick={() => setIsCalendarCardOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 md:hidden transform transition-transform duration-300 ease-out ${isCalendarCardOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Calendar card"
      >
        <div className="mx-2 mb-2 rounded-2xl bg-dark-bg-secondary border border-dark-border shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <div className="bg-dark-bg-tertiary rounded-lg p-2 shadow-lg border border-dark-border">
                <HiOutlineCalendar className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-dark-text">Progress Calendar</h3>
            </div>
            <button
              type="button"
              aria-label="Close calendar"
              className="inline-flex items-center justify-center rounded-lg p-2 text-dark-text hover:text-white hover:bg-dark-bg-tertiary border border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setIsCalendarCardOpen(false)}
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <ProgressCalendar 
              key={refreshKey}
              onDateClick={(dateStr) => {
                setSelectedDate(dateStr);
                setView('all');
                setIsCalendarCardOpen(false);
              }}
            />
            <DailyMotivation />
            <QuickTips topic={dashboardData?.anchorTopic} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

