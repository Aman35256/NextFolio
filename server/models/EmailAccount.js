import { DataTypes } from 'sequelize';

export default function defineEmailAccount(sequelize) {
  return sequelize.define(
    'EmailAccount',
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
      provider: {
        type: DataTypes.STRING,
        allowNull: false, // 'gmail', 'outlook', 'microsoft_365', 'yahoo', 'imap'
      },
      emailAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'connected', // 'connected', 'paused', 'disconnected'
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imapHost: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imapPort: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'email_accounts',
    }
  );
}
