import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { authMiddleware } from './auth.js';
import { runPythonAgent } from '../agents/PythonAgentBridge.js';

import { CandidateProfile } from '../models/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/parse', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    let extractedText = '';
    
    // Parse PDF text
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdf(req.file.buffer);
      extractedText = data.text;
    } else {
      extractedText = req.file.buffer.toString('utf8');
    }

    // Delegate to FastAPI ResumeParsingAgent
    const result = await runPythonAgent('resume.parse', { resumeText: extractedText });
    
    return res.json({ message: 'Parsed and sanitized successfully (via Local Agent)', data: result });
  } catch (error) {
    console.error('--- UPLOAD PARSE ERROR ---', error);
    res.status(500).json({ message: 'Server error during parsing', error: error.message });
  }
});

function localCalculateAtsScore(resume) {
  let score = 0;
  const personal = resume.personal || {};
  if (personal.fullName) score += 5;
  if (personal.email) score += 5;
  if (personal.phone) score += 5;
  if (personal.location) score += 5;
  score += Math.min((resume.experience || []).length * 8, 25);
  score += Math.min((resume.education || []).length * 7.5, 15);
  const skillCount = (resume.skills || []).length;
  if (skillCount >= 10) score += 20;
  else if (skillCount >= 6) score += 15;
  else if (skillCount >= 3) score += 10;
  else if (skillCount > 0) score += 5;
  score += Math.min((resume.certifications || []).length * 5, 10);
  if ((personal.summary || "").length > 50) score += 10;
  score += Math.min((resume.projects || []).length * 5, 10);
  return Math.round((score / 110) * 100);
}

router.post('/ats-score', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      const profile = await CandidateProfile.findOne({ where: { userId } });
      if (profile) {
        // Construct improvements from missingSkills
        const improvements = (profile.missingSkills || []).map(skillObj => ({
          title: (skillObj.priority || 'High').charAt(0).toUpperCase() + (skillObj.priority || 'High').slice(1) + ' Priority',
          desc: `Integrate "${skillObj.skill || skillObj}" into your experience points to match recruiters' expectations.`
        }));

        // If no missing skills, add some default advice
        if (improvements.length === 0) {
          improvements.push({
            title: 'Low Priority',
            desc: 'Quantify your achievements in bullet points with metric improvements.'
          });
        }

        const responseData = {
          score: profile.atsScore || 0,
          message: 'Analysis calculated from your presently stored resume profile.',
          improvements
        };

        return res.json({ message: 'Scored successfully (via DB Profile)', data: responseData });
      }
    }

    // Fallback: If no database profile exists yet, use the request body
    const resumeData = req.body.resumeData;
    if (!resumeData) {
      return res.status(400).json({ message: 'No resume data found for this user' });
    }

    let result;
    try {
      // Try calling FastAPI ATSAnalysisAgent
      result = await runPythonAgent('ats.analyze', { profile: resumeData, jobProfile: {} });
    } catch (agentErr) {
      console.warn('[ATS Failsafe] Python agent failed, using local heuristic fallback:', agentErr.message);
      // Local Heuristic Fallback
      const score = localCalculateAtsScore(resumeData);
      const improvements = [];
      if (!(resumeData.personal?.phone)) improvements.push({ title: 'High Priority', desc: 'Add phone number to contact information.' });
      if (!(resumeData.personal?.summary)) improvements.push({ title: 'High Priority', desc: 'Add professional summary introduction.' });
      if ((resumeData.skills || []).length < 5) improvements.push({ title: 'Medium Priority', desc: 'Add more technical skills to your profile.' });
      if ((resumeData.projects || []).length < 2) improvements.push({ title: 'Low Priority', desc: 'Showcase your personal projects.' });
      
      result = {
        atsScore: score,
        evaluation: {
          formatting: 'Single-column formatting is clean.',
          message: 'Local heuristic analysis output.'
        },
        priorities: improvements.map(imp => ({
          priority: imp.title.split(' ')[0],
          action: imp.desc
        }))
      };
    }

    // Map result fields for frontend compatibility with ATSModal.jsx
    const score = result.atsScore || 70;
    const message = result.evaluation
      ? Object.values(result.evaluation).join(' ')
      : 'Your resume format and structure looks good. Review suggestions below to optimize keyword density.';
    const improvements = (result.priorities || []).map(p => ({
      title: p.priority + ' Priority',
      desc: p.action
    }));

    // If we obtained a new score from the agent, sync it to database!
    if (userId) {
      await CandidateProfile.upsert({
        userId,
        atsScore: score,
        missingSkills: (result.priorities || []).map(p => ({
          skill: p.action.match(/"([^"]+)"/) ? p.action.match(/"([^"]+)"/)[1] : p.action,
          priority: p.priority.toLowerCase()
        }))
      });
    }

    const responseData = {
      score,
      message,
      improvements
    };

    return res.json({ message: 'Scored successfully (via Local Agent / Fallback)', data: responseData });
  } catch (error) {
    console.error('--- ATS SCORING ERROR ---', error);
    res.status(500).json({ message: 'Server error during scoring', error: error.message });
  }
});

router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const { skills, targetJobDescription } = req.body;
    if (!targetJobDescription) {
      return res.json({ message: 'No job description provided', data: [] });
    }

    // Delegate to FastAPI KeywordOptimizationAgent
    const result = await runPythonAgent('keyword.optimize', { 
      profile: { allSkills: skills || [] }, 
      jobProfile: { jobDescription: targetJobDescription } 
    });
    
    return res.json({ message: 'Optimized successfully (via Local Agent)', data: result });
  } catch (error) {
    console.error('--- KEYWORD OPTIMIZATION ERROR ---', error);
    res.status(500).json({ message: 'Server error during optimization', error: error.message });
  }
});

router.post('/optimize-bio', authMiddleware, async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ message: 'No resume data provided' });
    }

    // Delegate to FastAPI ResumeImprovementAgent
    const result = await runPythonAgent('resume.improve', { profile: resumeData });
    
    return res.json({ message: 'Bio optimized successfully (via Local Agent)', data: result });
  } catch (error) {
    console.error('--- BIO OPTIMIZATION ERROR ---', error);
    res.status(500).json({ message: 'Server error during bio optimization', error: error.message });
  }
});

export default router;
