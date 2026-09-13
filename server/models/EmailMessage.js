import { DataTypes } from 'sequelize';

export default function defineEmailMessage(sequelize) {
  return sequelize.define(
    'EmailMessage',
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
      emailAccountId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      messageId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bodySnippet: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      classification: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      matchedJobId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      actionRequired: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'processed', // 'processed', 'ignored', 'pending_user_confirmation'
      },
    },
    {
      timestamps: true,
      tableName: 'email_messages',
    }
  );
}
