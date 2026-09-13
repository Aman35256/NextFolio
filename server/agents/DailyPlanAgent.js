import Agent from './Agent.js';
import { SkillNode, DailyPlan, KnowledgeRoadmap } from '../models/index.js';

export default class DailyPlanAgent extends Agent {
  constructor(orchestrator) {
    super('DailyPlan', orchestrator);
  }

  async initialize() {
    await super.initialize();
  }

  async run(data) {
    const { userId } = data;
    const todayStr = new Date().toISOString().split('T')[0];
    this.log(`Generating Today's Learning Plan for user ${userId} on date: ${todayStr}`);

    try {
      // Find what skills the user is learning
      const skills = await SkillNode.findAll({ where: { userId } });
      const inProgress = skills.filter((s) => s.status === 'in_progress');
      const locked = skills.filter((s) => s.status === 'locked');

      let targetSkills = [];
      if (inProgress.length > 0) {
        targetSkills = inProgress.slice(0, 2);
      } else if (locked.length > 0) {
        targetSkills = locked.slice(0, 2);
      } else {
        // Default skills if none found
        targetSkills = [{ name: 'Git' }, { name: 'JavaScript' }];
      }

      // Generate 3 tasks based on target skills
      const skill1 = targetSkills[0].name;
      const skill2 = targetSkills[1] ? targetSkills[1].name : skill1;

      const tasks = [
        {
          id: 'task-1',
          text: `Read documentation on ${skill1} fundamentals and core concepts.`,
          duration: 30, // minutes
          completed: false,
          type: 'read',
        },
        {
          id: 'task-2',
          text: `Practice coding: implement small ${skill1} exercises or interactive challenges.`,
          duration: 45,
          completed: false,
          type: 'code',
        },
        {
          id: 'task-3',
          text: `Mini-Project: Configure or build a small sample application integrating ${skill2}.`,
          duration: 60,
          completed: false,
          type: 'project',
        },
      ];

      // Save or update DailyPlan
      const [plan, created] = await DailyPlan.findOrCreate({
        where: { userId, date: todayStr },
        defaults: {
          userId,
          date: todayStr,
          tasks,
          completed: false,
        },
      });

      if (!created) {
        await plan.update({ tasks });
      }

      this.log(`Daily plan generated with ${tasks.length} tasks.`);
      return plan;
    } catch (err) {
      this.error(`Error generating daily plan for user ${userId}`, err);
      return null;
    }
  }

  async completeTask(userId, taskId) {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const plan = await DailyPlan.findOne({ where: { userId, date: todayStr } });
      if (!plan) return null;

      const updatedTasks = plan.tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, completed: true };
        }
        return task;
      });

      const allCompleted = updatedTasks.every((t) => t.completed);
      await plan.update({ tasks: updatedTasks, completed: allCompleted });

      // Reward XP points to the user on roadmap
      const roadmap = await KnowledgeRoadmap.findOne({ where: { userId } });
      if (roadmap) {
        const bonusXp = 50; // XP per task completed
        let newXp = roadmap.xp + bonusXp;
        let newLevel = roadmap.level;

        // Simple level-up algorithm: each level requires level * 200 XP
        const xpNeeded = newLevel * 200;
        if (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          newLevel += 1;
          this.log(`User ${userId} leveled up to Level ${newLevel}!`);
        }

        // Handle daily streak increase if plan is fully completed
        let newStreak = roadmap.streak;
        if (allCompleted) {
          newStreak += 1;
        }

        await roadmap.update({
          xp: newXp,
          level: newLevel,
          streak: newStreak,
          lastActiveDate: new Date(),
        });
      }

      return plan;
    } catch (err) {
      this.error(`Error completing task ${taskId} for user ${userId}`, err);
      return null;
    }
  }
}
