import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { PurchaseOrderItem } from "./PurchaseOrderItem.js";
import { User } from "./User.js";

export const PurchaseOrder = sequelize.define(
  "purchase_orders",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    number: {
      type: DataTypes.STRING,
      unique: true,
    },
    gloss: {
      type: DataTypes.STRING,
    },
    delivery_date: {
      type: DataTypes.DATE,
    },
    delivery_address: {
      type: DataTypes.STRING,
    },
    currency_type: {
      type: DataTypes.STRING,
    },
    net_total: {
      type: DataTypes.DECIMAL,
    },
    iva: {
      type: DataTypes.DECIMAL,
    },
    total: {
      type: DataTypes.DECIMAL,
    },
    status: {
      type: DataTypes.STRING,
    },
    approval_date: {
      type: DataTypes.DATE,
    },
    reception_date: {
      type: DataTypes.DATE,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: "purchase_order_id",
  sourceKey: "id",
});

PurchaseOrder.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

PurchaseOrder.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
