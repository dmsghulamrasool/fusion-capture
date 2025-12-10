import mongoose, { Schema, Model } from "mongoose";

export interface IUserRole {
  userId: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserRoleSchema = new Schema<IUserRole>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roles: {
      type: [String],
      required: true,
      default: ["viewer"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation during hot reload
const UserRole: Model<IUserRole> =
  mongoose.models.UserRole ||
  mongoose.model<IUserRole>("UserRole", UserRoleSchema);

export default UserRole;
