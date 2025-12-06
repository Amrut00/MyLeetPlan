import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllProblems } from '../services/api';
import ProblemItemEnhanced from './ProblemItemEnhanced';
import AnchorSection from './AnchorSection';
import { HiOutlineDocumentText, HiOutlineRocketLaunch } from 'react-icons/hi2';

function TodayProblems({ anchorTopic, onAddProblems, onUpdate }) {
  const [todayProblems, setTodayProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const editingProblemsRef = useRef(new Set());
  const isRefreshingRef = useRef(false);

  const fetchTodayProblems = useCallback(async (silent = false) => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      if (!silent) {
      setLoading(true);
      }
      // Get today's date string in YYYY-MM-DD (UTC) to match database dates
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const todayStr = todayUTC.toISOString().split('T')[0];
      
      const allProblems = await getAllProblems({});
      const todayAdded = allProblems.filter(p => {
        // Only show anchor problems (not repetition entries) as "added today"
        if (p.type === 'repetition') return false;
        
        const source = p.createdAt || p.addedDate;
        if (!source) return false;
        const d = new Date(source);
        const dUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const dStr = dUTC.toISOString().split('T')[0];
        return dStr === todayStr;
      });

      setTodayProblems(todayAdded);
    } catch (error) {
      console.error('Error fetching today\'s problems:', error);
    } finally {
      isRefreshingRef.current = false;
      if (!silent) {
      setLoading(false);
    }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTodayProblems();
  }, [fetchTodayProblems]);

  // Auto-refresh interval - polls every 10 seconds when not editing
  // This catches updates from other components (e.g., recommendations)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if no problems are being edited and not already refreshing
      if (editingProblemsRef.current.size === 0 && !isRefreshingRef.current) {
        fetchTodayProblems(true); // Silent refresh
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [fetchTodayProblems]);

  const handleUpdate = useCallback(() => {
    // Always refresh when update is called (from edit, delete, complete, etc.)
    // But skip if currently editing to avoid interrupting user
    if (editingProblemsRef.current.size === 0 && !isRefreshingRef.current) {
      setTimeout(() => {
        fetchTodayProblems(true);
      }, 500);
    }
    if (onUpdate) onUpdate();
  }, [onUpdate, fetchTodayProblems]);

  const handleEditStateChange = useCallback((problemId, isEditing) => {
    if (isEditing) {
      editingProblemsRef.current.add(problemId);
    } else {
      editingProblemsRef.current.delete(problemId);
      // When editing stops, refresh after a short delay
      setTimeout(() => {
        if (!isRefreshingRef.current) {
          fetchTodayProblems(true);
        }
      }, 300);
    }
  }, [fetchTodayProblems]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Add New Problem Section */}
      <AnchorSection 
        topic={anchorTopic} 
        onAddProblems={useCallback(async (problemNumbers, topic, difficulty, notes, problemSlug, problemTitle) => {
          const response = await onAddProblems(problemNumbers, topic, difficulty, notes, problemSlug, problemTitle);
          // Wait a bit for the database to update, then refresh
          // Use a longer delay to ensure backend has processed the request
          setTimeout(() => {
            if (!isRefreshingRef.current) {
              fetchTodayProblems(true);
            }
          }, 1000);
          return response;
        }, [onAddProblems, fetchTodayProblems])}
      />

      {/* Today's Added Problems */}
      {!loading && todayProblems.length > 0 && (
        <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
            <h2 className="text-lg sm:text-2xl font-bold text-dark-text flex items-center gap-2">
              <HiOutlineDocumentText className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Problems Added Today</span>
            </h2>
            <span className="px-1.5 py-0.5 sm:px-2 bg-green-900/30 text-green-300 rounded-full text-[10px] sm:text-xs font-semibold border border-green-700/30">
              {todayProblems.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dark-text-secondary mb-3 sm:mb-4">
            These are the problems you've added today. You can edit their topic, difficulty, or add notes.
          </p>
          <div className="space-y-2 sm:space-y-2.5">
            {todayProblems.map((problem) => (
              <ProblemItemEnhanced
                key={problem._id}
                problem={{ ...problem, id: problem._id }}
                onUpdate={handleUpdate}
                onEditStateChange={handleEditStateChange}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && todayProblems.length === 0 && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm text-blue-300">
            <span className="flex items-center justify-center gap-2">
              <span>No problems added today yet. Add your first problem above!</span>
              <HiOutlineRocketLaunch className="w-4 h-4" />
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default TodayProblems;

