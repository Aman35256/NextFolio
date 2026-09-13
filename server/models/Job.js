import { DataTypes } from 'sequelize';

export default function defineJob(sequelize) {
  return sequelize.define(
    'Job',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salary: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      experienceRequired: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      remoteStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      visaSponsorship: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      jobType: {
        type: DataTypes.STRING,
        defaultValue: 'Full-time',
        allowNull: true,
      },
      applyUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jobDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      originalSource: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateDiscovered: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      formattedData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'jobs',
    }
  );
}
