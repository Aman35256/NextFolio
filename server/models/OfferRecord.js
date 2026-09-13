import { DataTypes } from 'sequelize';

export default function defineOfferRecord(sequelize) {
  return sequelize.define(
    'OfferRecord',
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
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salary: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      equity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      benefits: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      bonuses: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      offerScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      pros: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      cons: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      negotiationSuggestions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      marketComparison: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      joiningDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      responseDeadline: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requiredDocuments: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending', // 'pending', 'accepted', 'declined', 'negotiating'
      },
    },
    {
      timestamps: true,
      tableName: 'offer_records',
    }
  );
}
