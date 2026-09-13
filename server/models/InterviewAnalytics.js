import { DataTypes } from 'sequelize';

export default function defineInterviewAnalytics(sequelize) {
  return sequelize.define(
    'InterviewAnalytics',
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
      totalInterviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      completedInterviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      averageCommunicationScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      averageTechnicalScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      averageBehaviorScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      averageConfidenceScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      // Trends
      communicationTrend: {
        type: DataTypes.JSON,
        defaultValue: [], // Array of scores over time
      },
      technicalTrend: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      confidenceTrend: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      grammarTrend: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      vocabularyTrend: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      // Skills improvement
      topWeaknesses: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      topStrengths: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      mostCommonFillers: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      // Success rate
      successRate: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      // Detailed metrics
      metrics: {
        type: DataTypes.JSON,
        defaultValue: {
          averageWordsPerMinute: null,
          averageSpeakingPace: null,
          averageFillersPerResponse: null,
          averageGrammarAccuracy: null,
          averageVocabularyRichness: null,
        },
      },
    },
    {
      timestamps: true,
      tableName: 'interview_analytics',
    }
  );
}
