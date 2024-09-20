import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { PurchaseOrderItem } from "./PurchaseOrderItem.js";
import { User } from "./User.js";
import { ApprovalEvent } from "./ApprovalEvent.js";
import { Approver } from "./Approver.js";

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
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
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
    exchange_rate: {
      type: DataTypes.DECIMAL,
    },
    discount: {
      type: DataTypes.DECIMAL,
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
    current_approver_id: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.ENUM(
        "Borrador",
        "En revisión",
        "Aprobada",
        "Rechazada",
        "Cerrada"
      ),
      allowNull: false,
    },
    approval_date: {
      type: DataTypes.DATE,
    },
    reception_date: {
      type: DataTypes.DATE,
    },
    user_create: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_update: {
      type: DataTypes.INTEGER,
    },
    oeuvre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

PurchaseOrder.hasMany(PurchaseOrderItem, {
  as: "items",
  foreignKey: "purchase_order_id",
  sourceKey: "id",
  onDelete: "CASCADE",
});

PurchaseOrder.hasMany(ApprovalEvent, {
  as: "events",
  foreignKey: "purchase_order_id",
  sourceKey: "id",
  onDelete: "CASCADE",
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

PurchaseOrder.belongsTo(Approver, {
  as: "current_approver",
  foreignKey: "current_approver_id",
  targetKey: "id",
});
