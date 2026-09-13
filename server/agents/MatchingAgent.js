import Agent from './Agent.js';
import { Job, JobMatch, CandidateProfile } from '../models/index.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class MatchingAgent extends Agent {
  constructor(orchestrator) {
    super('Matching', orchestrator);
    this.hasApiKey = !!process.env.OPENAI_API_KEY;
  }

  async initialize() {
    await super.initialize();
    this.eventBus.subscribe('job.discovered', async (data) => {
      await this.run(data);
    });
  }

  async run(data) {
    const { userId, jobId } = data;
    this.log(`Evaluating match for user ${userId} and job ${jobId}`);

    try {
      const profile = await CandidateProfile.findOne({ where: { userId } });
      const job = await Job.findByPk(jobId);

      if (!profile || !job) {
        throw new Error('CandidateProfile or Job not found');
      }

      let matchResult;

      if (this.hasApiKey) {
        try {
          matchResult = await this.evaluateMatchWithLLM(profile, job);
        } catch (llmErr) {
          this.error('Python agent match evaluation failed, falling back to algorithm', llmErr);
          matchResult = this.evaluateMatchWithAlgorithm(profile, job);
        }
      } else {
        matchResult = this.evaluateMatchWithAlgorithm(profile, job);
      }

      // Upsert JobMatch
      const [match, created] = await JobMatch.findOrCreate({
        where: { userId, jobId },
        defaults: {
          userId,
          jobId,
          ...matchResult,
        },
      });

      if (!created) {
        await match.update(matchResult);
      }

      this.log(`Job Match calculated: ${matchResult.matchScore}% for ${job.role} at ${job.company}`);

      // Publish matched event
      this.eventBus.publish('job.matched', {
        userId,
        jobId,
        matchScore: matchResult.matchScore,
        matchId: match.id,
      });

      return match;
    } catch (err) {
      this.error(`Error during matching evaluation for user ${userId} / job ${jobId}`, err);
    }
  }

  async evaluateMatchWithLLM(profile, job) {
    return await runPythonAgent('job.match', { profile, job });
  }

  evaluateMatchWithAlgorithm(profile, job) {
    const candidateSkills = (profile.allSkills || []).map((s) => s.toLowerCase());
    const jobDescriptionLower = (job.jobDescription || '').toLowerCase();
    const jobTitleLower = (job.role || '').toLowerCase();

    // Scan job description for common skills and see if candidate has them
    const potentialSkills = [
      'react', 'vue', 'angular', 'svelte', 'typescript', 'javascript',
      'node', 'express', 'django', 'flask', 'fastapi', 'spring boot',
      'java', 'python', 'c#', 'go', 'rust', 'mysql', 'postgresql',
      'mongodb', 'redis', 'sql', 'docker', 'kubernetes', 'aws',
      'azure', 'gcp', 'git', 'linux', 'rest api', 'graphql'
    ];

    const requiredSkills = potentialSkills.filter(
      (skill) => jobDescriptionLower.includes(skill) || jobTitleLower.includes(skill)
    );

    const matchingSkills = [];
    const missingSkills = [];

    requiredSkills.forEach((skill) => {
      const normalizedSkill = skill.toUpperCase() === 'AWS' || skill.toUpperCase() === 'SQL' || skill.toUpperCase() === 'GCP' || skill.toUpperCase() === 'GIT'
        ? skill.toUpperCase()
        : skill.charAt(0).toUpperCase() + skill.slice(1);

      if (candidateSkills.some((cs) => cs.includes(skill))) {
        matchingSkills.push(normalizedSkill);
      } else {
        missingSkills.push(normalizedSkill);
      }
    });

    // Calculate score
    let score = 50; // base score for discovery

    if (requiredSkills.length > 0) {
      const matchRatio = matchingSkills.length / requiredSkills.length;
      score = 40 + (matchRatio * 50); // scales from 40 to 90
    }

    // Role title bonus
    const candidateHeadlineLower = (profile.headline || '').toLowerCase();
    const roleWords = jobTitleLower.split(' ');
    let titleMatch = false;
    roleWords.forEach((word) => {
      if (word.length > 3 && candidateHeadlineLower.includes(word)) {
        titleMatch = true;
      }
    });

    if (titleMatch) {
      score += 10;
    }

    // Caps
    score = Math.min(Math.max(Math.round(score), 10), 100);

    return {
      matchScore: score,
      explanation: {
        matchingSkills,
        missingSkills,
        relevanceSummary: `This job is a ${score}% match. The candidate possesses key skills like ${matchingSkills.slice(0, 3).join(', ') || 'general dev skills'}. Adding missing skills like ${missingSkills.slice(0, 2).join(', ') || 'advanced tools'} would improve matching potential.`,
      },
    };
  }
}
