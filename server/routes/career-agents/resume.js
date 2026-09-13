import express from 'express';
import { CandidateProfile } from '../../models/index.js';
import { runPythonAgent } from '../../agents/PythonAgentBridge.js';

const router = express.Router();

/**
 * POST /api/career-agents/resume/analyze
 * Analyze resume and generate candidate profile
 */
router.post('/analyze', async (req, res) => {
  try {
    const { resumeData } = req.body;
    const userId = req.user?.id;

    if (!userId || !resumeData) {
      return res.status(400).json({
        error: 'Missing required fields: userId, resumeData',
      });
    }

    // Call local FastAPI Resume Analysis Service
    const analysisResult = await runPythonAgent('resume.analyze', { resumeData });
    const { 
      profileData, 
      profilePayload, 
      atsScore, 
      missingSkills, 
      skillsGraph, 
      resumeSummary, 
      skillRecommendations, 
      profileStrength, 
      metrics, 
      recommendations 
    } = analysisResult;

    // Create or update candidate profile in SQLite database
    const [profile, created] = await CandidateProfile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        ...profileData,
      },
    });

    if (!created) {
      await profile.update(profileData);
    }

    res.json({
      success: true,
      profile: {
        id: profile.id,
        ...profilePayload
      },
      atsScore,
      missingSkills,
      skillsGraph,
      resumeSummary,
      skillRecommendations,
      profileStrength,
      metrics,
      recommendations,
      message: 'Resume analyzed successfully',
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/resume/profile
 * Get candidate profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await CandidateProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: profile.dataValues,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/career-agents/resume/profile
 * Update candidate profile
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { fullName, headline, location, phone, email, summary } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await CandidateProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await profile.update({
      fullName: fullName || profile.fullName,
      headline: headline || profile.headline,
      location: location || profile.location,
      phone: phone || profile.phone,
      email: email || profile.email,
      summary: summary || profile.summary,
      lastUpdated: new Date(),
    });

    res.json({
      success: true,
      profile: profile.dataValues,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
