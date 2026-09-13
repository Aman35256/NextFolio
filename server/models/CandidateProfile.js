import { DataTypes } from 'sequelize';

export default function defineCandidateProfile(sequelize) {
  return sequelize.define(
    'CandidateProfile',
    {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    headline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    yearsOfExperience: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    atsScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    skillCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    projectCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    allSkills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    topSkills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    skillCategories: {
      type: DataTypes.JSON,
      defaultValue: {
        technical: [],
        soft: [],
        tools: [],
        languages: [],
      },
    },
    experience: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    education: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    languages: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    missingSkills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    profileStrength: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    },
    {
      timestamps: true,
      tableName: 'candidate_profiles',
    }
  );
}
