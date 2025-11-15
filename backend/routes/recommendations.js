import express from 'express';
import Problem from '../models/Problem.js';
import { generateSmartRecommendations } from '../utils/recommendations.js';

const router = express.Router();

// Get smart problem recommendations
router.get('/', async (req, res) => {
  try {
    // Get all problems user has solved
    const solvedProblems = await Problem.find({ isCompleted: true });
    const solvedProblemNumbers = solvedProblems.map(p => p.problemNumber);
    
    // Get today's topic from practice plan or dashboard
    let todayTopic = null;
    try {
      const PracticePlan = (await import('../models/PracticePlan.js')).default;
      const { getTodayDayOfWeek } = await import('../utils/dayUtils.js');
      const dayOfWeek = getTodayDayOfWeek();
      const practicePlan = await PracticePlan.findOne({ dayOfWeek });
      
      if (practicePlan) {
        todayTopic = practicePlan.anchorTopic; // Use anchor topic for recommendations
      } else {
        // Fallback to default topics
        const { getTodayTopics } = await import('../utils/dayUtils.js');
        const topics = getTodayTopics();
        todayTopic = topics.anchor;
      }
    } catch (error) {
      console.warn('Could not fetch today\'s topic:', error);
      // Continue without topic filtering
    }
    
    // Generate smart recommendations
    const recommendations = await generateSmartRecommendations(
      solvedProblems,
      solvedProblemNumbers,
      todayTopic
    );
    
    // Check if AI reasoning was used (if recommendations have detailed reasoning, AI was used)
    const hasAIReasoning = recommendations.pair && recommendations.pair.length > 0 && 
                          recommendations.pair[0].reasoning && 
                          recommendations.pair[0].reasoning.length > 100; // AI reasoning is usually longer
    
    res.json({
      success: true,
      recommendations,
      solvedCount: solvedProblems.length,
      totalInCuratedList: 96, // Total problems in curated list (updated from 70 to 96)
      source: 'curated-list', // Always from curated list
      aiEnhanced: hasAIReasoning, // Whether AI reasoning was used
      groqAvailable: !!process.env.GROQ_API_KEY, // Whether Groq API key is configured
      todayTopic: todayTopic // Today's topic for reference
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recommendations', 
      details: error.message 
    });
  }
});

export default router;

