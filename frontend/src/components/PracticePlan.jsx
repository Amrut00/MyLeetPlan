import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPracticePlan, savePracticePlanDay, updatePracticePlanDay, deletePracticePlanDay, initializePracticePlan, getAllTopics } from '../services/api';
import { HiOutlineClipboardDocumentList, HiOutlinePencil, HiOutlineTrash, HiOutlineLightBulb, HiOutlineCheck } from 'react-icons/hi2';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function PracticePlan({ onUpdate }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [editData, setEditData] = useState({ anchorTopic: '', repetitionTopic: '' });
  const [availableTopics, setAvailableTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState({ anchor: '', repetition: '' });

  useEffect(() => {
    fetchPlan();
    fetchTopics();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const data = await getPracticePlan();
      setPlans(data);
      
      // If no plans exist, initialize with default
      if (data.length === 0) {
        const initialized = await initializePracticePlan();
        setPlans(initialized.plans || initialized);
      }
    } catch (error) {
      console.error('Error fetching practice plan:', error);
      toast.error('Failed to load practice plan');
    } finally {
      setLoading(false);
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

  const handleEdit = (day) => {
    const plan = plans.find(p => p.dayOfWeek === day);
    if (plan) {
      setEditingDay(day);
      setEditData({
        anchorTopic: plan.anchorTopic,
        repetitionTopic: plan.repetitionTopic
      });
      setCustomTopic({ anchor: '', repetition: '' });
    } else {
      // New plan for this day
      setEditingDay(day);
      setEditData({
        anchorTopic: '',
        repetitionTopic: ''
      });
      setCustomTopic({ anchor: '', repetition: '' });
    }
  };

  const handleSave = async (dayOfWeek) => {
    try {
      const anchorTopic = editData.anchorTopic === 'Other' ? customTopic.anchor.trim() : editData.anchorTopic;
      const repetitionTopic = editData.repetitionTopic === 'Other' ? customTopic.repetition.trim() : editData.repetitionTopic;

      if (!anchorTopic) {
        toast.error('Please enter an anchor topic');
        return;
      }

      if (!repetitionTopic) {
        toast.error('Please enter a repetition topic');
        return;
      }

      const plan = plans.find(p => p.dayOfWeek === dayOfWeek);
      
      if (plan) {
        await updatePracticePlanDay(plan._id, anchorTopic, repetitionTopic);
        toast.success('Practice plan updated!');
      } else {
        await savePracticePlanDay(dayOfWeek, anchorTopic, repetitionTopic);
        toast.success('Practice plan saved!');
      }

      setEditingDay(null);
      setEditData({ anchorTopic: '', repetitionTopic: '' });
      setCustomTopic({ anchor: '', repetition: '' });
      await fetchPlan();
      await fetchTopics(); // Refresh topics in case new ones were added
      if (onUpdate) onUpdate(); // Refresh dashboard to show updated plan
    } catch (error) {
      console.error('Error saving practice plan:', error);
      toast.error(error.response?.data?.error || 'Failed to save practice plan');
    }
  };

  const handleCancel = () => {
    setEditingDay(null);
    setEditData({ anchorTopic: '', repetitionTopic: '' });
    setCustomTopic({ anchor: '', repetition: '' });
  };

  const handleDelete = async (id, dayName) => {
    if (!window.confirm(`Are you sure you want to delete the practice plan for ${dayName}?`)) {
      return;
    }

    try {
      await deletePracticePlanDay(id);
      toast.success('Practice plan deleted!');
      await fetchPlan();
    } catch (error) {
      console.error('Error deleting practice plan:', error);
      toast.error('Failed to delete practice plan');
    }
  };

  const isCustomTopic = (topic) => {
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
    return topic && !standardTopics.includes(topic) && !availableTopics.includes(topic);
  };

  const standardTopics = [
    'Arrays & Hashing',
    'Two Pointers',
    'Sliding Window',
    'Binary Search',
    'Stacks',
    'Trees (Basics)',
    'Linked Lists'
  ];

  const customTopicsList = availableTopics.filter(t => !standardTopics.includes(t)).sort();
  const allTopics = [...standardTopics, ...customTopicsList];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-dark-text-secondary">Loading practice plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-dark-bg-tertiary rounded-lg shadow-sm border border-dark-border p-4">
        <div className="mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-text mb-2 flex items-center gap-2">
            <HiOutlineClipboardDocumentList className="w-6 h-6" />
            <span>Practice Plan</span>
          </h2>
          <p className="text-sm text-dark-text-secondary">
            Customize your weekly practice schedule. Set anchor topics (new problems) and repetition topics (review problems) for each day.
          </p>
        </div>

        <div className="overflow-x-auto border border-dark-border rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-900/30 border-b-2 border-indigo-700/30">
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-text">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-text">Anchor Topic</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark-text">Repetition Topic</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-dark-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((dayName, dayOfWeek) => {
                const plan = plans.find(p => p.dayOfWeek === dayOfWeek);
                const isEditing = editingDay === dayOfWeek;
                const isToday = new Date().getDay() === dayOfWeek;
                const isEven = dayOfWeek % 2 === 0;

                return (
                  <tr
                    key={dayOfWeek}
                    className={`border-b border-dark-border transition ${
                      isToday 
                        ? 'bg-blue-900/25 hover:bg-blue-900/35' 
                        : isEven 
                        ? 'bg-dark-bg-secondary hover:bg-dark-bg-hover' 
                        : 'bg-dark-bg-tertiary hover:bg-dark-bg-hover'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-dark-text">
                        {dayName}
                        {isToday && <span className="ml-2 text-xs text-blue-400 font-semibold">(Today)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div>
                          <select
                            value={isCustomTopic(editData.anchorTopic) ? 'Other' : editData.anchorTopic}
                            onChange={(e) => {
                              if (e.target.value === 'Other') {
                                setEditData({ ...editData, anchorTopic: 'Other' });
                                setCustomTopic({ ...customTopic, anchor: editData.anchorTopic });
                              } else {
                                setEditData({ ...editData, anchorTopic: e.target.value });
                                setCustomTopic({ ...customTopic, anchor: '' });
                              }
                            }}
                            className="w-full px-3 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select topic...</option>
                            {allTopics.map(topic => (
                              <option key={topic} value={topic}>{topic}</option>
                            ))}
                            <option value="Other">Other (Custom)</option>
                          </select>
                          {editData.anchorTopic === 'Other' && (
                            <input
                              type="text"
                              value={customTopic.anchor}
                              onChange={(e) => setCustomTopic({ ...customTopic, anchor: e.target.value })}
                              placeholder="Enter custom anchor topic..."
                              className="w-full mt-2 px-3 py-2 border border-indigo-700/30 bg-dark-bg-tertiary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                              autoFocus
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-dark-text-secondary">
                          {plan?.anchorTopic || <span className="text-dark-text-muted italic">Not set</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div>
                          <select
                            value={isCustomTopic(editData.repetitionTopic) ? 'Other' : editData.repetitionTopic}
                            onChange={(e) => {
                              if (e.target.value === 'Other') {
                                setEditData({ ...editData, repetitionTopic: 'Other' });
                                setCustomTopic({ ...customTopic, repetition: editData.repetitionTopic });
                              } else {
                                setEditData({ ...editData, repetitionTopic: e.target.value });
                                setCustomTopic({ ...customTopic, repetition: '' });
                              }
                            }}
                            className="w-full px-3 py-2 border border-dark-border bg-dark-bg-secondary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select topic...</option>
                            {allTopics.map(topic => (
                              <option key={topic} value={topic}>{topic}</option>
                            ))}
                            <option value="Other">Other (Custom)</option>
                          </select>
                          {editData.repetitionTopic === 'Other' && (
                            <input
                              type="text"
                              value={customTopic.repetition}
                              onChange={(e) => setCustomTopic({ ...customTopic, repetition: e.target.value })}
                              placeholder="Enter custom repetition topic..."
                              className="w-full mt-2 px-3 py-2 border border-indigo-700/30 bg-dark-bg-tertiary text-dark-text rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-dark-text-secondary">
                          {plan?.repetitionTopic || <span className="text-dark-text-muted italic">Not set</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSave(dayOfWeek)}
                            disabled={!editData.anchorTopic || !editData.repetitionTopic || 
                                     (editData.anchorTopic === 'Other' && !customTopic.anchor.trim()) ||
                                     (editData.repetitionTopic === 'Other' && !customTopic.repetition.trim())}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-dark-bg-hover disabled:text-dark-text-muted disabled:cursor-not-allowed transition text-sm font-medium"
                          >
                            <span className="flex items-center gap-1.5">
                              <HiOutlineCheck className="w-4 h-4" />
                              <span>Save</span>
                            </span>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1 bg-dark-bg-hover text-dark-text rounded-lg hover:bg-dark-bg-secondary transition text-sm border border-dark-border"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(dayOfWeek)}
                            className="px-3 py-1 text-indigo-400 hover:bg-dark-bg-hover rounded-lg transition text-sm font-medium"
                            title="Edit"
                          >
                            <span className="flex items-center gap-1.5">
                              <HiOutlinePencil className="w-4 h-4" />
                              <span>Edit</span>
                            </span>
                          </button>
                          {plan && (
                            <button
                              onClick={() => handleDelete(plan._id, dayName)}
                              className="px-3 py-1 text-red-400 hover:bg-dark-bg-hover rounded-lg transition text-sm font-medium"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <h3 className="font-semibold text-blue-300 mb-1.5 text-sm flex items-center gap-1.5">
            <HiOutlineLightBulb className="w-4 h-4" />
            <span>How it works:</span>
          </h3>
          <ul className="text-xs sm:text-sm text-blue-200 space-y-0.5">
            <li>• <strong>Anchor Topic:</strong> The topic for new problems you'll learn today</li>
            <li>• <strong>Repetition Topic:</strong> The topic for problems you'll review (from 3 days ago)</li>
            <li>• You can use any topic, including custom topics you've created</li>
            <li>• Changes take effect immediately for future days</li>
            <li>• Today's plan is highlighted in blue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PracticePlan;

