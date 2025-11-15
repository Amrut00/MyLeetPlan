import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load curated problems
let curatedProblems = null;

export function loadCuratedProblems() {
  if (curatedProblems) return curatedProblems;
  
  try {
    const filePath = path.join(__dirname, '../data/curatedProblems.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    curatedProblems = JSON.parse(fileContent);
    return curatedProblems;
  } catch (error) {
    console.error('Error loading curated problems:', error);
    return [];
  }
}

// Check if user has solved all prerequisites
export function hasPrerequisitesMet(problem, solvedProblemNumbers) {
  if (!problem.prerequisites || problem.prerequisites.length === 0) {
    return true;
  }
  
  return problem.prerequisites.every(prereq => 
    solvedProblemNumbers.includes(prereq.toString())
  );
}

// Get available problems (prerequisites met, not yet solved)
export function getAvailableProblems(solvedProblemNumbers) {
  const problems = loadCuratedProblems();
  const solvedSet = new Set(solvedProblemNumbers.map(n => n.toString()));
  
  return problems.filter(problem => {
    // Not already solved
    if (solvedSet.has(problem.problemNumber)) {
      return false;
    }
    
    // Prerequisites met
    return hasPrerequisitesMet(problem, solvedProblemNumbers);
  });
}

// Get next problems in learning order, prioritizing today's topic
// allowMixing: if true, will fill with other topics if not enough from today's topic (for AI candidates)
export function getNextProblems(solvedProblemNumbers, count = 2, todayTopic = null, allowMixing = false) {
  const available = getAvailableProblems(solvedProblemNumbers);
  
  // If today's topic is provided, prioritize problems from that topic
  if (todayTopic) {
    const todayTopicProblems = available.filter(problem => 
      problem.topics && problem.topics.some(topic => 
        topic.toLowerCase().includes(todayTopic.toLowerCase()) ||
        todayTopic.toLowerCase().includes(topic.toLowerCase())
      )
    );
    
    // Sort today's topic problems by learning order
    todayTopicProblems.sort((a, b) => a.learningOrder - b.learningOrder);
    
    // If we have enough problems from today's topic, return them
    if (todayTopicProblems.length >= count) {
      return todayTopicProblems.slice(0, count);
    }
    
    // If allowMixing is true (for AI candidates), fill with other topics
    if (allowMixing && todayTopicProblems.length > 0) {
      const result = [...todayTopicProblems];
      const otherProblems = available.filter(problem => 
        !problem.topics || !problem.topics.some(topic => 
          topic.toLowerCase().includes(todayTopic.toLowerCase()) ||
          todayTopic.toLowerCase().includes(topic.toLowerCase())
        )
      );
      otherProblems.sort((a, b) => a.learningOrder - b.learningOrder);
      
      const needed = count - result.length;
      result.push(...otherProblems.slice(0, needed));
      return result;
    }
    
    // If we have some but not enough from today's topic and not mixing, return what we have
    if (todayTopicProblems.length > 0) {
      return todayTopicProblems; // Return all available from today's topic (even if less than count)
    }
    
    // No problems from today's topic available - return empty array
    // This will be handled by the frontend to show a message
    return [];
  }
  
  // No topic specified, just sort by learning order
  available.sort((a, b) => a.learningOrder - b.learningOrder);
  
  // Return first 'count' problems (for pairs, count = 2)
  return available.slice(0, count);
}

// Generate smart recommendations using Groq Cloud
export async function generateSmartRecommendations(userProblems, solvedProblemNumbers, todayTopic = null) {
  // Check if Groq API key is available
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not set, using basic recommendations');
    return getBasicRecommendations(solvedProblemNumbers, todayTopic);
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Try different Groq model names - common models available on Groq
    const modelNames = [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
      'openai/gpt-oss-120b'
    ];
    let modelName = modelNames[0];
    
    const available = getAvailableProblems(solvedProblemNumbers);
    
    // Check how many problems from today's topic are available
    const todayTopicProblems = todayTopic ? available.filter(problem => 
      problem.topics && problem.topics.some(topic => 
        topic.toLowerCase().includes(todayTopic.toLowerCase()) ||
        todayTopic.toLowerCase().includes(topic.toLowerCase())
      )
    ) : [];
    
    // If only 1 problem from today's topic is available, return only that one
    if (todayTopic && todayTopicProblems.length === 1) {
      const singleProblem = todayTopicProblems[0];
      return {
        pair: [{
          ...singleProblem,
          reasoning: `This is the next problem in your learning sequence (order ${singleProblem.learningOrder}). Once you solve this, more problems from today's topic "${todayTopic}" will become available.`,
          whatYoullLearn: `Practice with ${singleProblem.topics && singleProblem.topics.length > 0 ? singleProblem.topics[0] : 'general'} using ${singleProblem.difficulty} difficulty problems.`,
          estimatedDifficulty: singleProblem.difficulty
        }],
        overallReasoning: `Only one problem from today's topic "${todayTopic}" is currently available. Solve this problem first to unlock more problems from this topic.`,
        singleProblemMessage: `Only one problem from today's topic is available. Solve this to unlock more!`
      };
    }
    
    // Get 5 candidates for AI - allow mixing so AI has options, but prioritize today's topic
    const nextProblems = getNextProblems(solvedProblemNumbers, 5, todayTopic, true);
    
    // Prepare user stats
    const userStats = {
      totalSolved: userProblems.length,
      topicsCovered: [...new Set(userProblems.map(p => p.topic))],
      difficultyDistribution: {
        Easy: userProblems.filter(p => p.difficulty === 'Easy').length,
        Medium: userProblems.filter(p => p.difficulty === 'Medium').length,
        Hard: userProblems.filter(p => p.difficulty === 'Hard').length
      },
      recentProblems: userProblems.slice(-10).map(p => ({
        number: p.problemNumber,
        title: p.problemTitle,
        topic: p.topic,
        difficulty: p.difficulty
      }))
    };
    
    const prompt = `You are a coding interview preparation assistant helping a beginner learn LeetCode problems.

User's Progress:
- Total problems solved: ${userStats.totalSolved}
- Topics covered: ${userStats.topicsCovered.join(', ')}
- Difficulty breakdown: Easy: ${userStats.difficultyDistribution.Easy}, Medium: ${userStats.difficultyDistribution.Medium}, Hard: ${userStats.difficultyDistribution.Hard}
- Recent problems solved: ${JSON.stringify(userStats.recentProblems, null, 2)}
- Today's focus topic: ${todayTopic}

Available problems to recommend (next in learning order, prioritized by today's topic):
${JSON.stringify(nextProblems.map(p => ({
  number: p.problemNumber,
  title: p.problemTitle,
  difficulty: p.difficulty,
  topics: p.topics,
  learningOrder: p.learningOrder,
  matchesTodayTopic: p.topics && p.topics.some(t => t.toLowerCase().includes(todayTopic.toLowerCase()))
})), null, 2)}

Task: Recommend problems as a pair for today's practice. CRITICAL REQUIREMENTS:
1. PRIORITIZE problems from today's topic: "${todayTopic}" - try to recommend 2 problems from this topic
2. If there are 2+ problems from today's topic available, recommend exactly 2 from today's topic
3. If there is only 1 problem from today's topic available, you can include 1 problem from another topic to make a pair
4. The problems should be the next in the learning sequence (respecting prerequisites)
5. A good learning pair (complementary, not overwhelming)
6. Appropriate for a beginner at this stage

IMPORTANT: Always try to return exactly 2 problems. If you can't find 2 from today's topic, include 1 from another topic to complete the pair.

Return JSON in this exact format:
{
  "pair": [
    {
      "problemNumber": "number",
      "reasoning": "Why this problem is recommended for the user at this stage",
      "whatYoullLearn": "What concepts/skills this problem teaches",
      "estimatedDifficulty": "Easy|Medium|Hard for you"
    },
    {
      "problemNumber": "number",
      "reasoning": "Why this problem is recommended for the user at this stage",
      "whatYoullLearn": "What concepts/skills this problem teaches",
      "estimatedDifficulty": "Easy|Medium|Hard for you"
    }
  ],
  "overallReasoning": "Why this pair works well together for today's practice, especially focusing on ${todayTopic}"
}

Format as valid JSON only, no markdown code blocks.`;

    // Make API request to GrokCloud
    let text = '';
    let lastError = null;
    
    // Try each model until one works
    for (const model of modelNames) {
      try {
        const response = await axios.post(
          apiUrl,
          {
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        text = response.data.choices[0]?.message?.content || '';
        modelName = model;
        console.log(`✅ Using Groq model: ${modelName}`);
        
        if (text) break; // Success, exit loop
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Model ${model} failed, trying next...`);
        continue; // Try next model
      }
    }
    
    if (!text) {
      throw new Error(`No valid Groq model found. Tried: ${modelNames.join(', ')}. Last error: ${lastError?.response?.data?.error?.message || lastError?.message}`);
    }
    
    // Extract JSON from response (remove markdown if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const recommendations = JSON.parse(text);
    
    // Enrich with full problem data
    const problemsMap = new Map(
      loadCuratedProblems().map(p => [p.problemNumber, p])
    );
    
    recommendations.pair = recommendations.pair.map(rec => {
      const problem = problemsMap.get(rec.problemNumber);
      if (!problem) return null;
      
      return {
        ...problem,
        reasoning: rec.reasoning,
        whatYoullLearn: rec.whatYoullLearn,
        estimatedDifficulty: rec.estimatedDifficulty
      };
    }).filter(Boolean);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating Groq recommendations:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorDetails: error.response?.data
    });
    
    // Check if it's an API key issue
    const status = error.response?.status;
    if (error.message?.includes('API') || status === 401 || status === 403) {
      console.warn('⚠️  Groq API key issue detected. Please check your GROQ_API_KEY in .env file.');
      console.warn('💡 The system will use basic recommendations (no AI reasoning) until the API key is fixed.');
    } else if (status === 404) {
      console.warn('⚠️  Groq model not found. The API key might be valid but the model name is incorrect.');
      console.warn('💡 The system will use basic recommendations (no AI reasoning).');
    }
    
    // Fallback to basic recommendations
    return getBasicRecommendations(solvedProblemNumbers, todayTopic);
  }
}

// Basic recommendations (fallback when Groq AI is not available)
export function getBasicRecommendations(solvedProblemNumbers, todayTopic = null) {
  const available = getAvailableProblems(solvedProblemNumbers);
  
  // Check how many problems from today's topic are available
  const todayTopicProblems = todayTopic ? available.filter(problem => 
    problem.topics && problem.topics.some(topic => 
      topic.toLowerCase().includes(todayTopic.toLowerCase()) ||
      todayTopic.toLowerCase().includes(topic.toLowerCase())
    )
  ) : [];
  
  // If only 1 problem from today's topic is available, return only that one
  if (todayTopic && todayTopicProblems.length === 1) {
    const singleProblem = todayTopicProblems[0];
    return {
      pair: [{
        ...singleProblem,
        reasoning: `This is the next problem in your learning sequence (order ${singleProblem.learningOrder}). Once you solve this, more problems from today's topic "${todayTopic}" will become available.`,
        whatYoullLearn: `Practice with ${singleProblem.topics && singleProblem.topics.length > 0 ? singleProblem.topics[0] : 'general'} using ${singleProblem.difficulty} difficulty problems.`,
        estimatedDifficulty: singleProblem.difficulty
      }],
      overallReasoning: `Only one problem from today's topic "${todayTopic}" is currently available. Solve this problem first to unlock more problems from this topic.`,
      singleProblemMessage: `Only one problem from today's topic is available. Solve this to unlock more!`
    };
  }
  
  const nextProblems = getNextProblems(solvedProblemNumbers, 2, todayTopic);
  
  const topicNote = todayTopic 
    ? ` These problems are prioritized from today's topic: ${todayTopic}.`
    : '';
  
  return {
    pair: nextProblems.map(problem => ({
      ...problem,
      reasoning: `Next problem in your learning sequence (order ${problem.learningOrder}). This builds on problems you've already solved.${todayTopic && problem.topics && problem.topics.some(t => t.toLowerCase().includes(todayTopic.toLowerCase())) ? ` This problem matches today's topic: ${todayTopic}.` : ''}`,
      whatYoullLearn: `Practice with ${problem.topics && problem.topics.length > 0 ? problem.topics[0] : 'general'} using ${problem.difficulty} difficulty problems.`,
      estimatedDifficulty: problem.difficulty
    })),
    overallReasoning: `These are the next 2 problems in your curated learning path. They follow the proper sequence and prerequisites.${topicNote}`
  };
}

