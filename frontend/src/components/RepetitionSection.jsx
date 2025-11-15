import ProblemItemEnhanced from './ProblemItemEnhanced';
import { HiOutlineArrowPath, HiOutlineSparkles } from 'react-icons/hi2';

function RepetitionSection({ topic, problems, onMarkComplete, onUpdate }) {
  return (
    <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-dark-text flex items-center gap-2">
          <HiOutlineArrowPath className="w-6 h-6" />
          <span>Repetition: {topic}</span>
        </h2>
        {problems.length > 0 && (
          <span className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-700/30">
            {problems.length}
          </span>
        )}
      </div>
      <p className="text-sm text-dark-text-secondary mb-4">
        Review and re-solve these problems from your practice plan. Check them off when completed.
      </p>

      {problems.length === 0 ? (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            <span className="flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4" />
              <span>No repetition problems for today! Great job staying on track.</span>
            </span>
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {problems.map((problem) => (
            <ProblemItemEnhanced
              key={problem.id || problem._id}
              problem={{ ...problem, id: problem.id || problem._id }}
              onUpdate={() => {
                // Refresh the dashboard when a problem is updated
                if (onUpdate) onUpdate();
              }}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RepetitionSection;

