import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { InterviewPrep, InterviewSession, InterviewTranscript, InterviewAnalytics, Job, CandidateProfile, SkillNode, Application, JobMatch } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';
import InterviewSessionService from '../../services/InterviewSessionService.js';
import CommunicationAnalysisService from '../../services/CommunicationAnalysisService.js';
import SpeechRecognitionService from '../../services/SpeechRecognitionService.js';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const sessionService = new InterviewSessionService();
const communicationService = new CommunicationAnalysisService();
const speechService = new SpeechRecognitionService();
let openaiInstance = null;
const getOpenAI = () => {
  if (!openaiInstance && process.env.OPENAI_API_KEY) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
};

function runSpeakSmartAnalyzer(audioPath) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '../../services/speaksmart_analyzer.py');
    const pythonProcess = spawn('python', ['-u', scriptPath, audioPath]);
    
    let stdoutData = '';
    let stderrData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`speaksmart_analyzer.py exited with code ${code}. Stderr: ${stderrData}`);
      }
      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (err) {
        console.error('Failed to parse speaksmart_analyzer.py output:', err, 'Raw output:', stdoutData);
        resolve({
          success: false,
          error: err.message,
          confidenceScore: 70,
          nervousnessScore: 25,
          speakingRate: 130,
          speakingCoverage: 80,
          pitchHistory: [],
          rmsHistory: [],
          timestamps: [],
          confidenceHistory: [],
          nervousMoments: [],
          suggestions: ['Could not parse physical speech characteristics.'],
          indicators: [],
          metrics: { averagePitch: 0, pitchStability: 0, pitchRange: 0, duration: 0 }
        });
      }
    });
  });
}

/**
 * GET /api/career-agents/interviews/prep
 * Get all interview preparation kits for the user
 */
router.get('/prep', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preps = await InterviewPrep.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });

    res.json({ success: true, preps });
  } catch (error) {
    console.error('Fetch interview preps error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/prep/create
 * Create a custom practice kit for a company & role
 */
router.post('/prep/create', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { company, role, topics } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!company || !role) {
      return res.status(400).json({ error: 'Company and Role are required' });
    }

    // Try to get CandidateProfile to personalize
    const profile = await CandidateProfile.findOne({ where: { userId } });
    const skills = profile?.topSkills || ['Software Engineering', 'System Design'];

    let questions = { technical: [], hr: [], systemDesign: [] };

    // Use OpenAI to generate highly customized and tailored questions if configured
    const openai = getOpenAI();
    if (openai) {
      try {
        const prompt = `
Generate custom interview questions for a candidate preparing for the following position:
- Company: ${company}
- Target Role: ${role}
- Candidate Tech Stack / Skills: ${skills.join(', ')}
${topics ? `- Additional Focus Topics: ${topics}` : ''}

Generate exactly 5 questions distributed as follows:
- 2 Technical questions tailored to the Candidate's skills and the target role/company domain.
- 2 Behavioral (HR) questions tailored to the company's culture and typical hiring principles (e.g. leadership principles).
- 1 System Design question tailored to the role.

For each question, provide an "answerOutline" indicating what topics the candidate should cover to answer successfully.

Format your response ONLY as a JSON object (no markdown formatting, no code blocks) with fields:
{
  "technical": [
    { "question": "Question text", "answerOutline": "Key topics to discuss" }
  ],
  "hr": [
    { "question": "Question text", "answerOutline": "Key topics to discuss" }
  ],
  "systemDesign": [
    { "question": "Question text", "answerOutline": "Key topics to discuss" }
  ]
}
`;
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        if (parsed.technical && parsed.hr && parsed.systemDesign) {
          questions = parsed;
        }
      } catch (aiErr) {
        console.error('AI question generation failed, using defaults:', aiErr);
      }
    }

    // Fallback templates if AI is not configured or fails
    if (questions.technical.length === 0) {
      questions = {
        technical: [
          { question: `Explain your experience working with ${skills[0] || 'software systems'} and building engineering pipelines at scale.`, answerOutline: 'Discuss modular components, profiling tools, data stores, and production optimization.' },
          { question: `What are the core performance bottlenecks you typically anticipate when deploying a ${role} application, and how do you resolve them?`, answerOutline: 'Explain caching strategies, load management, API request batching, and code splits.' }
        ],
        hr: [
          { question: `Why are you interested in joining the engineering team at ${company}?`, answerOutline: 'Connect personal expertise and developer growth with the company mission and product space.' },
          { question: `Tell me about a time you had to deliver a critical feature under a tight schedule. How did you organize your priorities?`, answerOutline: 'Explain scoping decisions, stakeholder transparency, technical trade-offs, and STAR structure.' }
        ],
        systemDesign: [
          { question: `How would you design a highly scalable, fault-tolerant system to support key services for ${company}'s core business?`, answerOutline: 'Discuss high availability, caching layer, database shards, load balancers, and failure modes.' }
        ]
      };
    }

    const prep = await InterviewPrep.create({
      userId,
      company,
      role,
      status: 'pending',
      questions
    });

    res.json({
      success: true,
      prep,
      message: `Custom practice kit created successfully for ${role} at ${company}.`
    });
  } catch (error) {
    console.error('Create custom prep kit error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/interviews/prep/:prepId/details
 * Fetch detailed context for an interview preparation kit (Left Panel)
 */
router.get('/prep/:prepId/details', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { prepId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const prep = await InterviewPrep.findOne({ where: { id: prepId, userId } });
    if (!prep) {
      return res.status(404).json({ error: 'Interview prep kit not found' });
    }

    // Find matching job details
    const job = await Job.findOne({
      where: { company: prep.company, role: prep.role }
    });

    // Find candidate profile
    const profile = await CandidateProfile.findOne({ where: { userId } });

    // Find completed sessions for this prep
    const sessions = await InterviewSession.findAll({
      where: { interviewPrepId: prepId, userId },
      order: [['createdAt', 'DESC']]
    });

    // Find user skill nodes
    const skills = await SkillNode.findAll({
      where: { userId },
      order: [['mastery', 'DESC']]
    });

    res.json({
      success: true,
      prep,
      job: job || { company: prep.company, role: prep.role, jobDescription: 'No job description available.' },
      profile: profile || { headline: 'Candidate Profile', summary: 'No resume details found.' },
      history: sessions,
      skills: skills || []
    });
  } catch (error) {
    console.error('Fetch prep details error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/mock/chat
 * Send user message and get next mock interviewer question
 */
router.post('/mock/chat', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { prepId, message } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const prep = await InterviewPrep.findOne({ where: { id: prepId, userId } });
    if (!prep) {
      return res.status(404).json({ error: 'Interview prep kit not found' });
    }

    let chatHistory = prep.mockChatHistory || [];
    
    // Add user response
    chatHistory.push({ role: 'user', content: message });

    // Determine next question or wrap up
    const mockQuestions = prep.mockQuestions || [];
    const questionsAsked = chatHistory.filter((m) => m.role === 'agent').length;
    let nextMessage = '';

    if (questionsAsked < mockQuestions.length) {
      nextMessage = mockQuestions[questionsAsked];
      chatHistory.push({ role: 'agent', content: nextMessage });
    } else {
      nextMessage = "Thank you for completing this mock interview! We have gathered your responses and are now grading your performance. Please click 'Complete and Grade' to view your results.";
      chatHistory.push({ role: 'agent', content: nextMessage });
    }

    await prep.update({
      mockChatHistory: chatHistory,
      status: 'started',
    });

    res.json({
      success: true,
      chatHistory,
      nextMessage,
      completed: questionsAsked >= mockQuestions.length,
    });
  } catch (error) {
    console.error('Mock interview chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/mock/grade
 * Grade the mock interview response transcript
 */
router.post('/mock/grade', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { prepId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const prep = await InterviewPrep.findOne({ where: { id: prepId, userId } });
    if (!prep) {
      return res.status(404).json({ error: 'Interview prep kit not found' });
    }

    const interviewAgent = orchestrator.getAgent('interview');
    const updatedPrep = await interviewAgent.gradeMockInterview(prepId, prep.mockChatHistory);

    res.json({
      success: true,
      prep: updatedPrep,
      message: 'Mock interview graded successfully.',
    });
  } catch (error) {
    console.error('Mock interview grading error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI INTERVIEW STUDIO ENDPOINTS ====================

/**
 * POST /api/career-agents/interviews/studio/session/create
 * Create a new AI interview session
 */
router.post('/studio/session/create', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { prepId, interviewerPersona, difficulty, interviewType } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await sessionService.createSession(userId, prepId, {
      interviewerPersona: interviewerPersona || 'Senior Engineer',
      difficulty: difficulty || 'medium',
      interviewType: interviewType || 'mixed',
    });

    res.json({
      success: true,
      session,
      message: 'Interview session created successfully',
    });
  } catch (error) {
    console.error('Error creating interview session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/session/start
 * Start an interview session
 */
router.post('/studio/session/start', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await sessionService.startSession(sessionId, userId);

    res.json({
      success: true,
      session,
      message: 'Interview started',
    });
  } catch (error) {
    console.error('Error starting interview session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/session/pause
 * Pause or resume an interview session
 */
router.post('/studio/session/pause', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await sessionService.pauseSession(sessionId, userId);

    res.json({
      success: true,
      session,
      message: `Interview ${session.status === 'paused' ? 'paused' : 'resumed'}`,
    });
  } catch (error) {
    console.error('Error pausing interview session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/session/end
 * End and complete an interview session
 */
router.post('/studio/session/end', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await sessionService.endSession(sessionId, userId);

    res.json({
      success: true,
      session,
      message: 'Interview completed',
    });
  } catch (error) {
    console.error('Error ending interview session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/interviews/studio/session/:sessionId
 * Get session details with transcripts
 */
router.get('/studio/session/:sessionId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await sessionService.getSessionWithDetails(sessionId, userId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/interviews/studio/sessions
 * Get all interview sessions for user
 */
router.get('/studio/sessions', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessions = await sessionService.getUserSessions(userId);

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/transcript
 * Add transcript for a question response
 */
router.post('/studio/transcript', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId, questionIndex, question, answer, audioUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transcript = await sessionService.addTranscript(
      sessionId,
      userId,
      questionIndex,
      question,
      answer,
      audioUrl
    );

    res.json({
      success: true,
      transcript,
      message: 'Transcript recorded',
    });
  } catch (error) {
    console.error('Error adding transcript:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/analyze
 * Analyze a response and return communication scores
 */
router.post('/studio/analyze', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { transcriptId, sessionId, answer, audioMetadata, audioAnalysis } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch session details for context
    let sessionContext = {};
    if (sessionId) {
      const session = await InterviewSession.findOne({ where: { id: sessionId, userId } });
      if (session) {
        const currentQ = session.questions?.[session.currentQuestionIndex];
        sessionContext = {
          question: currentQ?.question || 'General interview question',
          persona: session.interviewerPersona,
          role: session.role,
          company: session.company,
          difficulty: session.difficulty
        };
      }
    }

    // Perform communication analysis
    const analysis = await communicationService.analyzeResponse(answer, audioMetadata, sessionContext, audioAnalysis);

    // Update transcript with analysis
    if (transcriptId) {
      await sessionService.updateTranscriptAnalysis(transcriptId, userId, analysis);
    }

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing response:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/transcribe
 * Transcribe audio to text using Whisper
 */
router.post('/studio/transcribe', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Validate audio
    const validation = speechService.validateAudioQuality(req.file.buffer);
    if (!validation.valid) {
      return res.status(400).json({ error: `Invalid audio: ${validation.reason}` });
    }

    // Save buffer temporarily to run SpeakSmart Python analysis
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);

    // Run transcription and SpeakSmart audio analyzer in parallel
    const [transcribeResult, audioAnalysis] = await Promise.all([
      speechService.transcribeAudio(req.file.buffer, req.file.originalname),
      runSpeakSmartAnalyzer(tempPath)
    ]);

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      console.error('Failed to delete temporary audio file:', cleanupError);
    }

    // Get audio metadata
    const metadata = speechService.getAudioMetadata(req.file.buffer);

    res.json({
      success: true,
      text: transcribeResult.text,
      confidence: transcribeResult.confidence,
      metadata,
      audioAnalysis,
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/next-question
 * Get the next interview question with adaptive difficulty
 */
router.post('/studio/next-question', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await InterviewSession.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const nextIndex = session.currentQuestionIndex + 1;
    const totalQuestions = session.questions?.length || 5;

    if (nextIndex >= totalQuestions) {
      return res.json({
        success: true,
        question: null,
        completed: true,
        message: 'Interview completed',
      });
    }

    // Retrieve transcripts for conversation history
    const transcripts = await InterviewTranscript.findAll({
      where: { sessionId, userId },
      order: [['questionIndex', 'ASC']]
    });

    let question = session.questions[nextIndex];

    if (getOpenAI() && transcripts.length > 0) {
      try {
        const historyText = transcripts.map((t, idx) => `
Interviewer (${session.interviewerPersona}): "${t.question}"
Candidate: "${t.answer}"
Technical Score: ${t.technicalScore || 70}/100
Communication Score: ${t.communicationScore || 70}/100
        `).join('\n\n');

        const prompt = `
You are roleplaying as the AI Interviewer:
- Persona: ${session.interviewerPersona}
- Target Role: ${session.role} at ${session.company}
- Interview Difficulty: ${session.difficulty}

Here is the conversation history so far:
${historyText}

Based on the candidate's last responses:
1. If the candidate struggled or gave an incomplete explanation, ask an in-character follow-up question or request clarification.
2. If they performed exceptionally well, ask a slightly more challenging next question.
3. Keep the question completely in character for a ${session.interviewerPersona}.
4. Target question type: ${question?.type || 'mixed'}.

Return ONLY a JSON object (no markdown formatting, no code blocks) with the following structure:
{
  "question": "The actual question text",
  "type": "technical" | "behavioral" | "system_design",
  "difficulty": "easy" | "medium" | "hard"
}
`;

        const response = await getOpenAI().chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const generatedQ = JSON.parse(response.choices[0].message.content);
        if (generatedQ && generatedQ.question) {
          question = {
            question: generatedQ.question,
            type: generatedQ.type || question.type || 'technical',
            answerOutline: 'Generated dynamically'
          };
          
          // Update the session's question list with the dynamically generated question
          const sessionQuestions = [...session.questions];
          sessionQuestions[nextIndex] = question;
          await session.update({ questions: sessionQuestions });
        }
      } catch (err) {
        console.error('Failed to generate adaptive question, falling back to static questions:', err);
      }
    }

    // Update session progress
    await session.update({
      currentQuestionIndex: nextIndex,
      questionCount: nextIndex + 1,
    });

    res.json({
      success: true,
      question,
      questionIndex: nextIndex,
      totalQuestions,
      completed: false,
    });
  } catch (error) {
    console.error('Error getting next question:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/interviews/studio/generate-feedback
 * Generate detailed feedback report for the interview
 */
router.post('/studio/generate-feedback', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await sessionService.getSessionWithDetails(sessionId, userId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const transcripts = session.InterviewTranscripts || [];

    if (!getOpenAI() || !process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Prepare analysis summary
    const analysisText = transcripts.map((t, idx) => `
Question ${idx + 1}: ${t.question}
Answer: ${t.answer}
Communication Score: ${t.communicationScore}/100
Technical Score: ${t.technicalScore}/100
Confidence: ${t.confidenceScore}/100
Analysis Details: ${JSON.stringify(t.analysisData)}
    `).join('\n\n');

    // Generate feedback using GPT
    const feedbackPrompt = `
You are an expert interview coach. Based on the following interview analysis, provide a comprehensive session feedback report:

${analysisText}

Please provide:
1. Overall Strengths (3-4 points)
2. Areas for Improvement (3-4 points)
3. Specific Suggestions (5-6 actionable items, e.g., reduce filler words, slow down, explain design trade-offs)
4. Interview Readiness Assessment (string summary)
5. Weak Concepts (array of short tech/behavioral concepts they struggled with, e.g., ["Caching", "System Design", "STAR Framework"])
6. Strong Concepts (array of short tech/behavioral concepts they excelled in, e.g., ["React", "API Design", "Confidence"])

Format your response ONLY as a JSON object (no markdown formatting, no code blocks) with fields:
{
  "strengths": ["string"],
  "improvements": ["string"],
  "suggestions": ["string"],
  "readinessAssessment": "string",
  "weakConcepts": ["string"],
  "strongConcepts": ["string"]
}
`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: feedbackPrompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const feedbackData = JSON.parse(response.choices[0].message.content);

    // Save weak concepts and feedback into session record
    const weakConceptsList = feedbackData.weakConcepts || [];
    const strongConceptsList = feedbackData.strongConcepts || [];

    await session.update({
      feedback: feedbackData,
      weakConcepts: weakConceptsList,
    });

    // 1. Update Knowledge Map (SkillNode table) based on weak and strong concepts
    const userSkills = await SkillNode.findAll({ where: { userId } });
    
    // Process weak concepts
    for (const concept of weakConceptsList) {
      const match = userSkills.find(s => s.name.toLowerCase() === concept.toLowerCase());
      if (match) {
        const newMastery = Math.max(20, Math.round(match.mastery - 10));
        await match.update({
          mastery: newMastery,
          status: newMastery >= 85 ? 'mastered' : 'in_progress'
        });
      } else {
        await SkillNode.create({
          userId,
          name: concept,
          category: 'Interview Deficiencies',
          mastery: 30,
          status: 'in_progress',
          careerImportance: 80,
          prerequisites: []
        });
      }
    }

    // Process strong concepts
    for (const concept of strongConceptsList) {
      const match = userSkills.find(s => s.name.toLowerCase() === concept.toLowerCase());
      if (match) {
        const newMastery = Math.min(100, Math.round(match.mastery + 15));
        await match.update({
          mastery: newMastery,
          status: newMastery >= 75 ? 'mastered' : 'in_progress'
        });
      } else {
        await SkillNode.create({
          userId,
          name: concept,
          category: 'Interview Strengths',
          mastery: 80,
          status: 'mastered',
          careerImportance: 80,
          prerequisites: []
        });
      }
    }

    // 2. Locate corresponding Job Application and sync stats
    const prep = await InterviewPrep.findByPk(session.interviewPrepId);
    if (prep) {
      const application = await Application.findOne({
        where: { userId },
        include: [{
          model: Job,
          required: true,
          where: { company: prep.company, role: prep.role }
        }]
      });

      if (application) {
        // Find ATS match score
        const match = await JobMatch.findOne({
          where: { userId, jobId: application.jobId }
        });
        const matchScore = match ? match.matchScore : 75;

        // Calculate success probability based on match score (40%) and interview readiness (60%)
        const readiness = session.interviewReadiness || 70;
        const probabilityOfSuccess = Math.round((matchScore * 0.4) + (readiness * 0.6));

        // Update application
        let timeline = application.timeline || [];
        if (typeof timeline === 'string') {
          try { timeline = JSON.parse(timeline); } catch (e) { timeline = []; }
        }
        timeline.push({
          stage: 'Interview Practice Completed',
          date: new Date().toISOString().split('T')[0],
          details: `Completed AI Coach Mock. Readiness: ${readiness}%, Comm Score: ${session.communicationScore}%`
        });

        let auditLog = application.auditLog || [];
        if (typeof auditLog === 'string') {
          try { auditLog = JSON.parse(auditLog); } catch (e) { auditLog = []; }
        }
        auditLog.push({
          timestamp: new Date().toISOString(),
          message: `AI Coach Evaluation: Overall ${session.overallScore}/100. Interview readiness set to ${readiness}%. Success probability: ${probabilityOfSuccess}%.`
        });

        await application.update({
          status: 'interview_completed',
          interviewReadiness: readiness,
          communicationScore: session.communicationScore,
          probabilityOfSuccess,
          timeline,
          auditLog
        });
      }
    }

    res.json({
      success: true,
      feedback: feedbackData,
      sessionScores: {
        overall: session.overallScore,
        communication: session.communicationScore,
        technical: session.technicalScore,
        behavior: session.behaviorScore,
        confidence: session.confidenceScore,
        interviewReadiness: session.interviewReadiness,
      }
    });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/career-agents/interviews/studio/analytics
 * Get user's interview analytics
 */
router.get('/studio/analytics', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analytics = await sessionService.getUserAnalytics(userId);

    res.json({
      success: true,
      analytics: analytics || {
        totalInterviews: 0,
        completedInterviews: 0,
        averageCommunicationScore: 0,
        averageTechnicalScore: 0,
        averageConfidenceScore: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
