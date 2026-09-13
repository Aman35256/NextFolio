import Agent from './Agent.js';
import { runPythonAgent } from './PythonAgentBridge.js';

export default class JobDescriptionAgent extends Agent {
  constructor(orchestrator) {
    super('JobDescription', orchestrator);
  }

  async run(payload) {
    this.log('Parsing Job Description requirements...');
    try {
      // Attempt Python agent first
      return await runPythonAgent('job.parse', payload);
    } catch (err) {
      this.error('FastAPI parser agent is offline or failed. Running local JS heuristic fallback...', err);
      // Fallback directly in JavaScript
      return this.fallbackParseJob(
        payload.jobDescription || '',
        payload.role || 'Software Engineer',
        payload.company || 'Employer',
        payload.location || 'Remote',
        payload.salary || 'Not specified by the employer.',
        payload.jobType || 'Full-time'
      );
    }
  }

  fallbackParseJob(text, roleHint, companyHint, locationHint, salaryHint, jobTypeHint) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Extract key skills
    const skills = [];
    const keywords = ["Python", "JavaScript", "React", "Node.js", "Java", "C++", "TypeScript", "SQL", "AWS", "Docker", "Kubernetes", "Git", "Go", "Rust", "FastAPI", "Django", "HTML", "CSS"];
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(text)) {
        skills.push(kw);
      }
    }

    const benefits = [];
    const benefitKeywords = ["Health Insurance", "Remote Work", "Bonus", "Paid Leave", "Learning Budget", "Flexible Hours", "Stock Options", "Gym", "Wellness"];
    for (const ben of benefitKeywords) {
      const regex = new RegExp(`\\b${ben}\\b`, 'i');
      if (regex.test(text)) {
        benefits.push(ben);
      }
    }

    const softSkills = [];
    const softKeywords = ["Communication", "Leadership", "Problem Solving", "Critical Thinking", "Teamwork", "Ownership", "Adaptability", "Time Management", "Decision Making", "Collaboration"];
    for (const soft of softKeywords) {
      const regex = new RegExp(`\\b${soft}\\b`, 'i');
      if (regex.test(text)) {
        softSkills.push(soft);
      }
    }

    const role = roleHint || "Software Engineer";
    const company = companyHint || "Employer";
    const location = locationHint || "Remote";
    const salary = salaryHint || "Not specified by the employer.";
    const jobType = jobTypeHint || "Full-time";

    let education = "Not specified by the employer.";
    const degreeKeywords = ["Bachelor", "Master", "PhD", "B.S.", "M.S.", "Degree"];
    for (const deg of degreeKeywords) {
      if (text.toLowerCase().includes(deg.toLowerCase())) {
        education = "Degree in Computer Science or related field";
        break;
      }
    }

    const resps = [];
    for (const line of lines) {
      if (/^[-*•]/.test(line) || /responsible for|responsibilities|key tasks/i.test(line)) {
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        if (clean.length > 10 && clean.length < 200 && resps.length < 8) {
          resps.push(clean);
        }
      }
    }

    if (resps.length === 0) {
      resps.push(
        "Execute software development tasks.",
        "Collaborate with engineering teams.",
        "Maintain clean, testable code base."
      );
    }

    let summary = `We are looking for a dedicated ${role} to join our team at ${company}. `;
    summary += `This is a ${jobType} role based in ${location}. `;
    if (skills.length > 0) {
      summary += `The ideal candidate will have experience in ${skills.slice(0, 3).join(', ')}.`;
    } else {
      summary += "You will work on engineering, designing, and optimizing core product features.";
    }

    return {
      role,
      companyOverview: {
        logo: "",
        name: company,
        industry: "Technology",
        size: "Not specified by the employer.",
        website: "Not specified by the employer.",
        description: `Innovative tech company hiring a ${role}.`,
        mission: "Not specified by the employer.",
        culture: "Collaborative and product-focused."
      },
      jobSummary: summary,
      employmentDetails: {
        employmentType: jobType,
        experience: "Not specified by the employer.",
        workMode: /remote/i.test(location) || /remote/i.test(text) ? "Remote" : "On-site",
        location,
        department: "Engineering",
        reportingManager: "Engineering Lead",
        salary,
        workingHours: "Full-time hours",
        postingDate: "Not specified by the employer.",
        applicationDeadline: "Not specified by the employer."
      },
      responsibilities: resps,
      requiredQualifications: {
        education,
        experience: "Relevant industry experience",
        mandatorySkills: skills.length > 0 ? skills.slice(0, 4) : ["Software Development"],
        certifications: [],
        licenses: [],
        other: []
      },
      technicalSkills: {
        programmingLanguages: skills.filter(s => ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust"].includes(s)),
        frameworks: skills.filter(s => ["React", "FastAPI", "Django", "Node.js"].includes(s)),
        libraries: [],
        databases: /sql/i.test(text) ? ["SQL"] : [],
        cloud: /aws/i.test(text) ? ["AWS"] : [],
        devOps: /docker/i.test(text) ? ["Docker"] : [],
        operatingSystems: [],
        testing: [],
        tools: [],
        versionControl: /git/i.test(text) ? ["Git"] : [],
        aiMl: [],
        security: [],
        networking: [],
        mobile: [],
        otherTechnologies: []
      },
      preferredQualifications: [
        "Experience with modern software design patterns.",
        "Strong analytical skills."
      ],
      softSkills: softSkills.length > 0 ? softSkills : ["Problem Solving", "Collaboration"],
      projects: [
        "Building robust and scalable web applications.",
        "Writing clean, testing-verified APIs."
      ],
      techStack: {
        backend: skills.filter(s => ["Python", "Node.js", "FastAPI", "Go", "Rust"].includes(s)),
        frontend: skills.filter(s => ["React", "HTML", "CSS", "TypeScript"].includes(s)),
        database: /sql/i.test(text) ? ["SQL"] : [],
        cloud: /aws/i.test(text) ? ["AWS"] : [],
        ai: [],
        infrastructure: /docker/i.test(text) ? ["Docker"] : [],
        testing: [],
        monitoring: [],
        deployment: []
      },
      benefits: benefits.length > 0 ? benefits : ["Competitive Salary", "Flexible Working Hours"],
      careerGrowth: [
        "Continuous learning resources.",
        "Technical advancement paths."
      ],
      hiringProcess: [
        "Resume Screening",
        "Technical Interview",
        "Managerial Discussion",
        "Offer"
      ],
      atsKeywords: skills.length > 0 ? skills : ["Software Engineer", "Developer"],
      applicationInstructions: {
        resumeRequired: true,
        portfolioRequired: false,
        githubRequired: false,
        linkedinRequired: false,
        coverLetterRequired: false,
        otherDocuments: [],
        deadline: "Not specified by the employer.",
        applyLink: "https://example.com/apply"
      }
    };
  }
}
