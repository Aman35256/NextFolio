import { DataTypes } from 'sequelize';

export default function defineAgentExecution(sequelize) {
  return sequelize.define(
    'AgentExecution',
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
      orchestrationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      agentName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending', // 'pending', 'running', 'completed', 'failed'
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // 0 to 100
      },
      reasoning: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      planning: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      validation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      input: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      output: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      confidence: {
        type: DataTypes.INTEGER,
        defaultValue: 100, // 0 to 100
      },
      executionTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // milliseconds
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'agent_executions',
    }
  );
}
