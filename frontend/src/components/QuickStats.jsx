import { useState, useEffect, useRef } from 'react';
import { getStatistics, getDashboard } from '../services/api';
import { HiOutlineChartBar, HiOutlineBolt, HiOutlineFire, HiOutlineCalendar, HiOutlineBookOpen } from 'react-icons/hi2';

function QuickStats({ refreshKey = 0 }) {
  const [stats, setStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Initial load (show skeleton once)
    fetchData(false);

    // Refresh stats periodically and when window regains focus (silent)
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000); // Refresh every 30 seconds

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent refresh when parent signals data changes
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      fetchData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [statsData, dashboard] = await Promise.all([
        getStatistics(),
        getDashboard()
      ]);
      setStats(statsData);
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      if (!silent) {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4 sticky top-3">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-dark-bg-hover rounded w-3/4"></div>
          <div className="h-20 bg-dark-bg-hover rounded"></div>
          <div className="h-20 bg-dark-bg-hover rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats || !dashboardData) return null;

  const todayRepetitionCount = dashboardData.repetitionProblems?.length || 0;
  const todayAddedCount = dashboardData.todayAddedCount || 0;
  const todaySolvedCount = dashboardData.todaySolvedCount || 0;
  const completedRepetitionCount = dashboardData.repetitionProblems?.filter(p => p.isCompleted).length || 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Today's Summary */}
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-lg shadow-sm p-3 sm:p-4 text-white border border-indigo-700/30">
        <h3 className="text-sm font-semibold text-indigo-200 mb-2.5 flex items-center gap-1.5">
          <HiOutlineChartBar className="w-4 h-4" />
          <span>Today's Summary</span>
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-indigo-200">Solved Today</span>
            <span className="text-base font-bold text-green-300">{todaySolvedCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-indigo-200">Repetition Due</span>
            <span className="text-base font-bold">{todayRepetitionCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-indigo-200">Added Today</span>
            <span className="text-base font-bold">{todayAddedCount}</span>
          </div>
          <div className="pt-2 border-t border-indigo-700/30">
            <div className="flex justify-between items-center">
              <span className="text-xs text-indigo-200">Completion</span>
              <span className="text-sm font-semibold">
                {todayRepetitionCount > 0 
                  ? `${Math.round((completedRepetitionCount / todayRepetitionCount) * 100)}%`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-1.5">
          <HiOutlineBolt className="w-4 h-4" />
          <span>Quick Stats</span>
        </h3>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-dark-border">
            <span className="text-xs text-dark-text-secondary">Total Problems</span>
            <span className="text-sm font-bold text-dark-text">{stats.overview.total}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-dark-border">
            <span className="text-xs text-dark-text-secondary">Completed</span>
            <span className="text-sm font-bold text-green-400">{stats.overview.completed}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-dark-border">
            <span className="text-xs text-dark-text-secondary">Pending</span>
            <span className="text-sm font-bold text-orange-400">{stats.overview.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-dark-text-secondary">Completion Rate</span>
            <span className="text-sm font-bold text-indigo-400">{stats.overview.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="bg-gradient-to-br from-orange-600/20 via-red-600/20 to-pink-600/20 rounded-lg shadow-sm p-3 sm:p-4 border border-orange-500/30 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-orange-500/20 rounded-lg">
                <HiOutlineFire className="w-4 h-4 text-orange-400" />
              </div>
              <h3 className="text-sm font-semibold text-dark-text">Current Streak</h3>
            </div>
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {stats.streak}
                </span>
                <span className="text-lg font-semibold text-dark-text-secondary mb-1">days</span>
              </div>
              <p className="text-xs text-dark-text-muted mt-1">
                {stats.streak === 0 
                  ? "Start your streak today!" 
                  : stats.streak === 1 
                  ? "Great start! Keep going!" 
                  : stats.streak < 7
                  ? "Building momentum!" 
                  : stats.streak < 30
                  ? "On fire! Keep it burning!" 
                  : "Incredible dedication! 🔥"}
              </p>
            </div>
          </div>
          
          {stats.streak > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-text-secondary">Best streak</span>
                <span className="text-xs font-semibold text-orange-400">{stats.streak} days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* This Week */}
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-dark-text mb-2.5 flex items-center gap-1.5">
          <HiOutlineCalendar className="w-4 h-4" />
          <span>This Week</span>
        </h3>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-400 mb-1">{stats.thisWeekProblems}</div>
          <p className="text-xs text-dark-text-secondary">problems completed</p>
        </div>
      </div>

      {/* Topics Progress */}
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-dark-text mb-2.5 flex items-center gap-1.5">
          <HiOutlineBookOpen className="w-4 h-4" />
          <span>Top Topics</span>
        </h3>
        <div className="space-y-2">
          {stats.byTopic
            .sort((a, b) => b.total - a.total)
            .slice(0, 3)
            .map(topic => {
              const completionRate = topic.total > 0 ? ((topic.completed / topic.total) * 100).toFixed(0) : 0;
              return (
                <div key={topic.topic} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-dark-text-secondary truncate flex-1 mr-2" title={topic.topic}>
                      {topic.topic}
                    </span>
                    <span className="text-dark-text-muted font-medium">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-dark-bg-hover rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default QuickStats;

