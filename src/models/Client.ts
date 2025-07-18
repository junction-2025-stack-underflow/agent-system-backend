import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    telephone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    superficie: {
      type: Number,
      required: false,
    },
    region: {
      type: String,
      required: false,
    },
    besoin: {
      type: String,
      required: false,
      enum: ["achat", "location"],
    },
    nombreChambre: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["vip", "nouveau", "regulier", "black lister"],
      default: "nouveau",
    },
    agencyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Agency",
          required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Client", clientSchema);
