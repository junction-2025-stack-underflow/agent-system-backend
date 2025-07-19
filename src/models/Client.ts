import mongoose from "mongoose";
import { counterSchema } from "./House";
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["buy", "rent"],
      // required: true,
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
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    preferences: {
      ID: { type: Number },
      minBudget: { type: Number, required: true },
      maxBudget: { type: Number, required: true },
      desiredArea: { type: Number, required: true },
      propertyType: {
        type: String,
        enum: ["Apartment", "Villa", "House"],
        required: true,
      },
      numberOfKids: { type: Number, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);
clientSchema.pre("save", async function (next) {
  const client = this as mongoose.Document & { preferences: { ID: number } };

  if (client.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        "clientPreferencesId", 
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      client.preferences.ID = counter.seq;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  } else {
    next();
  }
});

export default mongoose.model("Client", clientSchema);
