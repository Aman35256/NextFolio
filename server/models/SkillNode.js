import { DataTypes } from 'sequelize';

export default function defineSkillNode(sequelize) {
  return sequelize.define(
    'SkillNode',
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'General',
      },
      mastery: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'locked', // 'locked', 'in_progress', 'mastered'
      },
      prerequisites: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      careerImportance: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
      },
      confidenceScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      tableName: 'skill_nodes',
    }
  );
}
