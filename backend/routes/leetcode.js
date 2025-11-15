import express from 'express';
import axios from 'axios';

const router = express.Router();

// Fetch problem slug from LeetCode using problem number
router.get('/problem/:number', async (req, res) => {
  try {
    const { number } = req.params;

    // LeetCode GraphQL endpoint (used by their frontend)
    const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql/';
    
    const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              id
              slug
            }
            hasSolution
            hasVideoSolution
          }
        }
      }
    `;

    const variables = {
      categorySlug: "",
      skip: 0,
      limit: 1,
      filters: {
        searchKeywords: number
      }
    };

    const response = await axios.post(LEETCODE_GRAPHQL_URL, {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data?.data?.problemsetQuestionList?.questions?.length > 0) {
      const problem = response.data.data.problemsetQuestionList.questions[0];
      
      // Check if the frontendQuestionId matches (in case search returns multiple)
      if (problem.frontendQuestionId === number || problem.titleSlug) {
        res.json({
          success: true,
          problemNumber: problem.frontendQuestionId,
          title: problem.title,
          slug: problem.titleSlug,
          difficulty: problem.difficulty,
          url: `https://leetcode.com/problems/${problem.titleSlug}/`
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Problem not found'
        });
      }
    } else {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
  } catch (error) {
    console.error('Error fetching LeetCode problem:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem from LeetCode',
      details: error.message
    });
  }
});

export default router;

