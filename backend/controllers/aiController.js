/**
 * @file aiController.js
 * @description Controller for Unified AI Website Summary endpoints.
 * Serving Extension, Website Detail Modal, and RECLAIM popup.
 */

const aiService = require('../services/aiService');

/**
 * POST /api/ai/website-summary
 * Core Unified Endpoint for website-specific factual AI summaries.
 */
exports.getWebsiteSummary = async (req, res) => {
  try {
    const {
      domain,
      websiteName,
      language = 'EN',
      pageTitle,
      metaDescription,
      headings,
      policyText,
      verifiedData,
      forceRefresh
    } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: domain'
      });
    }

    const result = await aiService.getWebsiteSummary({
      domain,
      websiteName,
      language,
      pageTitle,
      metaDescription,
      headings,
      policyText,
      verifiedData,
      forceRefresh
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getWebsiteSummary controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generating website summary',
      message: error.message
    });
  }
};

/**
 * POST /api/ai/summarize-policy (Legacy Alias)
 */
exports.summarizePolicy = async (req, res) => {
  try {
    const { policyText, siteName = 'Website', language = 'EN' } = req.body;
    const result = await aiService.getWebsiteSummary({
      domain: siteName,
      websiteName: siteName,
      policyText,
      language
    });
    return res.status(200).json({
      success: true,
      summary: result.bullets.join('\n'),
      bullets: result.bullets,
      riskLevel: 'Medium',
      isFallback: result.source !== 'gemini',
      modelUsed: result.source
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/ai/website-brief (Legacy Alias)
 */
exports.getWebsiteBrief = async (req, res) => {
  try {
    const { domain, title, metaDescription, headings, language = 'EN' } = req.body;
    const result = await aiService.getWebsiteSummary({
      domain,
      pageTitle: title,
      metaDescription,
      headings,
      language
    });
    return res.status(200).json({
      success: result.success,
      siteName: result.websiteName,
      brief: result.bullets.join('\n'),
      bullets: result.bullets,
      summary: result.summary,
      isFallback: result.source !== 'gemini'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
