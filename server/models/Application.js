import { DataTypes } from 'sequelize';

export default function defineApplication(sequelize) {
  return sequelize.define(
    'Application',
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
      jobId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'applied', // 'applied', 'viewed', 'under_review', 'assessment', 'interview_scheduled', 'interview_completed', 'offer_received', 'rejected'
      },
      autoApplied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      submissionTimestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      interviewReadiness: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      communicationScore: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      probabilityOfSuccess: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      timeline: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      auditLog: {
        type: DataTypes.JSON,
        defaultValue: [], // Array of events: [{ timestamp, message }]
      },
    },
    {
      timestamps: true,
      tableName: 'applications',
    }
  );
}
