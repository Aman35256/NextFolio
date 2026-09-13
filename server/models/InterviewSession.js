import { DataTypes } from 'sequelize';

export default function defineInterviewSession(sequelize) {
  return sequelize.define(
    'InterviewSession',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      interviewPrepId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      interviewerPersona: {
        type: DataTypes.STRING,
        defaultValue: 'Senior Engineer', // 'HR Recruiter', 'Software Engineer', 'Senior Engineer', 'Engineering Manager', 'CTO', 'Product Manager'
      },
      difficulty: {
        type: DataTypes.STRING,
        defaultValue: 'medium', // 'easy', 'medium', 'hard'
      },
      interviewType: {
        type: DataTypes.STRING,
        defaultValue: 'behavioral', // 'technical', 'behavioral', 'mixed'
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'not_started', // 'not_started', 'in_progress', 'completed', 'paused'
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER, // in seconds
        defaultValue: 0,
      },
      questionCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      questions: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      currentQuestionIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // Overall scores
      overallScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      communicationScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      technicalScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      behaviorScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      confidenceScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      interviewReadiness: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      // Detailed analysis
      analysisData: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      // Post-interview feedback
      feedback: {
        type: DataTypes.JSON,
        defaultValue: {
          strengths: [],
          weaknesses: [],
          suggestions: [],
        },
      },
      // Improvement tracking
      weakConcepts: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      // Interview history
      sessionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'interview_sessions',
    }
  );
}
