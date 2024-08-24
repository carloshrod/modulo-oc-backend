import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
    },
    full_name: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
    },
    company_id: {
      type: DataTypes.INTEGER,
    },
    exchange_automatic: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

User.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

User.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
