import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { PurchaseOrder } from "./PurchaseOrder.js";
import { User } from "./User.js";

export const Supplier = sequelize.define(
  "suppliers",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    supplier_rut: {
      type: DataTypes.STRING,
      unique: true,
    },
    supplier_name: {
      type: DataTypes.STRING,
    },
    registered_name: {
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
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Supplier.hasMany(PurchaseOrder, {
  foreignKey: "supplier_id",
  sourceKey: "id",
});

PurchaseOrder.belongsTo(Supplier, {
  foreignKey: "supplier_id",
  targetKey: "id",
});

Supplier.belongsTo(User, {
  foreignKey: "user_create",
  as: "createdBy",
  targetKey: "id",
});

Supplier.belongsTo(User, {
  foreignKey: "user_update",
  as: "updatedBy",
  targetKey: "id",
});
