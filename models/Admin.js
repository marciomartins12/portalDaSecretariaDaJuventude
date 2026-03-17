const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const Admin = sequelize.define(
  "Admin",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(120), allowNull: false, field: "password_hash" },
    role: { type: DataTypes.ENUM("MASTER", "ADMIN"), allowNull: false, defaultValue: "ADMIN" }
  },
  {
    tableName: "admins",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = { Admin };
