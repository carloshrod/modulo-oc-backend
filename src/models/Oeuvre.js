import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { PurchaseOrder } from "./PurchaseOrder.js";
import { User } from "./User.js";

export const Oeuvre = sequelize.define("oeuvres", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  oeuvre_name: {
    type: DataTypes.STRING,
  },
  oeuvre_address: {
    type: DataTypes.STRING,
    unique: true,
  },
  admin_name: {
    type: DataTypes.STRING,
  },
  ceco_code: {
    type: DataTypes.STRING,
  },
  contract_type: {
    type: DataTypes.STRING,
  },
  uf_contract_value: {
    type: DataTypes.DECIMAL,
  },
  contract_amount: {
    type: DataTypes.DECIMAL,
  },
  start_date: {
    type: DataTypes.DATE,
  },
  contractual_end_date: {
    type: DataTypes.DATE,
  },
  authorized_end_date: {
    type: DataTypes.DATE,
  },
  image_url: {
    type: DataTypes.STRING,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
  },
  id_company_visitor: {
    type: DataTypes.INTEGER,
  },
  id_company_manager: {
    type: DataTypes.INTEGER,
  },
  id_company_business_unit: {
    type: DataTypes.INTEGER,
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
  id_state: {
    type: DataTypes.INTEGER,
  },
  location: {
    type: DataTypes.JSONB,
  },
  id_contractual_state: {
    type: DataTypes.INTEGER,
  },
  start_of_periods: {
    type: DataTypes.STRING,
  },
  end_of_periods: {
    type: DataTypes.STRING,
  },
});

Oeuvre.hasMany(PurchaseOrder, {
  foreignKey: "oeuvre_id",
  sourceKey: "id",
});

PurchaseOrder.belongsTo(Oeuvre, {
  foreignKey: "oeuvre_id",
  targetId: "id",
});

Oeuvre.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

Oeuvre.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
