import express from 'express';
import { SkillNode, KnowledgeRoadmap, DailyPlan, KnowledgeResource, CandidateProfile } from '../models/index.js';
import orchestrator from '../agents/AgentOrchestrator.js';

const router = express.Router();

/**
 * GET /api/knowledge-map/skills
 * Get user skills list. Triggers initial extraction if none exist.
 */
router.get('/skills', async (req, res) => {
  try {
    const userId = req.user.id;
    const extractor = orchestrator.getAgent('skillExtraction');
    
    // Run extraction to ensure profile skills are synced
    await extractor.run({ userId });

    // Fetch all skill nodes from DB
    const skills = await SkillNode.findAll({ where: { userId } });

    // Auto-update categories for all nodes in DB to keep them in sync with latest heuristics
    for (const skill of skills) {
      const correctCategory = extractor.inferCategory(skill.name);
      if (skill.category !== correctCategory) {
        await skill.update({ category: correctCategory });
      }
    }

    res.json({ success: true, skills });
  } catch (error) {
    console.error('Fetch skills error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/knowledge-map/skills/extract
 * Manually trigger skill extraction
 */
router.post('/skills/extract', async (req, res) => {
  try {
    const userId = req.user.id;
    const extractor = orchestrator.getAgent('skillExtraction');
    
    // Run extraction to ensure profile skills are synced
    await extractor.run({ userId });

    // Fetch all skill nodes from DB
    const skills = await SkillNode.findAll({ where: { userId } });

    // Auto-update categories for all nodes in DB to keep them in sync with latest heuristics
    for (const skill of skills) {
      const correctCategory = extractor.inferCategory(skill.name);
      if (skill.category !== correctCategory) {
        await skill.update({ category: correctCategory });
      }
    }

    res.json({ success: true, skills, message: 'Skills successfully extracted.' });
  } catch (error) {
    console.error('Manual skill extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/knowledge-map/skills/:id/mastery
 * Update skill mastery level
 */
router.put('/skills/:id/mastery', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { mastery } = req.body;

    const skill = await SkillNode.findOne({ where: { id, userId } });
    if (!skill) {
      return res.status(404).json({ error: 'Skill node not found' });
    }

    const updatedMastery = Math.min(100, Math.max(0, parseInt(mastery)));
    const status = updatedMastery >= 80 ? 'mastered' : updatedMastery > 0 ? 'in_progress' : 'locked';

    await skill.update({ mastery: updatedMastery, status });

    // Re-evaluate roadmap readiness score if they have one
    const roadmap = await KnowledgeRoadmap.findOne({ where: { userId } });
    if (roadmap) {
      const skillsList = await SkillNode.findAll({ where: { userId } });
      const roadSteps = roadmap.roadmapData || [];
      
      const updatedSteps = roadSteps.map((step) => {
        const matching = skillsList.find((s) => s.name.toLowerCase() === step.name.toLowerCase());
        if (matching) {
          return {
            ...step,
            mastery: matching.mastery,
            status: matching.status,
            isMissing: matching.mastery < 40,
          };
        }
        return step;
      });

      const masteredCount = updatedSteps.filter((s) => s.mastery >= 70).length;
      const readinessScore = Math.round((masteredCount / updatedSteps.length) * 100);

      await roadmap.update({
        roadmapData: updatedSteps,
        readinessScore,
      });
    }

    res.json({ success: true, skill });
  } catch (error) {
    console.error('Update skill mastery error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge-map/roadmap
 * Fetch current roadmap
 */
router.get('/roadmap', async (req, res) => {
  try {
    const userId = req.user.id;
    const roadmap = await KnowledgeRoadmap.findOne({ where: { userId } });
    res.json({ success: true, roadmap });
  } catch (error) {
    console.error('Fetch roadmap error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/knowledge-map/roadmap/generate
 * Select role and generate custom roadmap
 */
router.post('/roadmap/generate', async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({ error: 'Target role is required' });
    }

    const roadmapAgent = orchestrator.getAgent('roadmap');
    const roadmap = await roadmapAgent.run({ userId, targetRole });

    res.json({ success: true, roadmap });
  } catch (error) {
    console.error('Generate roadmap error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge-map/daily
 * Get Today's Learning Plan
 */
router.get('/daily', async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];
    
    let plan = await DailyPlan.findOne({ where: { userId, date: todayStr } });
    if (!plan) {
      const dailyAgent = orchestrator.getAgent('dailyPlan');
      plan = await dailyAgent.run({ userId });
    }

    res.json({ success: true, plan });
  } catch (error) {
    console.error('Fetch daily plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/knowledge-map/daily/tasks/:taskId/complete
 * Complete a specific task
 */
router.put('/daily/tasks/:taskId/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const dailyAgent = orchestrator.getAgent('dailyPlan');
    const plan = await dailyAgent.completeTask(userId, taskId);

    if (!plan) {
      return res.status(404).json({ error: 'Daily plan or task not found' });
    }

    // Fetch refreshed roadmap for level details
    const roadmap = await KnowledgeRoadmap.findOne({ where: { userId } });

    res.json({ success: true, plan, roadmap });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/knowledge-map/mentor/chat
 * Conversations with tutor
 */
router.post('/mentor/chat', async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, chatHistory } = req.body;

    const mentor = orchestrator.getAgent('mentorship');
    const result = await mentor.run({ userId, message, chatHistory: chatHistory || [] });

    if (typeof result === 'string') {
      res.json({ success: true, reply: result });
    } else {
      res.json({
        success: true,
        reply: result.reply,
        detectedMode: result.detectedMode,
        detectedLevel: result.detectedLevel,
        proactiveSuggestion: result.proactiveSuggestion
      });
    }
  } catch (error) {
    console.error('AI Mentor chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/knowledge-map/resources/:skillName
 * Recommended courses/articles for a skill
 */
router.get('/resources/:skillName', async (req, res) => {
  try {
    const { skillName } = req.params;
    
    // Seed some general defaults
    const defaults = [
      {
        skillName,
        title: `Official ${skillName} Documentation`,
        type: 'documentation',
        url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' official documentation')}`,
        difficulty: 'beginner'
      },
      {
        skillName,
        title: `Complete ${skillName} Guide for Beginners`,
        type: 'video',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial for beginners')}`,
        difficulty: 'beginner'
      },
      {
        skillName,
        title: `Advanced ${skillName} Concepts and Best Practices`,
        type: 'article',
        url: `https://medium.com/search?q=${encodeURIComponent(skillName)}`,
        difficulty: 'advanced'
      },
      {
        skillName,
        title: `Interactive ${skillName} Exercises`,
        type: 'coding_platform',
        url: 'https://leetcode.com',
        difficulty: 'intermediate'
      }
    ];

    res.json({ success: true, resources: defaults });
  } catch (error) {
    console.error('Fetch resources error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
