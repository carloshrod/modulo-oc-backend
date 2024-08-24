import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "./User.js";

export const FamiliesAccountCost = sequelize.define("families_account_costs", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
  },
  id_company: {
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
});

FamiliesAccountCost.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

FamiliesAccountCost.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
