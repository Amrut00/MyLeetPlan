import { useState, useEffect, useRef, useMemo } from 'react';
import { getCalendarData } from '../services/api';
import { HiOutlineCalendar, HiOutlineLightBulb } from 'react-icons/hi2';

// Global cache for calendar data (shared across all instances)
let globalCalendarCache = null;
let globalCalendarCacheTime = null;
const CALENDAR_CACHE_TTL = 25000; // 25 seconds (slightly less than backend cache)

function ProgressCalendar({ onDateClick }) {
  const [calendarData, setCalendarData] = useState(() => {
    // Initialize with cache if available
    return globalCalendarCache || {};
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if cache is stale or missing
    const now = Date.now();
    const hasValidCache = globalCalendarCache && globalCalendarCacheTime && 
                         (now - globalCalendarCacheTime) < CALENDAR_CACHE_TTL;
    return !hasValidCache;
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Create a stable month key for dependency tracking
  const monthKey = useMemo(() => {
    return `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  }, [currentMonth]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // If we have cached data, use it immediately
    if (globalCalendarCache && Object.keys(globalCalendarCache).length > 0) {
      const now = Date.now();
      if (globalCalendarCacheTime && (now - globalCalendarCacheTime) < CALENDAR_CACHE_TTL) {
        setCalendarData(globalCalendarCache);
        setLoading(false);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCalendarData = async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return;
    }
    
    // Check global cache first
    const now = Date.now();
    if (globalCalendarCache && globalCalendarCacheTime && (now - globalCalendarCacheTime) < CALENDAR_CACHE_TTL) {
      if (isMountedRef.current) {
        setCalendarData(globalCalendarCache);
        setLoading(false);
      }
      return;
    }

    try {
      fetchingRef.current = true;
      
      if (isMountedRef.current) {
      setLoading(true);
      }
      
      const data = await getCalendarData();
      
      // Convert array to object for easy lookup
      const dataMap = {};
      if (Array.isArray(data)) {
      data.forEach(item => {
        dataMap[item.date] = item;
      });
      }
      
      // Update global cache first (always, even if component unmounted)
      globalCalendarCache = dataMap;
      globalCalendarCacheTime = now;
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        setCalendarData(dataMap);
        setLoading(false);
      } else {
        // Even if unmounted, we should try to update state in case it remounts quickly
        // Use setTimeout to ensure we're in the next render cycle
        setTimeout(() => {
          if (isMountedRef.current) {
      setCalendarData(dataMap);
            setLoading(false);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      if (isMountedRef.current) {
      setLoading(false);
    }
    } finally {
      fetchingRef.current = false;
    }
  };

  // Fetch calendar data on mount and when month changes
  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const getIntensityColor = (count) => {
    if (count === 0) return 'bg-dark-bg-hover';
    if (count === 1) return 'bg-green-700/50';
    if (count === 2) return 'bg-green-600/60';
    if (count >= 3 && count < 5) return 'bg-green-500/70';
    if (count >= 5 && count < 8) return 'bg-green-600/80';
    return 'bg-green-500'; // 8+ problems
  };

  const getIntensityText = (count) => {
    if (count === 0) return 'No problems';
    if (count === 1) return '1 problem';
    return `${count} problems`;
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Format date as YYYY-MM-DD using UTC to match backend keys
      const dateUTC = new Date(Date.UTC(year, month, day));
      const dateStr = `${dateUTC.getUTCFullYear()}-${String(dateUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(dateUTC.getUTCDate()).padStart(2, '0')}`;
      const dayData = calendarData[dateStr] || { count: 0, completed: 0, added: 0 };
      days.push({
        day,
        date: dateStr,
        dateObj: date,
        count: dayData.count || 0,
        completed: dayData.completed || 0,
        added: dayData.added || 0
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (dateStr) => {
    // Compare using UTC strings for consistency with backend
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayStr = `${todayUTC.getUTCFullYear()}-${String(todayUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(todayUTC.getUTCDate()).padStart(2, '0')}`;
    return todayStr === dateStr;
  };

  const days = generateCalendarDays();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                         currentMonth.getFullYear() === today.getFullYear();

  if (loading) {
    return (
      <div className="bg-dark-bg-tertiary rounded-lg shadow-md p-6 border border-dark-border">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-bg-hover rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-8 bg-dark-bg-hover rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-2 sm:p-2.5">
      <div className="flex justify-between items-center mb-1.5">
        <h2 className="text-base sm:text-lg font-bold text-dark-text flex items-center gap-1.5">
          <HiOutlineCalendar className="w-4 h-4" />
          <span>Progress Calendar</span>
        </h2>
        {!isCurrentMonth && (
          <button
            onClick={goToToday}
            className="text-xs px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded hover:bg-indigo-800/30 transition border border-indigo-700/30"
          >
            Today
          </button>
        )}
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-1.5">
        <button
          onClick={() => navigateMonth(-1)}
          className="px-1.5 py-0.5 text-dark-text-secondary hover:bg-dark-bg-hover rounded transition text-sm"
          title="Previous month"
        >
          ←
        </button>
        <h3 className="text-sm sm:text-base font-semibold text-dark-text">{monthName}</h3>
        <button
          onClick={() => navigateMonth(1)}
          className="px-1.5 py-0.5 text-dark-text-secondary hover:bg-dark-bg-hover rounded transition text-sm"
          title="Next month"
        >
          →
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] font-semibold text-dark-text-muted py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }

          const { day, date, count, completed, added } = dayData;
          const todayClass = isToday(date) ? 'ring-1 ring-indigo-500' : '';
          const hasProblems = count > 0;
          // Determine past-or-today using UTC comparison
          const now = new Date();
          const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const cellUTC = new Date(date + 'T00:00:00Z');
          const isPastOrToday = cellUTC <= todayUTC;
          const isTodayCell = isToday(date);
          const addedNotCompleted = added > 0 && completed === 0;
          const hasPendingWithCompletions = completed > 0 && added > completed;
          // Red dot should not show for current day
          const noActivity = added === 0 && completed === 0 && isPastOrToday && !isTodayCell;

          return (
            <div
              key={date}
              onClick={() => {
                if (onDateClick) {
                  onDateClick(date);
                }
              }}
              className={`aspect-square rounded flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer relative p-0.5 ${todayClass} ${hasProblems ? getIntensityColor(count) : 'bg-dark-bg-hover hover:bg-dark-bg-secondary'}`}
              title={`${new Date(date + 'T00:00:00Z').toLocaleDateString()}: ${getIntensityText(count)} solved. Click to view problems.`}
            >
              <span className={`text-[10px] font-semibold leading-tight ${hasProblems ? 'text-white' : 'text-dark-text-muted'}`}>
                {day}
              </span>
              {hasProblems && (
                <span className="text-[8px] text-white/90 font-bold leading-none mt-0.5">
                  {count}
                </span>
              )}
              {/* Yellow mark: added but not completed (takes precedence over red) */}
              {addedNotCompleted && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400/80 ring-1 ring-yellow-500/40" title="Problems added but none completed"></span>
              )}
              {/* Orange mark: some completed, some still pending (added > completed) */}
              {!addedNotCompleted && hasPendingWithCompletions && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400/90 ring-1 ring-orange-500/50" title="Some completed, some pending"></span>
              )}
              {/* Red mark: no added and no completed (past or today), only if not yellow */}
              {!addedNotCompleted && noActivity && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500/80 ring-1 ring-red-500/40" title="No activity"></span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-1.5 pt-1.5 border-t border-dark-border">
        <div className="text-[10px] text-dark-text-secondary mb-0.5 font-semibold">Less → More</div>
        <div className="flex items-center gap-0.5">
          <div className="flex-1 h-2 bg-dark-bg-hover rounded" title="No problems"></div>
          <div className="flex-1 h-2 bg-green-700/50 rounded" title="1 problem"></div>
          <div className="flex-1 h-2 bg-green-600/60 rounded" title="2 problems"></div>
          <div className="flex-1 h-2 bg-green-500/70 rounded" title="3-4 problems"></div>
          <div className="flex-1 h-2 bg-green-600/80 rounded" title="5-7 problems"></div>
          <div className="flex-1 h-2 bg-green-500 rounded" title="8+ problems"></div>
        </div>
        <div className="text-[10px] text-dark-text-muted mt-1">
          <span className="flex items-center gap-1">
            <HiOutlineLightBulb className="w-2.5 h-2.5" />
            <span>Hover for details</span>
          </span>
        </div>
      </div>

    </div>
  );
}

export default ProgressCalendar;

