import { DataTypes } from 'sequelize';

export default function defineInterviewPrep(sequelize) {
  return sequelize.define(
    'InterviewPrep',
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
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      questions: {
        type: DataTypes.JSON,
        defaultValue: {
          technical: [],
          hr: [],
          systemDesign: [],
        },
      },
      mockQuestions: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      mockChatHistory: {
        type: DataTypes.JSON,
        defaultValue: [], // Array of chat messages: [{ role: 'agent'|'user', content }]
      },
      mockScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      mockFeedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      interviewDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      interviewTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meetingLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      interviewerNames: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      interviewType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending', // 'pending', 'started', 'completed'
      },
    },
    {
      timestamps: true,
      tableName: 'interview_preps',
    }
  );
}
