import { InterviewPrep } from './models/index.js';

async function test() {
  try {
    const prep = await InterviewPrep.create({
      userId: 1,
      company: 'test company',
      role: 'test role',
      status: 'pending',
      questions: {
        technical: [],
        hr: [],
        systemDesign: []
      }
    });
    console.log('Success creating prep:', prep.id);
    await prep.destroy();
    console.log('Success cleanup');
  } catch (err) {
    console.error('Error in test:', err);
  }
}

test();
