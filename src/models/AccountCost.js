import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { PurchaseOrderItem } from "./PurchaseOrderItem.js";
import { User } from "./User.js";

export const AccountCost = sequelize.define(
  "account_costs",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    identifier: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
    },
    id_family: {
      type: DataTypes.INTEGER,
    },
    user_create: {
      type: DataTypes.INTEGER,
    },
    user_update: {
      type: DataTypes.INTEGER,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

AccountCost.hasMany(PurchaseOrderItem, {
  foreignKey: "account_costs_id",
  sourceKey: "id",
});

PurchaseOrderItem.belongsTo(AccountCost, {
  foreignKey: "account_costs_id",
  targetId: "id",
});

AccountCost.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

AccountCost.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
