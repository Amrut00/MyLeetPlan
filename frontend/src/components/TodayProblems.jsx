import { useState, useEffect } from 'react';
import { getAllProblems } from '../services/api';
import ProblemItemEnhanced from './ProblemItemEnhanced';
import AnchorSection from './AnchorSection';
import { HiOutlineDocumentText, HiOutlineRocketLaunch } from 'react-icons/hi2';

function TodayProblems({ anchorTopic, onAddProblems, onUpdate }) {
  const [todayProblems, setTodayProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayProblems = async () => {
    try {
      setLoading(true);
      // Get today's date string in YYYY-MM-DD format (UTC)
      // This matches how the backend stores dates
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const todayStr = todayUTC.toISOString().split('T')[0];
      
      const allProblems = await getAllProblems({});
      const todayAdded = allProblems.filter(p => {
        if (!p.addedDate) return false;
        // Parse the date and get YYYY-MM-DD string in UTC
        const addedDate = new Date(p.addedDate);
        const addedDateUTC = new Date(Date.UTC(addedDate.getUTCFullYear(), addedDate.getUTCMonth(), addedDate.getUTCDate()));
        const addedDateStr = addedDateUTC.toISOString().split('T')[0];
        
        // Compare date strings
        return addedDateStr === todayStr;
      });

      setTodayProblems(todayAdded);
    } catch (error) {
      console.error('Error fetching today\'s problems:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayProblems();
  }, []);

  // Refresh when component becomes visible or when explicitly triggered
  // This helps catch updates that happen after initial mount
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTodayProblems();
    }, 30000); // Refresh every 30 seconds as a fallback

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    fetchTodayProblems();
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Add New Problem Section */}
      <AnchorSection 
        topic={anchorTopic} 
        onAddProblems={async (problemNumbers, topic, difficulty, notes, problemSlug, problemTitle) => {
          const response = await onAddProblems(problemNumbers, topic, difficulty, notes, problemSlug, problemTitle);
          // Wait a bit for the database to update, then refresh
          // Use a longer delay to ensure backend has processed the request
          setTimeout(() => {
            fetchTodayProblems();
          }, 1000);
          return response;
        }}
      />

      {/* Today's Added Problems */}
      {!loading && todayProblems.length > 0 && (
        <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-dark-text flex items-center gap-2">
              <HiOutlineDocumentText className="w-6 h-6" />
              <span>Problems Added Today</span>
            </h2>
            <span className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded-full text-xs font-semibold border border-green-700/30">
              {todayProblems.length}
            </span>
          </div>
          <p className="text-sm text-dark-text-secondary mb-4">
            These are the problems you've added today. You can edit their topic, difficulty, or add notes.
          </p>
          <div className="space-y-2.5">
            {todayProblems.map((problem) => (
              <ProblemItemEnhanced
                key={problem._id}
                problem={{ ...problem, id: problem._id }}
                onUpdate={handleUpdate}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && todayProblems.length === 0 && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-300">
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

