# Phase 2: Resume Intelligence Agent - Complete Backend Implementation Guide

## Overview
Phase 2 builds the Resume Intelligence Agent backend that analyzes resumes, generates candidate profiles, calculates ATS scores, and identifies skill gaps.

---

## Step 1: Update Server Package.json

### Add Dependencies

```json
{
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "openai": "^4.24.0",
    "google-generative-ai": "^0.3.0",
    "pdf-parse": "^1.1.1",
    "pdfjs-dist": "^3.11.174",
    "axios": "^1.6.0"
  }
}
```

**Installation:**
```bash
cd server
npm install openai google-generative-ai pdfjs-dist axios
```

---

## Step 2: Create Database Models

### 2.1 Create `server/models/CandidateProfile.js`

```javascript
import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const CandidateProfile = sequelize.define('CandidateProfile', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  fullName: { type: DataTypes.STRING },
  headline: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  summary: { type: DataTypes.TEXT },
  yearsOfExperience: { type: DataTypes.INTEGER },
  atsScore: { type: DataTypes.FLOAT },
  skillCount: { type: DataTypes.INTEGER },
  projectCount: { type: DataTypes.INTEGER },
  allSkills: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  topSkills: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  skillCategories: {
    type: DataTypes.JSON,
    defaultValue: {
      technical: [],
      soft: [],
      tools: [],
      languages: [],
    },
  },
  experience: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  education: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  certifications: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  languages: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  missingSkills: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  profileStrength: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  lastUpdated: { type: DataTypes.DATE },
});

export default CandidateProfile;
```

### 2.2 Create `server/models/index.js` - Add Model Import

```javascript
// At the top of the existing models/index.js file:
import CandidateProfile from './CandidateProfile.js';

// Export all models
export { CandidateProfile };

// In the syncDb function, add:
await CandidateProfile.sync({ alter: true });
```

---

## Step 3: Create AI Services

### 3.1 Create `server/services/resumeParser.js`

```javascript
import * as pdf from 'pdfjs-dist';
import axios from 'axios';

// Set up PDF.js worker
pdf.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdf.version}/pdf.worker.min.js`;

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(fileBuffer) {
  try {
    const pdfDoc = await pdf.getDocument({ data: fileBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map((item) => item.str).join(' ');
      text += '\n';
    }

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Parse resume using LLM (OpenAI or Gemini)
 */
export async function parseResumeWithLLM(resumeText, llmClient) {
  const prompt = `
    Analyze this resume and extract structured information in JSON format.
    Return ONLY valid JSON with NO markdown formatting.
    
    Extract:
    {
      "personal": {
        "fullName": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "summary": "string"
      },
      "experience": [
        {
          "company": "string",
          "role": "string",
          "duration": "string",
          "description": "string",
          "yearsRelevant": number
        }
      ],
      "education": [
        {
          "institution": "string",
          "degree": "string",
          "field": "string",
          "year": "number"
        }
      ],
      "skills": ["skill1", "skill2", ...],
      "skillsDetailed": {
        "technical": ["JavaScript", "React", ...],
        "soft": ["Leadership", "Communication", ...],
        "tools": ["Git", "Docker", ...],
        "languages": ["English", "Spanish", ...]
      },
      "certifications": [
        {
          "name": "string",
          "issuer": "string",
          "year": "number"
        }
      ],
      "projects": [
        {
          "title": "string",
          "description": "string",
          "technologies": ["tech1", "tech2"],
          "link": "string"
        }
      ],
      "yearsOfExperience": number
    }
    
    Resume text:
    ${resumeText}
  `;

  try {
    if (llmClient.type === 'openai') {
      const response = await llmClient.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      
      const jsonString = response.choices[0].message.content.trim();
      return JSON.parse(jsonString);
    } else if (llmClient.type === 'gemini') {
      const response = await llmClient.client.generateContent(prompt);
      const jsonString = response.response.text().trim();
      return JSON.parse(jsonString);
    }
  } catch (error) {
    console.error('LLM parsing error:', error);
    throw new Error('Failed to parse resume with LLM');
  }
}

/**
 * Validate and normalize parsed data
 */
export function normalizeResumeData(parsed) {
  return {
    personal: {
      fullName: parsed.personal?.fullName || '',
      email: parsed.personal?.email || '',
      phone: parsed.personal?.phone || '',
      location: parsed.personal?.location || '',
      summary: parsed.personal?.summary || '',
    },
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    skillsDetailed: parsed.skillsDetailed || {},
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    yearsOfExperience: parsed.yearsOfExperience || 0,
  };
}
```

### 3.2 Create `server/services/atsScorer.js`

```javascript
/**
 * Calculate ATS Score (0-100) based on resume completeness and quality
 */
export function calculateATSScore(resumeData) {
  let score = 0;
  let totalPossible = 0;

  // Personal Info (20 points)
  totalPossible += 20;
  if (resumeData.personal?.fullName) score += 5;
  if (resumeData.personal?.email) score += 5;
  if (resumeData.personal?.phone) score += 5;
  if (resumeData.personal?.location) score += 5;

  // Experience (25 points)
  totalPossible += 25;
  const expCount = resumeData.experience?.length || 0;
  if (expCount > 0) score += Math.min(expCount * 8, 25);

  // Education (15 points)
  totalPossible += 15;
  const eduCount = resumeData.education?.length || 0;
  if (eduCount > 0) score += Math.min(eduCount * 7.5, 15);

  // Skills (20 points)
  totalPossible += 20;
  const skillCount = resumeData.skills?.length || 0;
  if (skillCount >= 5) score += 20;
  else if (skillCount >= 3) score += 15;
  else if (skillCount > 0) score += 10;

  // Certifications (10 points)
  totalPossible += 10;
  const certCount = resumeData.certifications?.length || 0;
  if (certCount > 0) score += Math.min(certCount * 5, 10);

  // Summary (10 points)
  totalPossible += 10;
  if (resumeData.personal?.summary && resumeData.personal.summary.length > 50) {
    score += 10;
  }

  // Projects (10 points)
  totalPossible += 10;
  const projCount = resumeData.projects?.length || 0;
  if (projCount > 0) score += Math.min(projCount * 5, 10);

  // Normalize to 0-100
  const finalScore = (score / totalPossible) * 100;
  return Math.round(finalScore);
}

/**
 * Identify missing skills recommendations
 */
export function getSkillRecommendations(resumeData) {
  const allSkills = resumeData.skills || [];
  const recommendations = [];

  // Common skills by category that should be in technical roles
  const technicalSkills = [
    'Git',
    'REST API',
    'SQL',
    'Linux',
    'Docker',
    'CI/CD',
    'AWS',
  ];
  const softSkills = [
    'Communication',
    'Problem Solving',
    'Leadership',
    'Teamwork',
  ];
  const languages = ['English', 'Spanish', 'Mandarin'];

  // Check for missing technical skills
  const missingTech = technicalSkills.filter(
    (s) => !allSkills.some((skill) => skill.toLowerCase().includes(s.toLowerCase()))
  );

  // Check for missing soft skills
  const missingSoft = softSkills.filter(
    (s) => !allSkills.some((skill) => skill.toLowerCase().includes(s.toLowerCase()))
  );

  if (missingTech.length > 0) {
    recommendations.push({
      category: 'Technical Skills',
      skills: missingTech,
      priority: 'high',
    });
  }

  if (missingSoft.length > 0) {
    recommendations.push({
      category: 'Soft Skills',
      skills: missingSoft,
      priority: 'medium',
    });
  }

  return recommendations;
}

/**
 * Calculate profile strength/completeness
 */
export function calculateProfileStrength(resumeData) {
  let completeness = 0;
  let totalSections = 8;

  if (resumeData.personal?.fullName) completeness++;
  if (resumeData.personal?.email) completeness++;
  if (resumeData.experience?.length > 0) completeness++;
  if (resumeData.education?.length > 0) completeness++;
  if (resumeData.skills?.length >= 5) completeness++;
  if (resumeData.certifications?.length > 0) completeness++;
  if (resumeData.projects?.length > 0) completeness++;
  if (resumeData.personal?.summary?.length > 50) completeness++;

  return (completeness / totalSections) * 100;
}
```

### 3.3 Create `server/services/skillAnalyzer.js`

```javascript
/**
 * Categorize and normalize skills
 */
export function categorizeSkills(skillsList) {
  const skillMappings = {
    technical: {
      frontend: ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
      backend: ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Java', 'Python'],
      database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQL'],
      devops: ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'AWS', 'Azure', 'GCP'],
      mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
    },
    soft: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Mentoring'],
    tools: ['Git', 'GitHub', 'GitLab', 'Jira', 'Figma', 'VSCode'],
    languages: ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese'],
  };

  const categorized = {
    technical: [],
    soft: [],
    tools: [],
    languages: [],
  };

  skillsList.forEach((skill) => {
    const skillLower = skill.toLowerCase();

    for (const [category, items] of Object.entries(skillMappings)) {
      if (category === 'technical') {
        for (const [subcat, subskills] of Object.entries(items)) {
          if (subskills.some((s) => s.toLowerCase().includes(skillLower))) {
            categorized.technical.push(skill);
            return;
          }
        }
      } else {
        if (items.some((s) => s.toLowerCase().includes(skillLower))) {
          categorized[category].push(skill);
          return;
        }
      }
    }

    // Default to technical if not categorized
    categorized.technical.push(skill);
  });

  return categorized;
}

/**
 * Extract top skills (most relevant/frequent)
 */
export function getTopSkills(skillsList, count = 6) {
  // Count skill occurrences
  const skillFrequency = {};
  skillsList.forEach((skill) => {
    skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
  });

  // Sort by frequency and return top N
  return Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([skill]) => skill);
}

/**
 * Calculate years of experience per skill
 */
export function calculateSkillExperience(resumeData) {
  const skillYears = {};
  const yearsOfExperience = resumeData.yearsOfExperience || 0;

  // Assume each skill was used for at least 1 year
  // This is a simplification - in production, would parse more carefully
  resumeData.skills?.forEach((skill) => {
    skillYears[skill] = Math.min(yearsOfExperience, Math.random() * yearsOfExperience + 1);
  });

  return skillYears;
}
```

---

## Step 4: Create Routes

### 4.1 Create `server/routes/career-agents/resume.js`

```javascript
import express from 'express';
import { CandidateProfile } from '../../models/index.js';
import {
  extractTextFromPDF,
  parseResumeWithLLM,
  normalizeResumeData,
} from '../../services/resumeParser.js';
import {
  calculateATSScore,
  getSkillRecommendations,
  calculateProfileStrength,
} from '../../services/atsScorer.js';
import {
  categorizeSkills,
  getTopSkills,
  calculateSkillExperience,
} from '../../services/skillAnalyzer.js';
import { initializeLLM } from '../../lib/llm.js';

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

    // Normalize resume data
    const normalized = normalizeResumeData(resumeData);

    // Categorize skills
    const skillCategories = categorizeSkills(normalized.skills);
    const topSkills = getTopSkills(normalized.skills);

    // Calculate scores
    const atsScore = calculateATSScore(normalized);
    const profileStrength = calculateProfileStrength(normalized);
    const missingSkills = getSkillRecommendations(normalized);
    const skillExperience = calculateSkillExperience(normalized);

    // Create or update candidate profile
    const [profile] = await CandidateProfile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        fullName: normalized.personal.fullName,
        email: normalized.personal.email,
        phone: normalized.personal.phone,
        location: normalized.personal.location,
        headline: `${normalized.skills[0] || 'Software'} Professional with ${normalized.yearsOfExperience} years of experience`,
        atsScore,
        profileStrength,
        allSkills: normalized.skills,
        topSkills,
        skillCategories,
        experience: normalized.experience,
        education: normalized.education,
        certifications: normalized.certifications,
        missingSkills: missingSkills.flatMap((m) => m.skills),
        lastUpdated: new Date(),
      },
      update: {
        fullName: normalized.personal.fullName,
        atsScore,
        profileStrength,
        allSkills: normalized.skills,
        topSkills,
        skillCategories,
        experience: normalized.experience,
        education: normalized.education,
        certifications: normalized.certifications,
        missingSkills: missingSkills.flatMap((m) => m.skills),
        lastUpdated: new Date(),
      },
    });

    res.json({
      success: true,
      profile: {
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        yearsOfExperience: normalized.yearsOfExperience,
        skills: normalized.skills,
        topSkills,
        skillCategories,
        experience: normalized.experience,
        education: normalized.education,
        certifications: normalized.certifications,
        projects: normalized.projects,
      },
      atsScore,
      profileStrength,
      missingSkills,
      skillExperience,
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

export default router;
```

---

## Step 5: Initialize LLM Client

### 5.1 Create `server/lib/llm.js`

```javascript
import OpenAI from 'openai';
import { GoogleGenerativeAI } from 'google-generative-ai';

let llmClient = null;

export function initializeLLM() {
  const provider = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'gemini'

  if (provider === 'openai') {
    llmClient = {
      type: 'openai',
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
    };
  } else if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    llmClient = {
      type: 'gemini',
      client: genAI.getGenerativeModel({ model: 'gemini-pro' }),
    };
  }

  console.log(`LLM initialized with provider: ${provider}`);
  return llmClient;
}

export function getLLMClient() {
  if (!llmClient) {
    initializeLLM();
  }
  return llmClient;
}
```

---

## Step 6: Update Server.js

```javascript
// Add to imports:
import careerAgentResumeRoutes from './routes/career-agents/resume.js';
import { initializeLLM } from './lib/llm.js';

// Initialize LLM on server start:
initializeLLM();

// Add routes:
app.use('/api/career-agents/resume', careerAgentResumeRoutes);
```

---

## Step 7: Update Environment Variables

Create/update `.env`:

```env
# LLM Configuration
LLM_PROVIDER=openai  # or 'gemini'
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=nextfolio_db
```

---

## Testing the Resume Analysis

### Using curl:

```bash
curl -X POST http://localhost:5000/api/career-agents/resume/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "resumeData": {
      "personal": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "San Francisco, CA",
        "summary": "Senior Full Stack Developer with 5 years of experience"
      },
      "skills": ["JavaScript", "React", "Node.js", "PostgreSQL", "Docker"],
      "experience": [
        {
          "company": "Tech Corp",
          "role": "Senior Developer",
          "duration": "2020-2024"
        }
      ],
      "education": [
        {
          "institution": "Stanford University",
          "degree": "BS",
          "field": "Computer Science"
        }
      ]
    }
  }'
```

---

## Success Criteria for Phase 2

✅ Resume parsing from PDF files  
✅ LLM-based structured data extraction  
✅ ATS score calculation (0-100)  
✅ Skill categorization and analysis  
✅ Missing skills recommendations  
✅ Profile strength calculation  
✅ Database storage of candidate profiles  
✅ API endpoint fully functional  

---

## Next Steps

After Phase 2, move to **Phase 3: Agent Framework Setup** which will build:
- Agent base classes
- Event-driven architecture
- Message queues (Redis + BullMQ)
- Job discovery agent initialization
