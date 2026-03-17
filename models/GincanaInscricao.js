const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const GincanaInscricao = sequelize.define(
  "GincanaInscricao",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    teamName: { type: DataTypes.STRING(120), allowNull: false, field: "team_name" },
    captainName: { type: DataTypes.STRING(160), allowNull: false, field: "captain_name" },
    captainEmail: { type: DataTypes.STRING(160), allowNull: false, field: "captain_email" },
    captainPhone: { type: DataTypes.STRING(40), allowNull: false, field: "captain_phone" },
    neighborhood: { type: DataTypes.STRING(120), allowNull: false },
    captainDob: { type: DataTypes.DATEONLY, allowNull: false, field: "captain_dob" },
    participantsTotal: { type: DataTypes.INTEGER, allowNull: false, field: "participants_total" },
    termsImageRelease: { type: DataTypes.BOOLEAN, allowNull: false, field: "terms_image_release" },
    termsResponsibility: { type: DataTypes.BOOLEAN, allowNull: false, field: "terms_responsibility" },
    termsIp: { type: DataTypes.STRING(64), allowNull: true, field: "terms_ip" },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" }
  },
  {
    tableName: "gincana_inscricoes",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = { GincanaInscricao };
