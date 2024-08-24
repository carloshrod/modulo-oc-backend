import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "./User.js";

export const GeneralItem = sequelize.define(
  "general_items",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sku: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

GeneralItem.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

GeneralItem.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
