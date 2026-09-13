import { DataTypes } from 'sequelize';

export default function defineKnowledgeRoadmap(sequelize) {
  return sequelize.define(
    'KnowledgeRoadmap',
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
      targetRole: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Full Stack Developer',
      },
      readinessScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      roadmapData: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastActiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'knowledge_roadmaps',
    }
  );
}
