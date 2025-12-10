import mongoose, { Schema, Model } from "mongoose";

export interface IRoleAccess {
  role: string;
  page: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleAccessSchema = new Schema<IRoleAccess>(
  {
    role: {
      type: String,
      required: true,
      enum: ["admin", "editor", "viewer"],
    },
    page: {
      type: String,
      required: true,
    },
    canView: {
      type: Boolean,
      default: false,
    },
    canAdd: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: false,
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

// Create compound index for role and page uniqueness
RoleAccessSchema.index({ role: 1, page: 1 }, { unique: true });

// Prevent model re-compilation during hot reload
const RoleAccess: Model<IRoleAccess> =
  mongoose.models.RoleAccess ||
  mongoose.model<IRoleAccess>("RoleAccess", RoleAccessSchema);

export default RoleAccess;

