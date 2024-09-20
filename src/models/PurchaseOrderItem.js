import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { GeneralItem } from "./GeneralItem.js";
import { AccountCost } from "./AccountCost.js";

export const PurchaseOrderItem = sequelize.define(
  "purchase_order_items",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    general_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    measurement_unit: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    subtotal: {
      type: DataTypes.DECIMAL,
    },
    unit_price: {
      type: DataTypes.DECIMAL,
    },
    received_amount: {
      type: DataTypes.DECIMAL,
    },
    amount_to_receive: {
      type: DataTypes.DECIMAL,
    },
    receipt_status: {
      type: DataTypes.STRING,
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

PurchaseOrderItem.belongsTo(GeneralItem, {
  foreignKey: "general_item_id",
  targetkey: "id",
});

PurchaseOrderItem.belongsTo(AccountCost, {
  foreignKey: "account_costs_id",
  targetkey: "id",
});
