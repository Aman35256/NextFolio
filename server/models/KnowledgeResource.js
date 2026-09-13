import { DataTypes } from 'sequelize';

export default function defineKnowledgeResource(sequelize) {
  return sequelize.define(
    'KnowledgeResource',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      skillName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false, // 'documentation', 'video', 'book', 'article', 'coding_platform'
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      difficulty: {
        type: DataTypes.STRING,
        defaultValue: 'beginner', // 'beginner', 'intermediate', 'advanced'
      },
    },
    {
      timestamps: true,
      tableName: 'knowledge_resources',
    }
  );
}
