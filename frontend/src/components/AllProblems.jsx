import { useState, useEffect, useRef } from 'react';
import { getAllProblems, getDashboard, getAllTopics } from '../services/api';
import ProblemItemEnhanced from './ProblemItemEnhanced';
import { HiOutlineCalendar, HiOutlineFlag, HiOutlineArrowPath, HiOutlineClock, HiOutlineClipboardDocumentList, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

function AllProblems({ onSwitchToDaily, onUpdate, selectedDate }) {
  const [allProblemsData, setAllProblemsData] = useState([]); // All problems from API
  const [problems, setProblems] = useState([]); // Filtered problems to display
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    completed: undefined,
    topic: ''
  });
  const [repeatedFilter, setRepeatedFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const dateRefs = useRef({});

  // Fetch problems from API (only when filters change, not on search)
  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await getAllProblems(filters);
      setAllProblemsData(data);
    } catch (error) {
      console.error('Error fetching problems:', error);
      alert('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  // Filter problems based on search query and filters (client-side)
  useEffect(() => {
    let filtered = [...allProblemsData];

    // Apply repeated filter (show only problems that have been scheduled for repetition)
    if (repeatedFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => {
        if (!p.repetitionDate) return false;
        const repetitionDate = new Date(p.repetitionDate);
        repetitionDate.setHours(0, 0, 0, 0);
        return repetitionDate <= today; // repetitionDate is today or in the past
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.problemNumber.toLowerCase().includes(query) ||
        (p.problemTitle && p.problemTitle.toLowerCase().includes(query)) ||
        p.topic.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query))
      );
    }

    setProblems(filtered);
  }, [allProblemsData, searchQuery, repeatedFilter]);

  // Note: We use allProblemsData for stats, so we don't need a separate fetch

  const fetchDashboard = async () => {
    try {
      const data = await getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const topics = await getAllTopics();
      setAvailableTopics(topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      // Fallback to standard topics
      setAvailableTopics([
        'Arrays & Hashing',
        'Two Pointers',
        'Sliding Window',
        'Binary Search',
        'Stacks',
        'Trees (Basics)',
        'Linked Lists',
        'Recursion',
        'Backtracking',
        'DFS',
        'Graphs',
        'Strings',
        'Heaps (Priority Queue)',
        'Greedy'
      ]);
    }
  };

  // Fetch from API only when filters change (not on search)
  useEffect(() => {
    fetchProblems();
    fetchDashboard();
    fetchTopics();
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchDashboard();
    fetchTopics();
  }, []);

  // Scroll to selected date when it changes
  useEffect(() => {
    if (selectedDate && dateRefs.current[selectedDate]) {
      // Wait a bit for the view to render
      setTimeout(() => {
        dateRefs.current[selectedDate]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Clear selection after scrolling (optional - keeps highlight visible)
        // setTimeout(() => setSelectedDate(null), 2000);
      }, 300);
    }
  }, [selectedDate]);

  // Refresh dashboard and topics when problems are updated
  useEffect(() => {
    if (!loading) {
      fetchDashboard();
      fetchTopics(); // Refresh topics to include any new custom topics
    }
  }, [allProblemsData.length]);

  // Calculate statistics
  const stats = {
    total: allProblemsData.length,
    completed: allProblemsData.filter(p => p.isCompleted).length,
    pending: allProblemsData.filter(p => !p.isCompleted).length,
    todayRepetition: dashboardData?.repetitionProblems?.length || 0,
    // Check completion by matching problem IDs with all problems
    todayRepetitionCompleted: dashboardData?.repetitionProblems?.filter(repProblem => 
      allProblemsData.find(p => p._id === repProblem.id && p.isCompleted)
    )?.length || 0,
    backlog: dashboardData?.backlog?.length || 0,
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-dark-text-secondary">Loading problems...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily View Preview */}
      {dashboardData && (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg shadow-sm p-3 sm:p-4 text-white border border-indigo-700/30">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1.5 flex items-center gap-2">
                <HiOutlineCalendar className="w-6 h-6" />
                <span>Today's Overview</span>
              </h2>
              <p className="text-indigo-200">
                {(() => {
                  // Parse date string (YYYY-MM-DD) as local date, not UTC
                  const [year, month, day] = dashboardData.date.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                })()}
              </p>
            </div>
            {onSwitchToDaily && (
              <button
                onClick={onSwitchToDaily}
                className="px-4 py-2 bg-dark-bg-tertiary text-indigo-300 rounded-lg hover:bg-dark-bg-hover font-medium transition border border-indigo-700/30"
              >
                Go to Daily View →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Anchor Topic */}
            <div className="bg-dark-bg-secondary/30 backdrop-blur-sm rounded-lg p-3 border border-indigo-700/20">
              <div className="text-sm text-indigo-200 mb-1 flex items-center gap-1.5">
                <HiOutlineFlag className="w-4 h-4" />
                <span>Anchor Topic</span>
              </div>
              <div className="text-lg font-semibold">{dashboardData.anchorTopic}</div>
              <div className="text-xs text-indigo-300 mt-1.5">Learn 2 new problems</div>
            </div>

            {/* Repetition Topic */}
            <div className="bg-dark-bg-secondary/30 backdrop-blur-sm rounded-lg p-3 border border-indigo-700/20">
              <div className="text-sm text-indigo-200 mb-1 flex items-center gap-1.5">
                <HiOutlineArrowPath className="w-4 h-4" />
                <span>Repetition Topic</span>
              </div>
              <div className="text-lg font-semibold">{dashboardData.repetitionTopic}</div>
              <div className="text-xs text-indigo-300 mt-1.5">
                {stats.todayRepetitionCompleted}/{stats.todayRepetition} completed
              </div>
            </div>

            {/* Backlog */}
            <div 
              className="bg-dark-bg-secondary/30 backdrop-blur-sm rounded-lg p-3 border border-indigo-700/20 cursor-pointer hover:bg-dark-bg-secondary/40 transition-colors"
              onClick={() => {
                if (onSwitchToDaily) {
                  onSwitchToDaily();
                  // Scroll to backlog section after view switch completes
                  setTimeout(() => {
                    const scrollToBacklog = () => {
                      const backlogSection = document.getElementById('backlog-section');
                      if (backlogSection) {
                        backlogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        // Retry if element not found yet
                        setTimeout(scrollToBacklog, 50);
                      }
                    };
                    scrollToBacklog();
                  }, 200);
                }
              }}
            >
              <div className="text-sm text-indigo-200 mb-1 flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4" />
                <span>Backlog</span>
              </div>
              <div className="text-lg font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
                {stats.backlog} problems
              </div>
              <div className="text-xs text-indigo-300 mt-1.5">Click to view →</div>
            </div>
          </div>

          {/* Progress Bar */}
          {stats.todayRepetition > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-indigo-200">Today's Repetition Progress</span>
                <span className="text-white font-semibold">
                  {stats.todayRepetitionCompleted}/{stats.todayRepetition}
                </span>
              </div>
              <div className="w-full bg-dark-bg-secondary/30 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-300"
                  style={{
                    width: `${(stats.todayRepetitionCompleted / stats.todayRepetition) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Problems Section */}
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-text flex items-center gap-2">
            <HiOutlineClipboardDocumentList className="w-6 h-6" />
            <span>All Problems</span>
          </h2>
          <div className="flex gap-3 text-sm">
            <div className="text-dark-text-secondary">
              <span className="font-semibold text-dark-text">{stats.total}</span> total
            </div>
            <div className="text-green-400">
              <span className="font-semibold">{stats.completed}</span> completed
            </div>
            <div className="text-orange-400">
              <span className="font-semibold">{stats.pending}</span> pending
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-muted" />
            <input
              type="text"
              placeholder="Search by problem number, topic, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">
            Filter by Status
          </label>
          <select
            value={filters.completed || ''}
            onChange={(e) => handleFilterChange('completed', e.target.value)}
            className="w-full px-4 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            <option value="false">Not Completed</option>
            <option value="true">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">
            Filter by Type
          </label>
          <select
            value={repeatedFilter ? 'true' : ''}
            onChange={(e) => setRepeatedFilter(e.target.value === 'true')}
            className="w-full px-4 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Problems</option>
            <option value="true">Repeated Problems Only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">
            Filter by Topic
          </label>
          <select
            value={filters.topic || ''}
            onChange={(e) => handleFilterChange('topic', e.target.value)}
            className="w-full px-4 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Topics</option>
            {(() => {
              // Get unique topics from problems that have at least one solved problem
              const topicsWithSolvedProblems = [...new Set(
                allProblemsData
                  .filter(p => p.isCompleted) // Only solved problems
                  .map(p => p.topic) // Get their topics
              )].sort(); // Sort alphabetically
              
              return topicsWithSolvedProblems.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ));
            })()}
          </select>
        </div>
      </div>

      {/* Problems List - Grouped by Date */}
      {problems.length === 0 ? (
        <div className="bg-dark-bg-secondary border border-dark-border rounded-lg p-4 text-center">
          <p className="text-dark-text-secondary text-sm">No problems found matching your filters.</p>
        </div>
      ) : (() => {
        // Group problems by UTC date from database (createdAt preferred; fallback to addedDate)
        const groupedByDate = problems.reduce((acc, problem) => {
          const source = problem.createdAt || problem.addedDate;
          if (!source) return acc;
          const d = new Date(source);
          // Use UTC calendar day so it matches the database date
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const day = String(d.getUTCDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          
          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          acc[dateStr].push(problem);
          return acc;
        }, {});

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

        return (
          <div className="space-y-4">
            {sortedDates.map((dateStr) => {
              const dateProblems = groupedByDate[dateStr];
              // Render header date using local (IST) by constructing from parts
              const [yy, mm, dd] = dateStr.split('-').map(Number);
              const date = new Date(yy, mm - 1, dd);
              const isSelected = selectedDate === dateStr;
              
              return (
                <div
                  key={dateStr}
                  ref={(el) => {
                    if (el) dateRefs.current[dateStr] = el;
                  }}
                  className={`scroll-mt-4 transition-all ${isSelected ? 'ring-2 ring-indigo-500 rounded-lg p-1 -m-1 bg-indigo-900/20' : ''}`}
                >
                  <div className="flex items-center justify-between py-1.5 mb-2 border-b border-dark-border">
                    <h3 className="text-xs sm:text-sm font-medium text-dark-text-secondary">
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <span className="text-xs text-dark-text-muted ml-2">
                      {dateProblems.length} problem{dateProblems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {dateProblems.map((problem) => (
                      <ProblemItemEnhanced
                        key={problem._id}
                        problem={{ ...problem, id: problem._id }}
                        onUpdate={() => {
                          fetchProblems(); // Refresh problems from API
                          fetchDashboard();
                          fetchTopics(); // Refresh topics when problem is updated
                          if (onUpdate) onUpdate(); // Trigger calendar refresh
                        }}
                        showActions={true}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      </div>
    </div>
  );
}

export default AllProblems;

