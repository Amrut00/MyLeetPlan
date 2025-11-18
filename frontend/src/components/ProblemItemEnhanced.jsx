import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { updateProblem, deleteProblem, markProblemComplete, unmarkProblemComplete, fetchLeetCodeProblem, getAllTopics } from '../services/api';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineCheck } from 'react-icons/hi2';
import { HiOutlineLightBulb, HiOutlineRefresh } from 'react-icons/hi';

function ProblemItemEnhanced({ problem, onUpdate, showActions = true, isBacklog = false, onEditStateChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editData, setEditData] = useState({
    problemNumber: problem.problemNumber || '',
    problemSlug: problem.problemSlug || '',
    problemTitle: problem.problemTitle || '',
    topic: problem.topic || '',
    difficulty: problem.difficulty || 'Medium',
    notes: problem.notes || '',
  });

  // Update editData when problem prop changes, but only if not currently editing
  useEffect(() => {
    if (!isEditing) {
      setEditData({
        problemNumber: problem.problemNumber || '',
        problemSlug: problem.problemSlug || '',
        problemTitle: problem.problemTitle || '',
        topic: problem.topic || '',
        difficulty: problem.difficulty || 'Medium',
        notes: problem.notes || '',
      });
    }
  }, [problem.problemNumber, problem.problemSlug, problem.problemTitle, problem.topic, problem.difficulty, problem.notes, isEditing]);

  // Notify parent when edit state changes
  useEffect(() => {
    if (onEditStateChange) {
      onEditStateChange(problem.id, isEditing);
    }
  }, [isEditing, problem.id, onEditStateChange]);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [topicWarning, setTopicWarning] = useState(null);
  const [displayTitle, setDisplayTitle] = useState(problem.problemTitle || '');
  const [hasFetchedTitle, setHasFetchedTitle] = useState(false);

  // Update display title when problem prop changes
  useEffect(() => {
    setDisplayTitle(problem.problemTitle || '');
    // Reset fetch flag if title is now available
    if (problem.problemTitle) {
      setHasFetchedTitle(false);
    }
  }, [problem.problemTitle]);

  // Auto-fetch title if slug exists but title doesn't (only once per problem)
  useEffect(() => {
    const fetchMissingTitle = async () => {
      // If we have a slug but no title, and we haven't fetched yet
      if (problem.problemSlug && !problem.problemTitle && problem.problemNumber && !displayTitle && !hasFetchedTitle) {
        setHasFetchedTitle(true); // Mark as fetched to prevent multiple calls
        try {
          const data = await fetchLeetCodeProblem(problem.problemNumber);
          if (data.success && data.title) {
            // Update the problem in database with the fetched title
            try {
              await updateProblem(problem.id, { problemTitle: data.title });
              setDisplayTitle(data.title);
              // Don't call onUpdate here to prevent refresh loop
              // The title will be shown immediately, and will persist on next page load
            } catch (err) {
              // If update fails, just show the title locally
              setDisplayTitle(data.title);
              console.error('Failed to save title to database:', err);
            }
          } else {
            // If fetch failed, reset flag so we can try again later
            setHasFetchedTitle(false);
          }
        } catch (err) {
          // Silently fail - title will remain empty, reset flag
          setHasFetchedTitle(false);
          console.log('Could not fetch problem title:', err.message);
        }
      }
    };

    fetchMissingTitle();
    // Only depend on the problem properties, not on displayTitle or hasFetchedTitle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.problemSlug, problem.problemTitle, problem.problemNumber, problem.id]);

  // Standard topics (always shown first)
  const standardTopics = [
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
  ];

  // Fetch all available topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topics = await getAllTopics();
        setAvailableTopics(topics);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setAvailableTopics(standardTopics);
      }
    };
    fetchTopics();
  }, []);
  
  // Separate standard and custom topics
  const standardTopicsList = standardTopics.filter(t => availableTopics.includes(t));
  const customTopicsList = availableTopics.filter(t => !standardTopics.includes(t)).sort();
  const allTopics = [...standardTopicsList, ...customTopicsList];
  
  const isCustomTopic = !standardTopics.includes(editData.topic) && editData.topic;

  // Smart topic matching function (case-insensitive, handles minor spelling mistakes)
  const findSimilarTopic = (inputTopic) => {
    if (!inputTopic || inputTopic.trim().length === 0) {
      return null;
    }

    const normalizedInput = inputTopic.trim().toLowerCase().replace(/\s+/g, ' ');
    const allTopics = [...standardTopics, ...availableTopics.filter(t => !standardTopics.includes(t))];

    // First, check for exact match (case-insensitive)
    const exactMatch = allTopics.find(t => t.toLowerCase().trim() === normalizedInput);
    if (exactMatch) {
      return { topic: exactMatch, type: 'exact' };
    }

    // Check if input is contained in any topic or vice versa (for minor variations)
    const containsMatch = allTopics.find(t => {
      const normalizedTopic = t.toLowerCase().trim().replace(/\s+/g, ' ');
      return normalizedTopic.includes(normalizedInput) || normalizedInput.includes(normalizedTopic);
    });
    if (containsMatch) {
      return { topic: containsMatch, type: 'contains' };
    }

    // Calculate similarity using simple character matching
    let bestMatch = null;
    let bestSimilarity = 0;
    const threshold = 0.7; // 70% similarity threshold

    for (const existingTopic of allTopics) {
      const normalizedTopic = existingTopic.toLowerCase().trim().replace(/\s+/g, ' ');
      const similarity = calculateSimilarity(normalizedInput, normalizedTopic);
      
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = existingTopic;
      }
    }

    if (bestMatch) {
      return { topic: bestMatch, type: 'similar', similarity: bestSimilarity };
    }

    return null;
  };

  // Simple similarity calculation (based on common characters and length)
  const calculateSimilarity = (str1, str2) => {
    // If strings are very different in length, similarity is low
    const lengthDiff = Math.abs(str1.length - str2.length);
    const maxLength = Math.max(str1.length, str2.length);
    if (lengthDiff / maxLength > 0.5) {
      return 0;
    }

    // Count common characters
    const chars1 = str1.split('').sort();
    const chars2 = str2.split('').sort();
    let commonChars = 0;
    let i = 0, j = 0;
    
    while (i < chars1.length && j < chars2.length) {
      if (chars1[i] === chars2[j]) {
        commonChars++;
        i++;
        j++;
      } else if (chars1[i] < chars2[j]) {
        i++;
      } else {
        j++;
      }
    }

    // Calculate similarity based on common characters and length
    const totalChars = (str1.length + str2.length) / 2;
    const charSimilarity = (commonChars * 2) / totalChars;

    // Also check for substring matches
    const substringMatch = str1.includes(str2) || str2.includes(str1);
    const substringBonus = substringMatch ? 0.2 : 0;

    return Math.min(1, charSimilarity + substringBonus);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-900/30 text-green-300 border-green-700/30';
      case 'Medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30';
      case 'Hard':
        return 'bg-red-900/30 text-red-300 border-red-700/30';
      default:
        return 'bg-dark-bg-hover text-dark-text-secondary border-dark-border';
    }
  };

  // Auto-fetch problem info when problem number is entered in edit mode (only if number looks complete)
  useEffect(() => {
    if (!isEditing) return; // Only auto-fetch when in edit mode
    
    const fetchProblemInfo = async () => {
      const trimmedNumber = editData.problemNumber.trim();
      // Only auto-fetch if number is at least 3 digits and user stopped typing for 1.5 seconds
      if (trimmedNumber && trimmedNumber.length >= 3 && !editData.problemSlug && !isNaN(trimmedNumber)) {
        // Debounce: wait 1.5 seconds after user stops typing
        const timer = setTimeout(async () => {
          try {
            setFetching(true);
            const data = await fetchLeetCodeProblem(trimmedNumber);
            if (data.success) {
              setEditData({ ...editData, problemSlug: data.slug, problemTitle: data.title || '', difficulty: data.difficulty || editData.difficulty });
              toast.success(`Found: ${data.title}`, { duration: 2000 });
            }
          } catch (err) {
            // Silently fail - user can still edit problem manually or use Fetch button
            console.log('Could not auto-fetch problem info:', err.message);
          } finally {
            setFetching(false);
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    };

    fetchProblemInfo();
  }, [editData.problemNumber, editData.problemSlug, isEditing]);

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editData.problemNumber.trim()) {
      setError('Please enter a problem number');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const finalTopic = editData.topic === 'Other' ? customTopic.trim() : editData.topic;
    
    if (!finalTopic) {
      setError('Please enter a topic or select from the list');
      setLoading(false);
      return;
    }

    // Check if the topic already exists (smart check)
    if (editData.topic === 'Other') {
      const similar = findSimilarTopic(finalTopic);
      if (similar && similar.type === 'exact') {
        setError(`Topic "${similar.topic}" already exists. Please select it from the dropdown above.`);
        setLoading(false);
        return;
      }
    }

    try {
      await updateProblem(problem.id, { ...editData, topic: finalTopic, problemTitle: editData.problemTitle });
      
      // Update display title if it was updated
      if (editData.problemTitle) {
        setDisplayTitle(editData.problemTitle);
      }
      
      // Refresh topics list to include any new custom topics
      try {
        const topics = await getAllTopics();
        setAvailableTopics(topics);
      } catch (err) {
        console.error('Error refreshing topics:', err);
      }
      
      setIsEditing(false);
      if (onEditStateChange) {
        onEditStateChange(problem.id, false);
      }
      setCustomTopic('');
      setTopicWarning(null);
      toast.success('Problem updated successfully!');
      if (onUpdate) onUpdate();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update problem';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Problem ${problem.problemNumber}?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProblem(problem.id);
      toast.success('Problem deleted successfully!');
      if (onUpdate) onUpdate();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete problem';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsDeleting(false);
    }
  };

  // Check if completion status can be changed (only allowed on the same day)
  const canChangeCompletionStatus = () => {
    if (!problem.isCompleted) {
      // If not completed, can always mark as complete
      return true;
    }

    // If completed, check if completion date is today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23, 59, 59, 999);

    let completionDate;
    if (problem.type === 'repetition') {
      completionDate = problem.repetitionCompletedDate;
    } else {
      completionDate = problem.completedDate;
    }

    if (!completionDate) {
      return true; // No completion date, allow change
    }

    const completionDateUTC = new Date(completionDate);
    // Check if completion date is today
    return completionDateUTC >= todayStart && completionDateUTC <= todayEnd;
  };

  const handleToggleComplete = async () => {
    // Check if we can change the status
    if (!canChangeCompletionStatus()) {
      toast.error('Cannot change completion status for problems completed on past days. Completion status is locked after the day has passed.');
      return;
    }

    // TEMPORARY: Handle mock data (IDs starting with 'temp-')
    // TODO: Remove this after removing temporary mock data
    if (problem.id && problem.id.toString().startsWith('temp-')) {
      // For temporary mock data, prevent API call and just show toast
      // The state update will be handled by the parent component's onUpdate
      toast.success(problem.isCompleted ? 'Problem unmarked as complete! (Mock data)' : 'Problem marked as complete! 🎉 (Mock data)');
      // Call onUpdate with the problem ID so parent can update state
      if (onUpdate) {
        // Pass a callback that the parent can use to update state
        onUpdate(problem.id);
      }
      return;
    }

    setLoading(true);
    try {
      if (problem.isCompleted) {
        await unmarkProblemComplete(problem.id);
        toast.success('Problem unmarked as complete');
      } else {
        await markProblemComplete(problem.id);
        toast.success('Problem marked as complete! 🎉');
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update problem';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isDeleting) {
    return null;
  }

  return (
    <div className={`border rounded-lg p-3 transition-all duration-200 ${
      problem.isCompleted 
        ? 'bg-dark-bg-secondary border border-green-500/40 shadow-[0_0_0_1px_rgba(34,197,94,0.2)]' 
        : isBacklog
        ? 'bg-dark-bg-secondary border border-orange-500/50 hover:border-orange-500/70'
        : 'bg-dark-bg-secondary border border-dark-border hover:border-dark-border-light'
    }`}>
      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                Problem Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editData.problemNumber}
                  onChange={(e) => {
                    setEditData({ ...editData, problemNumber: e.target.value, problemSlug: '', problemTitle: '' });
                    setError(null);
                  }}
                  placeholder="e.g., 1922"
                  className="w-full px-3 py-2 pr-20 border border-dark-border bg-dark-bg-tertiary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading || fetching}
                  required
                />
                {editData.problemNumber && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editData.problemNumber.trim()) {
                        toast.error('Please enter a problem number first');
                        return;
                      }
                      try {
                        setFetching(true);
                        const data = await fetchLeetCodeProblem(editData.problemNumber.trim());
                        if (data.success) {
                          setEditData({ ...editData, problemSlug: data.slug, problemTitle: data.title || '', difficulty: data.difficulty || editData.difficulty });
                          toast.success(`Found: ${data.title}`);
                        } else {
                          toast.error('Problem not found on LeetCode');
                        }
                      } catch (err) {
                        toast.error('Failed to fetch problem from LeetCode');
                        console.error('Error fetching problem:', err);
                      } finally {
                        setFetching(false);
                      }
                    }}
                    disabled={fetching || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-indigo-900/30 text-indigo-300 rounded hover:bg-indigo-800/30 disabled:bg-dark-bg-hover disabled:text-dark-text-muted transition border border-indigo-700/30"
                    title="Fetch problem info from LeetCode"
                  >
                    {fetching ? (
                      <span className="flex items-center gap-1">
                        <span className="animate-spin">⏳</span>
                        <span>Fetching...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <HiOutlineMagnifyingGlass className="w-3 h-3" />
                        <span>Fetch</span>
                      </span>
                    )}
                  </button>
                )}
              </div>
              {fetching && (
                <p className="text-xs text-indigo-400 mt-1">Fetching problem info...</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                Problem Slug (Auto-filled)
              </label>
              <input
                type="text"
                value={editData.problemSlug}
                onChange={(e) => setEditData({ ...editData, problemSlug: e.target.value })}
                placeholder="Will be auto-filled from LeetCode"
                className="w-full px-3 py-2 border border-dark-border bg-dark-bg-hover text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading || fetching}
                readOnly={!!editData.problemSlug && !fetching}
              />
              <p className="text-xs text-dark-text-muted mt-1">
                {editData.problemSlug 
                  ? (
                      <span className="flex items-center gap-1">
                        <HiOutlineCheckCircle className="w-3 h-3 text-green-400" />
                        <span>Auto-filled from LeetCode</span>
                      </span>
                    ) 
                  : 'Enter problem number and click "Fetch" or enter manually'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                Difficulty
              </label>
              <select
                value={editData.difficulty}
                onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-dark-border bg-dark-bg-tertiary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading || fetching}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-text mb-1">
                Topic
              </label>
              <select
                value={isCustomTopic ? 'Other' : editData.topic}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setEditData({ ...editData, topic: 'Other' });
                    setCustomTopic(editData.topic);
                  } else {
                    setEditData({ ...editData, topic: e.target.value });
                    setCustomTopic('');
                  }
                }}
                className="w-full px-3 py-2 border border-dark-border bg-dark-bg-tertiary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {allTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>
              {customTopicsList.length > 0 && (
                <p className="text-xs text-indigo-400 mt-1">
                  <span className="flex items-center gap-1">
                    <HiOutlineLightBulb className="w-3 h-3" />
                    <span>{customTopicsList.length} custom topic(s) available</span>
                  </span>
                </p>
              )}
              {(editData.topic === 'Other' || isCustomTopic) && (
                <div>
                  <input
                    type="text"
                    value={isCustomTopic ? editData.topic : customTopic}
                    onChange={(e) => {
                      const value = e.target.value;
                      setError(null);
                      
                      if (isCustomTopic) {
                        setEditData({ ...editData, topic: value });
                      } else {
                        setCustomTopic(value);
                      }
                      
                      // Check for similar topics
                      if (value.trim()) {
                        const similar = findSimilarTopic(value);
                        if (similar) {
                          if (similar.type === 'exact') {
                            setTopicWarning(`⚠️ Topic "${similar.topic}" already exists. Please select it from the dropdown above.`);
                          } else if (similar.type === 'contains') {
                            setTopicWarning(`💡 Did you mean "${similar.topic}"? It's already in the topic list.`);
                          } else {
                            setTopicWarning(`💡 Similar topic found: "${similar.topic}" (${Math.round(similar.similarity * 100)}% similar). Consider using the existing topic.`);
                          }
                        } else {
                          setTopicWarning(null);
                        }
                      } else {
                        setTopicWarning(null);
                      }
                    }}
                    placeholder="Enter custom topic..."
                    className={`w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-dark-bg-tertiary text-dark-text ${
                      topicWarning ? 'border-yellow-500 bg-yellow-900/20' : 'border-dark-border'
                    }`}
                    required
                    autoFocus
                  />
                  {topicWarning && (
                    <p className={`text-xs mt-1 ${topicWarning.includes('⚠️') ? 'text-red-400' : 'text-yellow-400'}`}>
                      {topicWarning}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-text mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Add quick notes, thoughts, or reminders about this problem..."
                rows={4}
                className="w-full px-3 py-2.5 border border-dark-border bg-dark-bg-tertiary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y min-h-[100px] leading-relaxed text-sm"
                disabled={loading || fetching}
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || fetching || (editData.topic === 'Other' && !customTopic.trim()) || !editData.problemNumber.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-dark-bg-hover disabled:text-dark-text-muted disabled:cursor-not-allowed transition font-medium text-sm"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <HiOutlineCheck className="w-4 h-4" />
                  <span>Save Changes</span>
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (onEditStateChange) {
                  onEditStateChange(problem.id, false);
                }
                setEditData({
                  problemNumber: problem.problemNumber,
                  problemSlug: problem.problemSlug || '',
                  problemTitle: problem.problemTitle || '',
                  topic: problem.topic,
                  difficulty: problem.difficulty || 'Medium',
                  notes: problem.notes || '',
                });
                    setCustomTopic('');
                    setError(null);
                    setTopicWarning(null);
                  }}
              className="px-4 py-2 bg-dark-bg-hover text-dark-text rounded-lg hover:bg-dark-bg-secondary text-sm border border-dark-border"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {showActions && (
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={loading || !canChangeCompletionStatus()}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  problem.isCompleted
                    ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'
                    : 'bg-dark-bg-tertiary border-dark-border text-transparent hover:border-indigo-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed ${!canChangeCompletionStatus() ? '' : 'cursor-pointer'}`}
                title={
                  !canChangeCompletionStatus() 
                    ? 'Completion status is locked for past days. You can only change it on the same day it was completed.'
                    : problem.isCompleted 
                    ? 'Mark as incomplete' 
                    : 'Mark as complete'
                }
              >
                {problem.isCompleted && <HiOutlineCheckCircle className="w-4 h-4" />}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={problem.problemSlug 
                    ? `https://leetcode.com/problems/${problem.problemSlug}/`
                    : `https://leetcode.com/problemset/all/?page=1&search=${problem.problemNumber}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                  title={problem.problemSlug ? 'Open problem on LeetCode' : 'Search problem on LeetCode'}
                >
                  <span>Problem {problem.problemNumber}</span>
                  {(displayTitle || problem.problemTitle) && (
                    <span className="ml-2 text-dark-text-secondary font-normal">- {displayTitle || problem.problemTitle}</span>
                  )}
                  {!problem.problemSlug && <span className="text-xs text-dark-text-muted ml-1">(search)</span>}
                </a>
                {problem.difficulty && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                )}
                <span className="text-sm text-dark-text-secondary">({problem.topic})</span>
                {problem.solveCount > 1 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-purple-900/30 text-purple-300 rounded border border-purple-700/30" title={`Solved ${problem.solveCount} times`}>
                    <span className="flex items-center gap-1">
                      <HiOutlineRefresh className="w-3 h-3" />
                      <span>{problem.solveCount}x</span>
                    </span>
                  </span>
                )}
              </div>
              {(problem.createdAt || problem.addedDate) && (
                <div className="text-xs text-dark-text-muted mt-1">
                  {problem.type === 'repetition' ? (
                    <>
                      <span>Originally added: {new Date(problem.addedDate || problem.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}</span>
                      {problem.repetitionCompletedDate && (
                        <span className="ml-2 text-green-500/70 flex items-center gap-1">
                          <HiOutlineCheckCircle className="w-3 h-3" />
                          <span>Repeated: {new Date(problem.repetitionCompletedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>Added: {new Date(problem.createdAt || problem.addedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}</span>
                      {problem.completedDate && (
                        <span className="ml-2 text-green-500/70 flex items-center gap-1">
                          <HiOutlineCheckCircle className="w-3 h-3" />
                          <span>Completed: {new Date(problem.completedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}</span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
              {problem.notes && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    {showNotes ? 'Hide notes' : 'Show notes'}
                  </button>
                  {showNotes && (
                    <div className="mt-1 p-2 bg-dark-bg-hover rounded text-sm text-dark-text-secondary whitespace-pre-wrap border border-dark-border">
                      {problem.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setIsEditing(true);
                  if (onEditStateChange) {
                    onEditStateChange(problem.id, true);
                  }
                }}
                className="p-2 text-indigo-400 hover:bg-dark-bg-hover rounded-lg transition"
                title="Edit"
              >
                <HiOutlinePencil className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-400 hover:bg-dark-bg-hover rounded-lg transition"
                title="Delete"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProblemItemEnhanced;

