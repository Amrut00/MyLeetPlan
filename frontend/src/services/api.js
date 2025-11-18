import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Backend server is not responding. Please check if the server is running.');
    }
    return Promise.reject(error);
  }
);

// Dashboard API
export const getDashboard = async () => {
  const response = await api.get('/daily/dashboard');
  return response.data;
};

// Problems API
export const addProblems = async (problemNumbers, topic, difficulty = 'Medium', notes = '', problemSlug = '', problemTitle = '') => {
  const response = await api.post('/problems', {
    problemNumbers,
    topic,
    difficulty,
    notes,
    problemSlug,
    problemTitle,
  });
  return response.data;
};

export const markProblemComplete = async (problemId) => {
  const response = await api.patch(`/problems/${problemId}/complete`);
  return response.data;
};

export const unmarkProblemComplete = async (problemId) => {
  const response = await api.patch(`/problems/${problemId}/uncomplete`);
  return response.data;
};

export const getProblem = async (problemId) => {
  const response = await api.get(`/problems/${problemId}`);
  return response.data;
};

export const getAllProblems = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.completed !== undefined) params.append('completed', filters.completed);
  if (filters.topic) params.append('topic', filters.topic);
  
  const response = await api.get(`/problems?${params.toString()}`);
  return response.data;
};

export const getAllTopics = async () => {
  const response = await api.get('/problems/topics');
  return response.data.topics || [];
};

export const updateProblem = async (problemId, updateData) => {
  const response = await api.put(`/problems/${problemId}`, updateData);
  return response.data;
};

export const deleteProblem = async (problemId) => {
  const response = await api.delete(`/problems/${problemId}`);
  return response.data;
};

// Statistics API
export const getStatistics = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getCalendarData = async () => {
  const response = await api.get('/stats/calendar');
  return response.data;
};

// LeetCode API
export const fetchLeetCodeProblem = async (problemNumber) => {
  const response = await api.get(`/leetcode/problem/${problemNumber}`);
  return response.data;
};

// Practice Plan API
export const getPracticePlan = async () => {
  const response = await api.get('/practice-plan');
  return response.data;
};

export const savePracticePlanDay = async (dayOfWeek, anchorTopic, repetitionTopic) => {
  const response = await api.post('/practice-plan', {
    dayOfWeek,
    anchorTopic,
    repetitionTopic
  });
  return response.data;
};

export const updatePracticePlanDay = async (id, anchorTopic, repetitionTopic) => {
  const response = await api.put(`/practice-plan/${id}`, {
    anchorTopic,
    repetitionTopic
  });
  return response.data;
};

export const deletePracticePlanDay = async (id) => {
  const response = await api.delete(`/practice-plan/${id}`);
  return response.data;
};

export const initializePracticePlan = async () => {
  const response = await api.post('/practice-plan/initialize');
  return response.data;
};

// Recommendations API
export const getRecommendations = async () => {
  const response = await api.get('/recommendations');
  return response.data;
};

export default api;

