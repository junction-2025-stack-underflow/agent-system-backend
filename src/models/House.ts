import mongoose, { Document, Schema, Model } from "mongoose";
interface ICounter extends Document {
  _id: string;
  seq: number;
}

export const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter: Model<ICounter> = mongoose.model<ICounter>("Counter", counterSchema);

export type HouseType = "House" | "Villa" | "Apartment";

interface IHouse extends Document {
  agencyId: mongoose.Types.ObjectId;
  details: {
    ID: number;
    PropertyType: HouseType;
    Price: number;
    Area: number;
    Rooms: number;
    Latitude: number;
    Longitude: number;
  };
  nombreLits: number;
  nombreSallesDeBain: number;
  nombreCuisine: number;
  wifi: boolean;
  television: boolean;
  laveLinge: boolean;
  parking: boolean;
  climatisation: boolean;
  chauffage: boolean;
  images: string[];
  titre: string;
  description: string;
  region: string;
}
const houseSchema = new Schema<IHouse>(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    details: {
      ID: {
        type: Number,
        unique: true,
        required: false,
      },
      PropertyType: {
        type: String,
        enum: ["House", "Villa", "Apartment"],
        required: true,
      },
      Price: { type: Number, required: true },
      Area: { type: Number, required: true },
      Rooms: { type: Number, required: true },
      Latitude: { type: Number, required: true },
      Longitude: { type: Number, required: true },
    },
    nombreLits: { type: Number, required: true },
    nombreSallesDeBain: { type: Number, required: true },
    nombreCuisine: { type: Number, required: true },
    wifi: { type: Boolean, default: false },
    television: { type: Boolean, default: false },
    laveLinge: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    climatisation: { type: Boolean, default: false },
    chauffage: { type: Boolean, default: false },
    images: { type: [String], default: [] },
    titre: { type: String, required: true },
    description: { type: String, required: true },
    region: { type: String, required: true },
  },
  { timestamps: true, id: false } 
);
houseSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        "houseId",
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      this.details.ID = counter.seq;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  } else {
    next();
  }
});

const House = mongoose.model<IHouse>("House", houseSchema);

export default House;