import mongoose from 'mongoose';

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      wilaya: { type: String, required: true },
      commune: { type: String, required: true },
      street: { type: String },
    },
    isEmailConfirmed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Agency = mongoose.model('Agency', agencySchema);
export default Agency;
