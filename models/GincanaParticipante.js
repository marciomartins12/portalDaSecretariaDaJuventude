const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const GincanaParticipante = sequelize.define(
  "GincanaParticipante",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    inscricaoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: "inscricao_id" },
    fullName: { type: DataTypes.STRING(160), allowNull: false, field: "full_name" },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    isCaptain: { type: DataTypes.BOOLEAN, allowNull: false, field: "is_captain" },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" }
  },
  {
    tableName: "gincana_participantes",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = { GincanaParticipante };
