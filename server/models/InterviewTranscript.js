import { DataTypes } from 'sequelize';

export default function defineInterviewTranscript(sequelize) {
  return sequelize.define(
    'InterviewTranscript',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      questionIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      audioLength: {
        type: DataTypes.INTEGER, // in seconds
        defaultValue: 0,
      },
      // Real-time analysis
      fluencyScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      clarityScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      pronunciationScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      confidenceScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      communicationScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      grammarScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      vocabularyScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      responseStructureScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      starFrameworkScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      technicalScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      // Analysis details
      analysisData: {
        type: DataTypes.JSON,
        defaultValue: {
          fillers: [],
          grammarIssues: [],
          pronunciationIssues: [],
          keywords: [],
          concepts: [],
          sentimentScore: null,
        },
      },
      // Feedback
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      suggestions: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
    },
    {
      timestamps: true,
      tableName: 'interview_transcripts',
    }
  );
}
