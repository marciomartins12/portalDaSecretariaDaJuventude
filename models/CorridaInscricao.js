const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const CorridaInscricao = sequelize.define(
  "CorridaInscricao",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(160), allowNull: false, field: "full_name" },
    email: { type: DataTypes.STRING(160), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: false },
    address: { type: DataTypes.STRING(220), allowNull: false },
    cpf: { type: DataTypes.STRING(11), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    termsImageRelease: { type: DataTypes.BOOLEAN, allowNull: false, field: "terms_image_release" },
    termsResponsibility: { type: DataTypes.BOOLEAN, allowNull: false, field: "terms_responsibility" },
    termsIp: { type: DataTypes.STRING(64), allowNull: true, field: "terms_ip" },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" }
  },
  {
    tableName: "corrida_inscricoes",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = { CorridaInscricao };
