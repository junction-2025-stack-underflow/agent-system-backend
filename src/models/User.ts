import mongoose, { Document, Schema } from "mongoose";

interface IUser extends Document {
  firstname: string;
  lastname: string;
  country: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: "client" | "louer";
}

const userSchema = new Schema<IUser>({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  country: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["client", "louer"], required: true },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
