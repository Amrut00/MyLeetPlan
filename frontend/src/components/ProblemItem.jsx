import { useState } from 'react';
import { updateProblem, deleteProblem, markProblemComplete, unmarkProblemComplete } from '../services/api';

function ProblemItem({ problem, onUpdate, showActions = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    problemNumber: problem.problemNumber,
    topic: problem.topic,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProblem(problem.id, editData);
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update problem');
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
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete problem');
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    setLoading(true);
    try {
      if (problem.isCompleted) {
        await unmarkProblemComplete(problem.id);
      } else {
        await markProblemComplete(problem.id);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update problem');
    } finally {
      setLoading(false);
    }
  };

  if (isDeleting) {
    return null; // Item is being deleted
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem Number
              </label>
              <input
                type="text"
                value={editData.problemNumber}
                onChange={(e) => setEditData({ ...editData, problemNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <select
                value={editData.topic}
                onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="Arrays & Hashing">Arrays & Hashing</option>
                <option value="Two Pointers">Two Pointers</option>
                <option value="Sliding Window">Sliding Window</option>
                <option value="Binary Search">Binary Search</option>
                <option value="Stacks">Stacks</option>
                <option value="Trees (Basics)">Trees (Basics)</option>
                <option value="Linked Lists">Linked Lists</option>
              </select>
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditData({ problemNumber: problem.problemNumber, topic: problem.topic });
                setError(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {showActions && (
              <input
                type="checkbox"
                checked={problem.isCompleted || false}
                onChange={handleToggleComplete}
                disabled={loading}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            )}
            <div>
              <span className="font-medium text-gray-700">
                Problem {problem.problemNumber}
              </span>
              <span className="text-sm text-gray-500 ml-2">({problem.topic})</span>
              {problem.addedDate && (
                <div className="text-xs text-gray-400 mt-1">
                  Added: {new Date(problem.addedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProblemItem;

