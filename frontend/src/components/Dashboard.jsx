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
  HiOutlineSparkles
} from 'react-icons/hi2';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('daily'); // 'daily', 'all', 'stats', 'plan'
  const [refreshKey, setRefreshKey] = useState(0); // For calendar refresh
  const [selectedDate, setSelectedDate] = useState(null); // For date navigation from calendar
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
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
      await fetchDashboard(); // Refresh dashboard
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
      await fetchDashboard(); // Refresh dashboard
      setRefreshKey(prev => prev + 1); // Trigger calendar refresh
    } catch (err) {
      console.error('Error marking problem complete:', err);
      toast.error('Failed to mark problem as complete. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 min-h-[60px]">
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

            {/* Navigation Tabs - Centered in navbar */}
            <div className="flex-1 flex justify-center items-center">
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
            <div className="flex-shrink-0">
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

      {/* Main Content */}
      <div className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 max-w-[1920px] mx-auto h-full">
          {/* Left Sidebar - Quick Stats */}
          <div className="lg:col-span-2 hidden lg:block h-full overflow-y-auto pr-2 custom-scrollbar">
            <QuickStats refreshKey={refreshKey} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">

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
                    fetchDashboard();
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Repetition Section (Priority 1) */}
                <RepetitionSection
                  topic={dashboardData.repetitionTopic}
                  problems={dashboardData.repetitionProblems}
                  onMarkComplete={handleMarkComplete}
                  onUpdate={() => {
                    fetchDashboard();
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Today's Problems Section (Priority 2) - Add new problems */}
                <TodayProblems
                  anchorTopic={dashboardData.anchorTopic}
                  onAddProblems={handleAddProblems}
                  onUpdate={() => {
                    fetchDashboard();
                    setRefreshKey(prev => prev + 1);
                  }}
                />

                {/* Backlog Section (Priority 3) */}
                {dashboardData && dashboardData.backlog && dashboardData.backlog.length > 0 && (
                  <BacklogSection
                    problems={dashboardData.backlog}
                    onMarkComplete={handleMarkComplete}
                    onUpdate={() => {
                      fetchDashboard();
                      setRefreshKey(prev => prev + 1);
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Calendar Sidebar */}
          <div className="lg:col-span-2 space-y-3 h-full overflow-y-auto custom-scrollbar">
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
    </div>
  );
}

export default Dashboard;

