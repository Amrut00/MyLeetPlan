import { useState, useEffect } from 'react';
import { getStatistics } from '../services/api';
import { HiOutlineFire, HiOutlineCalendar } from 'react-icons/hi2';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-dark-text-secondary">Loading statistics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const difficultyColors = {
    Easy: 'bg-green-500',
    Medium: 'bg-yellow-500',
    Hard: 'bg-red-500'
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4 text-center sm:text-left">
          <div className="text-xs sm:text-sm text-dark-text-secondary mb-1">Total Problems</div>
          <div className="text-2xl sm:text-3xl font-bold text-dark-text">{stats.overview.total}</div>
        </div>
        <div className="bg-green-900/20 rounded-lg shadow-sm p-3 sm:p-4 border border-green-700/30 text-center sm:text-left">
          <div className="text-xs sm:text-sm text-green-300 mb-1">Completed</div>
          <div className="text-xl sm:text-3xl font-bold text-green-400">{stats.overview.completed}</div>
        </div>
        <div className="bg-orange-900/20 rounded-lg shadow-sm p-3 sm:p-4 border border-orange-700/30 text-center sm:text-left">
          <div className="text-xs sm:text-sm text-orange-300 mb-1">Pending</div>
          <div className="text-xl sm:text-3xl font-bold text-orange-400">{stats.overview.pending}</div>
        </div>
        <div className="bg-indigo-900/20 rounded-lg shadow-sm p-3 sm:p-4 border border-indigo-700/30 text-center sm:text-left">
          <div className="text-xs sm:text-sm text-indigo-300 mb-1">Completion Rate</div>
          <div className="text-xl sm:text-3xl font-bold text-indigo-400">{stats.overview.completionRate}%</div>
        </div>
      </div>

      {/* Streak and Weekly Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-lg shadow-sm p-3 sm:p-4 text-white border border-orange-700/30 text-center sm:text-left">
          <div className="text-xs sm:text-sm text-orange-200 mb-1.5 flex items-center gap-1.5">
            <HiOutlineFire className="w-4 h-4" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl sm:text-4xl font-bold mb-1.5">{stats.streak} days</div>
          <div className="text-[11px] sm:text-sm text-orange-200">Keep it up!</div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-lg shadow-sm p-3 sm:p-4 text-white border border-blue-700/30 text-center sm:text-left">
          <div className="text-xs sm:text-sm text-blue-200 mb-1.5 flex items-center gap-1.5">
            <HiOutlineCalendar className="w-4 h-4" />
            <span>This Week</span>
          </div>
          <div className="text-2xl sm:text-4xl font-bold mb-1.5">{stats.thisWeekProblems} problems</div>
          <div className="text-[11px] sm:text-sm text-blue-200">Completed this week</div>
        </div>
      </div>

      {/* By Difficulty */}
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
        <h3 className="text-base sm:text-xl font-bold text-dark-text mb-2.5 sm:mb-3">Problems by Difficulty</h3>
        <div className="space-y-3 sm:space-y-4">
          {['Easy', 'Medium', 'Hard'].map(diff => {
            const data = stats.byDifficulty[diff] || { total: 0, completed: 0, pending: 0 };
            const completionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(0) : 0;
            return (
              <div key={diff}>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${difficultyColors[diff]}`}></div>
                    <span className="font-medium text-dark-text text-sm sm:text-base">{diff}</span>
                    <span className="text-xs sm:text-sm text-dark-text-secondary">
                      ({data.completed}/{data.total} completed)
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-dark-text-secondary">{completionRate}%</span>
                </div>
                <div className="w-full bg-dark-bg-hover rounded-full h-2.5 sm:h-3">
                  <div
                    className={`h-2.5 sm:h-3 rounded-full transition-all duration-500 ${difficultyColors[diff]}`}
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Topic */}
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
        <h3 className="text-base sm:text-xl font-bold text-dark-text mb-2.5 sm:mb-3">Problems by Topic</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {stats.byTopic.map(topic => {
            const completionRate = topic.total > 0 ? ((topic.completed / topic.total) * 100).toFixed(0) : 0;
            return (
              <div key={topic.topic} className="border border-dark-border rounded-lg p-2.5 sm:p-3 bg-dark-bg-secondary">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-dark-text text-sm sm:text-base">{topic.topic}</span>
                  <span className="text-xs sm:text-sm text-dark-text-secondary">
                    {topic.completed}/{topic.total}
                  </span>
                </div>
                <div className="w-full bg-dark-bg-hover rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <div className="text-[11px] sm:text-xs text-dark-text-muted mt-1">{completionRate}% complete</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default Statistics;

