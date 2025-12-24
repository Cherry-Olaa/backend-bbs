import mongoose, { Document } from "mongoose";

export type Role = "admin" | "principal" | "hod" | "staff" | "student";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  staffId?: string;
  assignedClasses: string[];
  refreshToken?: string | null;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "principal", "hod", "staff", "student"],
      required: true,
    },
    staffId: { type: String },
    assignedClasses: {
      type: [String],
      required: true,
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
