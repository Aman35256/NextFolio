import { DataTypes } from 'sequelize';

export default function defineAgentSettings(sequelize) {
  return sequelize.define(
    'AgentSettings',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      matchScoreThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 75,
      },
      salaryMin: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      remoteOnly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      allowedCountries: {
        type: DataTypes.JSON,
        defaultValue: ['Any'],
      },
      blockedCompanies: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      preferredRoles: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      preferredLocations: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      preferredIndustries: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      activeSources: {
        type: DataTypes.JSON,
        defaultValue: [
          'LinkedIn Jobs',
          'Indeed',
          'Wellfound',
          'Y Combinator Jobs',
          'AI Jobs',
          'Internshala',
          'Naukri.com',
          'Remote OK',
          'Remotive',
          'Arbeitnow'
        ],
      },
      // Memory Layer: preferred settings auto-learned by agent
      agentLearnings: {
        type: DataTypes.JSON,
        defaultValue: {
          roles: [],
          locations: [],
          industries: [],
          companies: [],
        },
      },
    },
    {
      timestamps: true,
      tableName: 'agent_settings',
    }
  );
}
