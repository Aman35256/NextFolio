import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class OfferAgent extends Agent {
  constructor(orchestrator) {
    super('Offer', orchestrator);
    this.hasApiKey = !!process.env.OPENAI_API_KEY;
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { offerData, profile } = data;
    this.log(`Analyzing job offer from ${offerData.company} for role ${offerData.role}`);

    try {
      if (this.hasApiKey) {
        try {
          return await this.analyzeWithLLM(offerData, profile);
        } catch (llmErr) {
          this.error('Python agent offer analysis failed, falling back to algorithm', llmErr);
          return this.analyzeWithAlgorithm(offerData, profile);
        }
      } else {
        return this.analyzeWithAlgorithm(offerData, profile);
      }
    } catch (err) {
      this.error('Error analyzing job offer', err);
      return this.analyzeWithAlgorithm(offerData, profile);
    }
  }

  async analyzeWithLLM(offerData, profile) {
    return await runPythonAgent('offer.analyze', { offerData, profile });
  }

  analyzeWithAlgorithm(offerData, profile) {
    const salary = parseInt(offerData.salary, 10) || 80000;
    const yoe = profile.yearsOfExperience || 2;

    // Standard baseline salary per year of experience (assumes $65k start + $8k per year)
    const baseline = 65000 + (yoe * 9000);
    const ratio = salary / baseline;

    let score = 55;
    if (ratio >= 1.2) score += 25;
    else if (ratio >= 1.0) score += 15;
    else if (ratio >= 0.8) score += 5;

    // Bonus points for equity and perks
    if (offerData.equity && offerData.equity !== 'None') score += 8;
    if (offerData.bonuses && offerData.bonuses !== 'None') score += 5;

    score = Math.min(score, 100);

    const pros = [
      `Competitive base salary of $${salary.toLocaleString()}`,
    ];
    const cons = [];

    if (offerData.equity && offerData.equity !== 'None') {
      pros.push(`Includes equity compensation (${offerData.equity})`);
    } else {
      cons.push('No equity stock options or grants included');
    }

    if (offerData.bonuses && offerData.bonuses !== 'None') {
      pros.push(`Performance or sign-on bonus potential: ${offerData.bonuses}`);
    }

    if (salary < baseline) {
      cons.push(`Base salary is slightly below typical market rates ($${baseline.toLocaleString()}) for your experience level`);
    }

    const marketComparison = `For a professional with ${yoe} years of experience, average market rates range from $${Math.round(baseline * 0.9).toLocaleString()} to $${Math.round(baseline * 1.15).toLocaleString()}. This offer sits at the ${salary > baseline * 1.05 ? 'upper' : salary < baseline * 0.95 ? 'lower' : 'average'} bound.`;

    const negotiationSuggestions = `To optimize this offer, consider requesting a 8-12% increase in the base salary, bringing it to $${Math.round(salary * 1.1).toLocaleString()}. If the company is unable to adjust the base salary, negotiate for a one-time sign-on bonus of $10,000 or additional equity grants. Script: 'I am incredibly excited about the opportunity to join ${offerData.company}. Given my specialized technical experience, I would like to ask if there is flexibility to adjust the base compensation to $${Math.round(salary * 1.1).toLocaleString()}? I am confident I will deliver high value from day one.'`;

    return {
      offerScore: score,
      pros,
      cons,
      marketComparison,
      negotiationSuggestions,
    };
  }
}
