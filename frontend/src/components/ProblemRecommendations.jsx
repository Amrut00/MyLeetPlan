import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getRecommendations, addProblems, fetchLeetCodeProblem } from '../services/api';
import { HiOutlineFlag, HiOutlineBookOpen, HiOutlineSparkles, HiOutlineDocumentText, HiOutlinePlus, HiOutlineArrowPath, HiOutlineInformationCircle } from 'react-icons/hi2';

function ProblemRecommendations({ onUpdate }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState({});

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = async (problem) => {
    if (adding[problem.problemNumber]) return;

    try {
      setAdding(prev => ({ ...prev, [problem.problemNumber]: true }));

      // Fetch problem details if not available
      let problemSlug = problem.problemSlug;
      let problemTitle = problem.problemTitle;
      let difficulty = problem.difficulty;

      if (!problemSlug || !problemTitle) {
        try {
          const leetcodeData = await fetchLeetCodeProblem(problem.problemNumber);
          problemSlug = leetcodeData.slug || problemSlug;
          problemTitle = leetcodeData.title || problemTitle;
          difficulty = leetcodeData.difficulty || difficulty;
        } catch (err) {
          console.warn('Could not fetch LeetCode details:', err);
        }
      }

      // Add problem
      const topic = problem.topics && problem.topics.length > 0 
        ? problem.topics[0] 
        : 'Arrays & Hashing'; // Default topic

      const resp = await addProblems(
        [problem.problemNumber],
        topic,
        difficulty,
        '',
        problemSlug,
        problemTitle
      );

      if (resp?.alreadyAddedToday) {
        toast.success(`Problem ${problem.problemNumber} is already added today.`);
      } else {
        toast.success(`Problem ${problem.problemNumber} added! 🎉`);
      }
      
      // Refresh recommendations and dashboard
      if (onUpdate) onUpdate();
      fetchRecommendations();
    } catch (error) {
      console.error('Error adding problem:', error);
      toast.error(error.response?.data?.error || 'Failed to add problem');
    } finally {
      setAdding(prev => {
        const newState = { ...prev };
        delete newState[problem.problemNumber];
        return newState;
      });
    }
  };


  if (loading) {
    return (
      <div className="bg-dark-bg-tertiary border-2 border-dark-border rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-dark-text-secondary">Loading smart recommendations...</p>
        </div>
      </div>
    );
  }

  if (!recommendations?.recommendations?.pair || recommendations.recommendations.pair.length === 0) {
    return (
      <div className="bg-dark-bg-tertiary border-2 border-dark-border rounded-lg shadow-sm p-4">
        <div className="text-center py-8">
          <p className="text-dark-text-secondary mb-4">Congratulations! You've completed all recommended problems! 🎉</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2.5 bg-indigo-900/40 text-indigo-200 rounded-lg border border-indigo-700/50 hover:bg-indigo-800/50 hover:border-indigo-600/60 active:bg-indigo-900/60 transition-all font-medium"
          >
            Refresh Recommendations
          </button>
        </div>
      </div>
    );
  }

  const pair = recommendations.recommendations.pair;
  const solvedCount = recommendations.solvedCount || 0;
  const totalProblems = recommendations.totalInCuratedList || 70;

  return (
    <div className="bg-dark-bg-tertiary border-2 border-dark-border rounded-lg shadow-sm p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-lg sm:text-3xl font-bold text-dark-text mb-1 flex items-center gap-2">
            <HiOutlineFlag className="w-5 h-5 sm:w-7 sm:h-7 text-dark-text-secondary" />
            <span>Today's Recommended {pair.length === 2 ? 'Pair' : 'Problem'}</span>
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <p className="text-xs sm:text-sm text-dark-text-secondary">
              Progress: {solvedCount} / {totalProblems} problems solved
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="px-1.5 py-0.5 sm:px-2 bg-blue-900/30 text-blue-300 rounded text-[10px] sm:text-xs font-medium border border-blue-700/30">
                <span className="flex items-center gap-1">
                  <HiOutlineBookOpen className="w-3 h-3" />
                  <span>From Your Curated List</span>
                </span>
              </span>
              {recommendations?.aiEnhanced ? (
                <span className="px-1.5 py-0.5 sm:px-2 bg-purple-900/30 text-purple-300 rounded text-[10px] sm:text-xs font-medium flex items-center gap-1 border border-purple-700/30">
                  <span className="flex items-center gap-1">
                    <HiOutlineSparkles className="w-3 h-3" />
                    <span>AI-Enhanced Reasoning (Groq)</span>
                  </span>
                </span>
              ) : recommendations?.groqAvailable === false ? (
                <span className="px-1.5 py-0.5 sm:px-2 bg-dark-bg-hover text-dark-text-muted rounded text-[10px] sm:text-xs font-medium border border-dark-border">
                  <span className="flex items-center gap-1">
                    <HiOutlineDocumentText className="w-3 h-3" />
                    <span>Basic Recommendations</span>
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          className="px-2.5 py-1 text-xs sm:text-sm bg-indigo-900/40 border border-indigo-700/50 text-indigo-200 rounded-lg hover:bg-indigo-800/50 hover:border-indigo-600/60 active:bg-indigo-900/60 transition-all font-medium"
        >
          <span className="flex items-center gap-1.5">
            <HiOutlineArrowPath className="w-4 h-4" />
            <span>Refresh</span>
          </span>
        </button>
      </div>

      {/* Single Problem Message */}
      {recommendations?.recommendations?.singleProblemMessage && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-2.5 mb-4">
          <p className="text-sm text-yellow-300 flex items-center gap-1.5 overflow-hidden">
            <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold flex-shrink-0">Note:</span>
            <span className="truncate">{recommendations.recommendations.singleProblemMessage}</span>
          </p>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
        {pair.map((problem, index) => (
          <div
            key={problem.problemNumber}
            className="bg-dark-bg-secondary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4 hover:border-dark-border-light transition-shadow"
          >
            <div className="mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="text-base sm:text-lg font-bold text-dark-text-secondary">
                  #{problem.problemNumber}
                </span>
                {problem.problemSlug ? (
                  <a
                    href={`https://leetcode.com/problems/${problem.problemSlug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base sm:text-lg font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                  >
                    {problem.problemTitle || `Problem ${problem.problemNumber}`}
                  </a>
                ) : (
                  <h3 className="text-base sm:text-lg font-semibold text-dark-text">
                    {problem.problemTitle || `Problem ${problem.problemNumber}`}
                  </h3>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
                    problem.difficulty === 'Easy'
                      ? 'bg-green-900/30 text-green-300 border border-green-700/30'
                      : problem.difficulty === 'Medium'
                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30'
                      : 'bg-red-900/30 text-red-300 border border-red-700/30'
                  }`}
                >
                  {problem.difficulty}
                </span>
                <span className="px-1.5 py-0.5 bg-indigo-900/30 text-indigo-300 rounded text-[10px] sm:text-xs font-medium border border-indigo-700/30">
                  {problem.topics && problem.topics.length > 0 ? problem.topics[0] : 'General'}
                </span>
                {problem.estimatedDifficulty && (
                  <span className="px-1.5 py-0.5 bg-purple-900/30 text-purple-300 rounded text-[10px] sm:text-xs border border-purple-700/30">
                    {problem.estimatedDifficulty} for you
                  </span>
                )}
              </div>
            </div>

            {problem.reasoning && (
              <div className="mb-2.5 sm:mb-3 p-2 bg-dark-bg-hover rounded border border-dark-border">
                <p className="text-xs sm:text-sm text-dark-text-secondary">
                  <span className="font-semibold text-dark-text">Why recommended:</span>{' '}
                  {problem.reasoning}
                </p>
              </div>
            )}

            {problem.whatYoullLearn && (
              <div className="mb-2.5 sm:mb-3 p-2 bg-dark-bg-hover rounded border border-dark-border">
                <p className="text-xs sm:text-sm text-dark-text-secondary">
                  <span className="font-semibold text-dark-text">You'll learn:</span>{' '}
                  {problem.whatYoullLearn}
                </p>
              </div>
            )}

            <button
              onClick={() => handleAddProblem(problem)}
              disabled={adding[problem.problemNumber]}
              className="w-full px-3 sm:px-4 py-2 bg-indigo-900/40 text-indigo-200 rounded-lg border border-indigo-700/50 hover:bg-indigo-800/50 hover:border-indigo-600/60 active:bg-indigo-900/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {adding[problem.problemNumber] ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-200 border-t-transparent mr-2"></span>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5 text-sm">
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>Add Problem {problem.problemNumber}</span>
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProblemRecommendations;

