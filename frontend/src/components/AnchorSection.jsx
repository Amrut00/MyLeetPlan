import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchLeetCodeProblem, getAllTopics } from '../services/api';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineLightBulb } from 'react-icons/hi2';
import { HiOutlineRefresh } from 'react-icons/hi';

function AnchorSection({ topic, onAddProblems }) {
  const [problemNumber, setProblemNumber] = useState('');
  const [problemSlug, setProblemSlug] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [topicWarning, setTopicWarning] = useState(null);
  
  // Standard topics (always available)
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
  
  // Initialize selectedTopic with anchor topic (will be validated when topics load)
  const [selectedTopic, setSelectedTopic] = useState(topic || standardTopics[0]);

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

  // Fetch all available topics (including custom ones) on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topics = await getAllTopics();
        setAvailableTopics(topics);
        
        // If the anchor topic is not in the list, set selectedTopic to first available topic or empty
        // This ensures the dropdown always has a valid selection
        if (topics.length > 0) {
          if (!topics.includes(topic)) {
            // Anchor topic not in list, default to first standard topic or first available
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
            const firstStandard = standardTopics.find(t => topics.includes(t));
            setSelectedTopic(firstStandard || topics[0]);
          } else {
            // Anchor topic is in list, use it as default
            setSelectedTopic(topic);
          }
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        // Fallback to standard topics if fetch fails
        const fallbackTopics = [
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
        setAvailableTopics(fallbackTopics);
        // Set to anchor topic if it's in standard topics, otherwise first standard topic
        if (fallbackTopics.includes(topic)) {
          setSelectedTopic(topic);
        } else {
          setSelectedTopic(fallbackTopics[0]);
        }
      }
    };
    fetchTopics();
  }, [topic]);

  // Auto-fetch problem info when problem number is entered (only if number looks complete)
  useEffect(() => {
    const fetchProblemInfo = async () => {
      const trimmedNumber = problemNumber.trim();
      // Only auto-fetch if number is at least 3 digits and user stopped typing for 1.5 seconds
      if (trimmedNumber && trimmedNumber.length >= 3 && !problemSlug && !isNaN(trimmedNumber)) {
        // Debounce: wait 1.5 seconds after user stops typing
        const timer = setTimeout(async () => {
          try {
            setFetching(true);
            const data = await fetchLeetCodeProblem(trimmedNumber);
            if (data.success) {
              setProblemSlug(data.slug);
              setProblemTitle(data.title || '');
              if (data.difficulty) {
                setDifficulty(data.difficulty);
              }
              toast.success(`Found: ${data.title}`, { duration: 2000 });
            }
          } catch (err) {
            // Silently fail - user can still add problem manually or use Fetch button
            console.log('Could not auto-fetch problem info:', err.message);
          } finally {
            setFetching(false);
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    };

    fetchProblemInfo();
  }, [problemNumber, problemSlug]);

  const handleFetchProblem = async () => {
    if (!problemNumber.trim()) {
      toast.error('Please enter a problem number first');
      return;
    }

    try {
      setFetching(true);
      const data = await fetchLeetCodeProblem(problemNumber.trim());
      if (data.success) {
        setProblemSlug(data.slug);
        setProblemTitle(data.title || '');
        if (data.difficulty) {
          setDifficulty(data.difficulty);
        }
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!problemNumber.trim()) {
      setError('Please enter a problem number');
      return;
    }

    const finalTopic = selectedTopic === 'Other' ? customTopic.trim() : selectedTopic;
    
    if (!finalTopic) {
      setError('Please enter a topic or select from the list');
      return;
    }

    // Check if the topic already exists (smart check)
    if (selectedTopic === 'Other') {
      const similar = findSimilarTopic(finalTopic);
      if (similar && similar.type === 'exact') {
        setError(`Topic "${similar.topic}" already exists. Please select it from the dropdown above.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await onAddProblems([problemNumber.trim()], finalTopic, difficulty, notes, problemSlug.trim(), problemTitle.trim());
      
      // Check if it was a duplicate
      if (response?.duplicates && response.duplicates.length > 0) {
        const dup = response.duplicates[0];
        toast.success(`Problem ${problemNumber} added! (Solved ${dup.solveCount} times) 🔄`, { duration: 4000 });
      } else {
        toast.success(`Problem ${problemNumber} added successfully! 🎉`);
      }
      
      // Refresh topics list to include any new custom topics
      try {
        const topics = await getAllTopics();
        setAvailableTopics(topics);
        // Keep the topic we just used selected for next problem
        if (topics.includes(finalTopic)) {
          setSelectedTopic(finalTopic);
        } else {
          // If topic not in list (shouldn't happen), default to anchor topic or first available
          if (topics.includes(topic)) {
            setSelectedTopic(topic);
          } else if (topics.length > 0) {
            setSelectedTopic(topics[0]);
          }
        }
      } catch (err) {
        console.error('Error refreshing topics:', err);
        // On error, reset to anchor topic if available
        if (availableTopics.includes(topic)) {
          setSelectedTopic(topic);
        }
      }
      
      setProblemNumber('');
      setProblemSlug('');
      setProblemTitle('');
      setNotes('');
      setCustomTopic('');
      setDifficulty('Medium');
      setError(null);
      setTopicWarning(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add problem. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Always include standard topics, even if not in database yet
  // Then add custom topics that aren't standard
  const customTopicsList = availableTopics.filter(t => !standardTopics.includes(t)).sort();
  
  // Combine: standard topics first (always available), then custom topics
  const topics = [...standardTopics, ...customTopicsList];
  
  // Ensure selectedTopic is valid - if not in topics list, set to anchor topic or first standard
  // But allow "Other" to be selected (it's a special option, not in topics list)
  useEffect(() => {
    if (topics.length > 0 && selectedTopic !== 'Other') {
      if (!topics.includes(selectedTopic)) {
        // Current selection is invalid, set to anchor topic if available, otherwise first topic
        if (topics.includes(topic)) {
          setSelectedTopic(topic);
        } else {
          setSelectedTopic(topics[0]);
        }
      }
    }
  }, [topics, topic]); // Removed selectedTopic from dependencies to avoid infinite loop

  return (
    <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-2xl font-bold text-dark-text mb-1.5 sm:mb-2 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Add New Problem</span>
        </h2>
        <p className="text-xs sm:text-sm text-dark-text-secondary">
          Add problems you solved today. You can add problems from any topic, not just today's anchor topic.
        </p>
        {topic && (
          <p className="text-xs sm:text-sm text-indigo-400 mt-1.5">
            <span className="flex items-center gap-1">
              <HiOutlineLightBulb className="w-4 h-4" />
              <span>Today's suggested topic: <span className="font-semibold">{topic}</span></span>
            </span>
          </p>
        )}
      </div>

      <form id="add-problem-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label htmlFor="problemNumber" className="block text-xs sm:text-sm font-medium text-dark-text mb-1.5 sm:mb-2">
              Problem Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="problemNumber"
                value={problemNumber}
                  onChange={(e) => {
                  setProblemNumber(e.target.value);
                  setProblemSlug(''); // Clear slug when number changes
                  setProblemTitle(''); // Clear title when number changes
                }}
                placeholder="e.g., 1922"
                className="w-full px-3 sm:px-4 py-2 pr-24 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={loading || fetching}
                required
                autoFocus
              />
              {problemNumber.trim() && (
                <button
                  type="button"
                  onClick={handleFetchProblem}
                  disabled={fetching || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 sm:px-3 py-1 text-xs bg-indigo-900/30 text-indigo-300 rounded hover:bg-indigo-800/30 disabled:bg-dark-bg-hover disabled:text-dark-text-muted transition border border-indigo-700/30"
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
            <label htmlFor="problemSlug" className="block text-xs sm:text-sm font-medium text-dark-text mb-1.5 sm:mb-2">
              Problem Slug (Auto-filled)
            </label>
            <input
              type="text"
              id="problemSlug"
              value={problemSlug}
              onChange={(e) => setProblemSlug(e.target.value)}
              placeholder="Will be auto-filled from LeetCode"
              className="w-full px-3 sm:px-4 py-2 border border-dark-border bg-dark-bg-hover text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={loading || fetching}
              readOnly={!!problemSlug && !fetching}
            />
            <p className="text-xs text-dark-text-muted mt-1">
              {problemSlug 
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
            <label htmlFor="selectedTopic" className="block text-xs sm:text-sm font-medium text-dark-text mb-1.5 sm:mb-2">
              Topic <span className="text-red-400">*</span>
            </label>
            <select
              id="selectedTopic"
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                if (e.target.value !== 'Other') {
                  setCustomTopic('');
                }
              }}
              className="w-full px-3 sm:px-4 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={loading}
              required
            >
              {topics.map(t => (
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
            {selectedTopic === 'Other' && (
              <div>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomTopic(value);
                    setError(null);
                    
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
                  className={`w-full mt-2 px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-dark-bg-tertiary text-dark-text text-sm ${
                    topicWarning ? 'border-yellow-500 bg-yellow-900/20' : 'border-dark-border'
                  }`}
                  disabled={loading}
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
          <div>
            <label htmlFor="difficulty" className="block text-xs sm:text-sm font-medium text-dark-text mb-1.5 sm:mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={loading}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-dark-text mb-1.5 sm:mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add quick notes, thoughts, or reminders about this problem..."
              rows={4}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-y min-h-[100px] leading-relaxed"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/30 text-red-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !problemNumber.trim()}
            className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-dark-bg-hover disabled:text-dark-text-muted disabled:cursor-not-allowed transition font-medium text-sm sm:text-base"
          >
            {loading ? (
              <span>Adding...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <HiOutlinePlus className="w-4 h-4" />
                <span>Add Problem</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setProblemNumber('');
              setProblemSlug('');
              setNotes('');
              setCustomTopic('');
              setSelectedTopic(topic);
              setError(null);
            }}
            className="px-3 sm:px-4 py-2 bg-dark-bg-hover text-dark-text rounded-lg hover:bg-dark-bg-secondary transition border border-dark-border text-sm sm:text-base"
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </form>

      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dark-border">
        <p className="text-xs text-dark-text-muted mb-1.5 sm:mb-2">Quick tips:</p>
        <ul className="text-xs text-dark-text-muted space-y-1">
          <li>• You can add as many problems as you want, not just 2</li>
          <li>• Problems can be from any topic, not just today's suggested topic</li>
          <li>• You can change the topic later by editing the problem</li>
          <li>• Each problem will be scheduled for review in 3 days</li>
        </ul>
      </div>
    </div>
  );
}

export default AnchorSection;

