import Agent from './Agent.js';
import { SkillNode, CandidateProfile } from '../models/index.js';

export default class SkillExtractionAgent extends Agent {
  constructor(orchestrator) {
    super('SkillExtraction', orchestrator);
  }

  async initialize() {
    await super.initialize();
    
    // Subscribe to resume changes to automatically trigger extraction
    this.eventBus.subscribe('resume.analyzed', async (data) => {
      this.log(`Resume analyzed event received for user: ${data.userId}. Running skill extraction...`);
      await this.run({ userId: data.userId });
    });
  }

  async run(data) {
    const { userId } = data;
    this.log(`Extracting skills for user ${userId}...`);

    try {
      const profile = await CandidateProfile.findOne({ where: { userId } });
      if (!profile) {
        this.log(`No profile found for user ${userId}. Skipping extraction.`);
        return [];
      }

      const topSkills = profile.topSkills || [];
      const allSkills = profile.allSkills || [];
      const skillsToProcess = [...new Set([...topSkills, ...allSkills])];

      if (skillsToProcess.length === 0) {
        this.log(`No skills found in profile for user ${userId}.`);
        return [];
      }

      const extractedNodes = [];
      
      for (const skillName of skillsToProcess) {
        // Heuristic for mastery: top skills get 75-90%, others get 40-70%
        const isTop = topSkills.includes(skillName);
        const randomMastery = isTop 
          ? Math.floor(Math.random() * 16) + 75  // 75% to 90%
          : Math.floor(Math.random() * 31) + 40; // 40% to 70%

        const category = this.inferCategory(skillName);

        const [node, created] = await SkillNode.findOrCreate({
          where: { userId, name: skillName },
          defaults: {
            userId,
            name: skillName,
            category,
            mastery: randomMastery,
            status: randomMastery >= 80 ? 'mastered' : 'in_progress',
            careerImportance: Math.floor(Math.random() * 41) + 50, // 50-90
            prerequisites: this.inferPrerequisites(skillName),
          },
        });

        if (!created) {
          // Update existing node status
          await node.update({
            category,
            status: node.mastery >= 80 ? 'mastered' : 'in_progress',
          });
        }
        extractedNodes.push(node);
      }

      this.log(`Extracted and synchronized ${extractedNodes.length} skill nodes for user ${userId}.`);
      this.eventBus.publish('knowledge.skills_extracted', { userId, skillsCount: extractedNodes.length });
      return extractedNodes;
    } catch (err) {
      this.error(`Error during skill extraction for user ${userId}`, err);
      return [];
    }
  }

  inferCategory(skillName) {
    const name = skillName.toLowerCase().trim();
    if (
      ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'sql'].some(s => name.includes(s)) ||
      name === 'r'
    ) {
      return 'Programming';
    }
    if (['react', 'vue', 'angular', 'next.js', 'html', 'css', 'tailwind', 'sass', 'svelte', 'jquery'].some(s => name.includes(s))) {
      return 'Frontend';
    }
    if (['node', 'express', 'django', 'fastapi', 'spring', 'nest', 'laravel', 'graphql', 'rest api', 'apis'].some(s => name.includes(s))) {
      return 'Backend';
    }
    if (['aws', 'azure', 'gcp', 'cloud', 'lambda', 's3', 'ec2', 'kubernetes', 'docker', 'devops', 'cicd', 'ci/cd', 'jenkins'].some(s => name.includes(s))) {
      return 'Cloud/DevOps';
    }
    if (['mongo', 'mysql', 'postgres', 'sqlite', 'redis', 'kafka', 'database', 'sql'].some(s => name.includes(s))) {
      return 'Databases/Infrastructure';
    }
    if (['machine learning', 'ml', 'ai', 'artificial intelligence', 'scikit-learn', 'pandas', 'numpy', 'visualisation', 'statistics', 'mathematics', 'deep learning'].some(s => name.includes(s))) {
      return 'Data Science/AI';
    }
    return 'General Tech';
  }

  inferPrerequisites(skillName) {
    const name = skillName.toLowerCase();
    if (name.includes('react') || name.includes('vue') || name.includes('angular') || name.includes('next.js')) {
      return ['JavaScript'];
    }
    if (name.includes('express') || name.includes('nest')) {
      return ['Node.js', 'JavaScript'];
    }
    if (name.includes('spring')) {
      return ['Java'];
    }
    if (name.includes('fastapi') || name.includes('django') || name.includes('numpy') || name.includes('pandas')) {
      return ['Python'];
    }
    if (name.includes('kubernetes')) {
      return ['Docker'];
    }
    if (name.includes('lambda') || name.includes('s3') || name.includes('ec2')) {
      return ['AWS'];
    }
    return [];
  }
}
