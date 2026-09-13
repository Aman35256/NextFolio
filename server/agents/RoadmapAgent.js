import Agent from './Agent.js';
import { SkillNode, KnowledgeRoadmap } from '../models/index.js';

export default class RoadmapAgent extends Agent {
  constructor(orchestrator) {
    super('Roadmap', orchestrator);
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { userId, targetRole } = data;
    this.log(`Generating roadmap for user ${userId} targeting: ${targetRole}`);

    try {
      const userSkills = await SkillNode.findAll({ where: { userId } });
      const userSkillNames = userSkills.map((s) => s.name.toLowerCase());

      const template = this.getRoleTemplate(targetRole);
      
      // Calculate matching and missing skills
      const steps = template.map((skillName, index) => {
        const matchingNode = userSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
        const isKnown = !!matchingNode;
        const mastery = isKnown ? matchingNode.mastery : 0;
        const status = isKnown ? matchingNode.status : 'locked';

        return {
          step: index + 1,
          name: skillName,
          mastery,
          status,
          isMissing: !isKnown || mastery < 40,
        };
      });

      const knownCount = steps.filter((s) => s.mastery >= 70).length;
      const readinessScore = Math.round((knownCount / steps.length) * 100);

      // Save or update KnowledgeRoadmap
      const [roadmap, created] = await KnowledgeRoadmap.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          targetRole,
          readinessScore,
          roadmapData: steps,
          xp: 150, // bonus for starting roadmap
          level: 1,
          streak: 0,
        },
      });

      if (!created) {
        await roadmap.update({
          targetRole,
          readinessScore,
          roadmapData: steps,
        });
      }

      // Automatically add missing skills as 'locked' nodes in the database to display them
      for (const step of steps) {
        if (step.isMissing) {
          const exists = userSkills.some((s) => s.name.toLowerCase() === step.name.toLowerCase());
          if (!exists) {
            // Get category and pre-req helpers
            const category = this.orchestrator.agents.skillExtraction
              ? this.orchestrator.agents.skillExtraction.inferCategory(step.name)
              : 'General';
            const prerequisites = this.orchestrator.agents.skillExtraction
              ? this.orchestrator.agents.skillExtraction.inferPrerequisites(step.name)
              : [];

            await SkillNode.create({
              userId,
              name: step.name,
              category,
              mastery: 0,
              status: 'locked',
              careerImportance: Math.floor(Math.random() * 20) + 70, // Missing ones get higher importance
              prerequisites,
            });
          }
        }
      }

      this.log(`Roadmap generated. Readiness: ${readinessScore}%. Saved.`);
      return roadmap;
    } catch (err) {
      this.error(`Error generating roadmap for user ${userId}`, err);
      return null;
    }
  }

  getRoleTemplate(role) {
    const defaultTemplate = ['Git', 'JavaScript', 'HTML/CSS', 'React', 'Node.js', 'REST APIs', 'SQL'];
    
    switch (role) {
      case 'Frontend Developer':
        return ['HTML/CSS', 'Git', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'React', 'Next.js', 'Vite', 'Redux', 'Jest'];
      case 'Backend Developer':
        return ['Git', 'Python', 'Java', 'Node.js', 'Express', 'REST APIs', 'SQL', 'PostgreSQL', 'Docker', 'Redis', 'Kafka', 'System Design'];
      case 'Full Stack Developer':
        return ['HTML/CSS', 'Git', 'JavaScript', 'React', 'Node.js', 'Express', 'REST APIs', 'PostgreSQL', 'Docker', 'AWS', 'System Design', 'CI/CD'];
      case 'AI Engineer':
        return ['Python', 'Mathematics', 'Git', 'Data Processing', 'FastAPI', 'OpenAI API', 'LangChain', 'Vector Databases', 'Prompt Engineering', 'Deployment'];
      case 'ML Engineer':
        return ['Python', 'Mathematics', 'Git', 'Pandas/NumPy', 'TensorFlow/PyTorch', 'Model Training', 'Scikit-Learn', 'MLOps', 'Docker', 'Kubernetes'];
      case 'Data Scientist':
        return ['Python', 'Mathematics', 'Pandas/NumPy', 'SQL', 'Data Visualisation', 'Scikit-Learn', 'Statistics', 'R', 'Jupyter', 'Machine Learning'];
      case 'DevOps Engineer':
        return ['Linux', 'Git', 'Bash/Python', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform', 'AWS', 'Prometheus/Grafana', 'Security'];
      case 'Cloud Engineer':
        return ['Linux', 'Networking', 'Git', 'AWS', 'EC2/S3', 'IAM', 'Lambda', 'Docker', 'Kubernetes', 'CloudFormation', 'Monitoring'];
      case 'Cybersecurity Engineer':
        return ['Linux', 'Networking', 'Security Fundamentals', 'Cryptography', 'Penetration Testing', 'Firewalls', 'SIEM', 'Incident Response', 'Identity Management'];
      case 'Product Manager':
        return ['Agile/Scrum', 'Product Analytics', 'User Research', 'Wireframing', 'Roadmapping', 'A/B Testing', 'SQL', 'System Architecture Basics', 'Soft Skills'];
      default:
        return defaultTemplate;
    }
  }
}
