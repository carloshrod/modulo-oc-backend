import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { User } from "./User.js";
import { Approver } from "./Approver.js";

export const ApprovalEvent = sequelize.define(
  "approval_events",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

ApprovalEvent.belongsTo(User, {
  foreignKey: "author",
  targetKey: "id",
});

ApprovalEvent.belongsTo(Approver, {
  foreignKey: "author",
  targetKey: "user_id",
  as: "approver_details",
});
