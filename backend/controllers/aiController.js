const aiService = require('../services/aiService');

async function summarizePolicy(req, res) {
  try {
    const { policyText, siteName } = req.body;
    if (!policyText) {
      return res.status(400).json({ success: false, error: 'Missing required field: policyText' });
    }

    const result = await aiService.summarizePrivacyPolicy(policyText, siteName || 'Website');
    res.json(result);
  } catch (err) {
    console.error('Error summarizing policy in controller:', err);
    res.status(500).json({ success: false, error: 'Failed to summarize policy', details: err.message });
  }
}

module.exports = {
  summarizePolicy
};
