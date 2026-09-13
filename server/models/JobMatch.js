import { DataTypes } from 'sequelize';

export default function defineJobMatch(sequelize) {
  return sequelize.define(
    'JobMatch',
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
      matchScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      explanation: {
        type: DataTypes.JSON,
        defaultValue: {
          matchingSkills: [],
          missingSkills: [],
          relevanceSummary: '',
        },
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'new', // 'new', 'applied', 'ignored'
      },
    },
    {
      timestamps: true,
      tableName: 'job_matches',
    }
  );
}
