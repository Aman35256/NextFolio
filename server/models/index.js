import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import defineCandidateProfile from './CandidateProfile.js';
import defineJob from './Job.js';
import defineJobMatch from './JobMatch.js';
import defineApplication from './Application.js';
import defineAgentSettings from './AgentSettings.js';
import defineNotification from './Notification.js';
import defineOfferRecord from './OfferRecord.js';
import defineInterviewPrep from './InterviewPrep.js';
import defineSkillNode from './SkillNode.js';
import defineKnowledgeRoadmap from './KnowledgeRoadmap.js';
import defineDailyPlan from './DailyPlan.js';
import defineKnowledgeResource from './KnowledgeResource.js';
import defineInterviewSession from './InterviewSession.js';
import defineInterviewTranscript from './InterviewTranscript.js';
import defineInterviewAnalytics from './InterviewAnalytics.js';
import defineAgentExecution from './AgentExecution.js';
import defineEmailAccount from './EmailAccount.js';
import defineEmailMessage from './EmailMessage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false,
  dialectOptions: {
    timeout: 15000, // 15 seconds timeout to prevent SQLITE_BUSY errors
  },
});

const CandidateProfile = defineCandidateProfile(sequelize);
const Job = defineJob(sequelize);
const JobMatch = defineJobMatch(sequelize);
const Application = defineApplication(sequelize);
const AgentSettings = defineAgentSettings(sequelize);
const Notification = defineNotification(sequelize);
const OfferRecord = defineOfferRecord(sequelize);
const InterviewPrep = defineInterviewPrep(sequelize);
const SkillNode = defineSkillNode(sequelize);
const KnowledgeRoadmap = defineKnowledgeRoadmap(sequelize);
const DailyPlan = defineDailyPlan(sequelize);
const KnowledgeResource = defineKnowledgeResource(sequelize);
const InterviewSession = defineInterviewSession(sequelize);
const InterviewTranscript = defineInterviewTranscript(sequelize);
const InterviewAnalytics = defineInterviewAnalytics(sequelize);
const AgentExecution = defineAgentExecution(sequelize);
const EmailAccount = defineEmailAccount(sequelize);
const EmailMessage = defineEmailMessage(sequelize);

export const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  profileImage: { type: DataTypes.STRING },
  // Portfolio Config
  theme: { type: DataTypes.STRING, defaultValue: 'modern' },
  colorPalette: { type: DataTypes.STRING, defaultValue: 'blue' },
  layoutStyle: { type: DataTypes.STRING, defaultValue: 'standard' },
});

export const PersonalInfo = sequelize.define('PersonalInfo', {
  fullName: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  linkedin: { type: DataTypes.STRING },
  github: { type: DataTypes.STRING },
  summary: { type: DataTypes.TEXT },
});

export const Experience = sequelize.define('Experience', {
  jobTitle: { type: DataTypes.STRING },
  company: { type: DataTypes.STRING },
  startDate: { type: DataTypes.STRING },
  endDate: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
});

export const Education = sequelize.define('Education', {
  degree: { type: DataTypes.STRING },
  school: { type: DataTypes.STRING },
  graduationDate: { type: DataTypes.STRING },
});

export const Project = sequelize.define('Project', {
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  link: { type: DataTypes.STRING },
  date: { type: DataTypes.STRING },
});

export const Skill = sequelize.define('Skill', {
  name: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING, defaultValue: 'General' }, // For ATS standardisation e.g., 'Tools', 'Cloud Platforms'
});

// Relationships
User.hasOne(PersonalInfo);
PersonalInfo.belongsTo(User);

User.hasOne(CandidateProfile, { foreignKey: 'userId' });
CandidateProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Experience);
Experience.belongsTo(User);

User.hasMany(Education);
Education.belongsTo(User);

User.hasMany(Project);
Project.belongsTo(User);

User.hasMany(Skill);
Skill.belongsTo(User);

// Career Agent relationships
User.hasMany(JobMatch, { foreignKey: 'userId' });
JobMatch.belongsTo(User, { foreignKey: 'userId' });

Job.hasMany(JobMatch, { foreignKey: 'jobId' });
JobMatch.belongsTo(Job, { foreignKey: 'jobId' });

User.hasMany(Application, { foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });

Job.hasMany(Application, { foreignKey: 'jobId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });

User.hasOne(AgentSettings, { foreignKey: 'userId' });
AgentSettings.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(OfferRecord, { foreignKey: 'userId' });
OfferRecord.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(InterviewPrep, { foreignKey: 'userId' });
InterviewPrep.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SkillNode, { foreignKey: 'userId' });
SkillNode.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(KnowledgeRoadmap, { foreignKey: 'userId' });
KnowledgeRoadmap.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DailyPlan, { foreignKey: 'userId' });
DailyPlan.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AgentExecution, { foreignKey: 'userId' });
AgentExecution.belongsTo(User, { foreignKey: 'userId' });

// Interview-related relationships
User.hasMany(InterviewSession, { foreignKey: 'userId' });
InterviewSession.belongsTo(User, { foreignKey: 'userId' });

InterviewPrep.hasMany(InterviewSession, { foreignKey: 'interviewPrepId' });
InterviewSession.belongsTo(InterviewPrep, { foreignKey: 'interviewPrepId' });

InterviewSession.hasMany(InterviewTranscript, { foreignKey: 'sessionId' });
InterviewTranscript.belongsTo(InterviewSession, { foreignKey: 'sessionId' });

User.hasOne(InterviewAnalytics, { foreignKey: 'userId' });
InterviewAnalytics.belongsTo(User, { foreignKey: 'userId' });

// Email Agent relationships
User.hasMany(EmailAccount, { foreignKey: 'userId' });
EmailAccount.belongsTo(User, { foreignKey: 'userId' });

EmailAccount.hasMany(EmailMessage, { foreignKey: 'emailAccountId', onDelete: 'CASCADE' });
EmailMessage.belongsTo(EmailAccount, { foreignKey: 'emailAccountId' });

User.hasMany(EmailMessage, { foreignKey: 'userId' });
EmailMessage.belongsTo(User, { foreignKey: 'userId' });

export const syncDb = async () => {
  try {
    // Enable WAL mode and disable foreign keys for SQLite during sync
    await sequelize.query('PRAGMA journal_mode = WAL');
    await sequelize.query('PRAGMA foreign_keys = OFF');
    await sequelize.sync();
    
    // Manually add jobType column to jobs table if it doesn't exist
    try {
      await sequelize.query("ALTER TABLE jobs ADD COLUMN jobType VARCHAR(255) DEFAULT 'Full-time'");
      console.log('[syncDb] Manually added jobType column to jobs table.');
    } catch (colError) {
      // Ignore if the column already exists
    }

    // Manually add activeSources column to agent_settings table if it doesn't exist
    try {
      await sequelize.query("ALTER TABLE agent_settings ADD COLUMN activeSources JSON DEFAULT '[\"LinkedIn Jobs\", \"Indeed\", \"Wellfound\", \"Y Combinator Jobs\", \"AI Jobs\", \"Internshala\", \"Naukri.com\", \"Remote OK\", \"Remotive\", \"Arbeitnow\"]'");
      console.log('[syncDb] Manually added activeSources column to agent_settings.');
    } catch (colError) {
      // Ignore if the column already exists
    }

    // Manually add formattedData column to jobs table if it doesn't exist
    try {
      await sequelize.query("ALTER TABLE jobs ADD COLUMN formattedData JSON DEFAULT null");
      console.log('[syncDb] Manually added formattedData column to jobs table.');
    } catch (colError) {
      // Ignore if the column already exists
    }

    // Manually add new columns to applications table if they don't exist
    const applicationCols = [
      { name: 'interviewReadiness', type: 'FLOAT DEFAULT null' },
      { name: 'communicationScore', type: 'FLOAT DEFAULT null' },
      { name: 'probabilityOfSuccess', type: 'FLOAT DEFAULT null' },
      { name: 'timeline', type: "JSON DEFAULT '[]'" }
    ];
    for (const col of applicationCols) {
      try {
        await sequelize.query(`ALTER TABLE applications ADD COLUMN ${col.name}`);
        console.log(`[syncDb] Manually added ${col.name} column to applications table.`);
      } catch (colError) {
        // Ignore duplicate column errors
      }
    }

    // Add generic IMAP fields to email_accounts table if they don't exist
    const emailAccountCols = [
      { name: 'imapHost', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'imapPort', type: 'INTEGER DEFAULT null' },
      { name: 'password', type: 'TEXT DEFAULT null' }
    ];
    for (const col of emailAccountCols) {
      try {
        await sequelize.query(`ALTER TABLE email_accounts ADD COLUMN ${col.name}`);
        console.log(`[syncDb] Manually added ${col.name} column to email_accounts table.`);
      } catch (colError) {
        // Ignore duplicate column errors
      }
    }

    // Add extra scheduling fields to interview_preps table if they don't exist
    const interviewPrepCols = [
      { name: 'interviewDate', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'interviewTime', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'timezone', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'meetingLink', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'interviewerNames', type: 'JSON DEFAULT null' },
      { name: 'interviewType', type: 'VARCHAR(255) DEFAULT null' }
    ];
    for (const col of interviewPrepCols) {
      try {
        await sequelize.query(`ALTER TABLE interview_preps ADD COLUMN ${col.name}`);
        console.log(`[syncDb] Manually added ${col.name} column to interview_preps table.`);
      } catch (colError) {
        // Ignore duplicate column errors
      }
    }

    // Add extra offer fields to offer_records table if they don't exist
    const offerRecordCols = [
      { name: 'joiningDate', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'responseDeadline', type: 'VARCHAR(255) DEFAULT null' },
      { name: 'requiredDocuments', type: 'JSON DEFAULT null' }
    ];
    for (const col of offerRecordCols) {
      try {
        await sequelize.query(`ALTER TABLE offer_records ADD COLUMN ${col.name}`);
        console.log(`[syncDb] Manually added ${col.name} column to offer_records table.`);
      } catch (colError) {
        // Ignore duplicate column errors
      }
    }

    // Re-enable foreign keys
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('Database synced');
  } catch (error) {
    console.error('Database sync error:', error.message);
    throw error;
  }
};

export { CandidateProfile, Job, JobMatch, Application, AgentSettings, Notification, OfferRecord, InterviewPrep, SkillNode, KnowledgeRoadmap, DailyPlan, KnowledgeResource, InterviewSession, InterviewTranscript, InterviewAnalytics, AgentExecution, EmailAccount, EmailMessage };

export default sequelize;
