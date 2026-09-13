import { CandidateProfile, InterviewPrep } from './models/index.js';
import OpenAI from 'openai';

const getOpenAI = () => {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
};

async function test() {
  const userId = 1;
  const company = 'Google';
  const role = 'Software Developer';
  const topics = '';

  try {
    console.log('1. Fetching profile...');
    const profile = await CandidateProfile.findOne({ where: { userId } });
    console.log('Profile found:', !!profile);

    const skills = profile?.topSkills || ['Software Engineering', 'System Design'];
    console.log('Skills:', skills, 'IsArray:', Array.isArray(skills));

    let questions = { technical: [], hr: [], systemDesign: [] };

    const openai = getOpenAI();
    console.log('OpenAI instance:', !!openai);
    if (openai) {
      try {
        console.log('Calling OpenAI...');
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
          console.log('Questions generated successfully via OpenAI');
        }
      } catch (aiErr) {
        console.error('AI question generation failed, using defaults:', aiErr.message);
      }
    }

    if (questions.technical.length === 0) {
      console.log('Using default questions...');
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

    console.log('2. Creating InterviewPrep in DB...');
    const prep = await InterviewPrep.create({
      userId,
      company,
      role,
      status: 'pending',
      questions
    });

    console.log('Success creating prep:', prep.id);
    await prep.destroy();
    console.log('Success cleanup');
  } catch (err) {
    console.error('Error in route logic execution:', err);
  }
}

test();
