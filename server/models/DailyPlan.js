import { DataTypes } from 'sequelize';

export default function defineDailyPlan(sequelize) {
  return sequelize.define(
    'DailyPlan',
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
      date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tasks: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      tableName: 'daily_plans',
    }
  );
}
