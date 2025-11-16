import ProblemItemEnhanced from './ProblemItemEnhanced';
import { HiOutlineClock } from 'react-icons/hi2';

function BacklogSection({ problems, onMarkComplete, onUpdate }) {
  // Group problems by repetition date
  const groupedProblems = problems.reduce((acc, problem) => {
    const date = new Date(problem.repetitionDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(problem);
    return acc;
  }, {});

  return (
    <div id="backlog-section" className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
        <h2 className="text-lg sm:text-2xl font-bold text-dark-text flex items-center gap-2">
          <HiOutlineClock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
          <span>Backlog (Missed Repetitions)</span>
        </h2>
        <span className="px-1.5 py-0.5 sm:px-2 bg-orange-900/30 text-orange-300 rounded-full text-[10px] sm:text-xs font-semibold border border-orange-700/30">
          {problems.length}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-dark-text-secondary mb-3 sm:mb-4">
        These are repetition problems that were not completed on their scheduled day. Complete them when you have time.
      </p>

      <div className="space-y-2.5 sm:space-y-3">
        {Object.entries(groupedProblems).map(([date, dateProblems]) => (
          <div key={date} className="bg-dark-bg-secondary rounded-lg p-3 sm:p-4 border border-dark-border">
            <h3 className="font-semibold text-dark-text-secondary mb-2 text-sm sm:mb-2.5 sm:text-base">
              Due: {date}
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              {dateProblems.map((problem) => (
                <ProblemItemEnhanced
                  key={problem.id}
                  problem={problem}
                  onUpdate={onUpdate}
                  showActions={true}
                  isBacklog={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BacklogSection;

