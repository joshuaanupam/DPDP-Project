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

/**
 * POST /api/ai/website-brief
 * Generates a 3-line Website Brief from page metadata.
 */
exports.getWebsiteBrief = async (req, res) => {
  try {
    const { domain, title, metaDescription, headings } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: domain'
      });
    }

    const result = await aiService.generateWebsiteBrief({ domain, title, metaDescription, headings });
    
    return res.status(200).json({
      success: result.success,
      siteName: result.siteName,
      brief: result.brief,
      isFallback: result.isFallback
    });
  } catch (error) {
    console.error('Error generating website brief:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generating website brief',
      message: error.message
    });
  }
};
