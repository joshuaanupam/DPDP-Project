/**
 * @file aiController.js
 * @description Controller for AI Policy Summarization endpoints.
 * Powered by Gemini API and rule-based fallback.
 */

const aiService = require('../services/aiService');

/**
 * POST /api/ai/summarize-policy
 * Summarizes long legal terms into 2 plain-English sentences.
 */
exports.summarizePolicy = async (req, res) => {
  try {
    const { policyText, siteName = 'Website' } = req.body;

    if (!policyText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: policyText'
      });
    }

    const result = await aiService.summarizePrivacyPolicy(policyText, siteName);
    
    return res.status(200).json({
      success: true,
      summary: result.summary,
      bullets: result.bullets,
      riskLevel: result.riskLevel,
      isFallback: result.isFallback,
      modelUsed: result.modelUsed
    });
  } catch (error) {
    console.error('Error in AI policy summarizer controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Error summarizing policy',
      message: error.message
    });
  }
};
