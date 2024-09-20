import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "./User.js";

export const Approver = sequelize.define(
  "approvers",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_update: {
      type: DataTypes.INTEGER,
    },
    approver_role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Approver.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "id",
});
