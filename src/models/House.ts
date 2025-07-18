import mongoose, { Document, Schema } from "mongoose";

export type HouseType =
  | "maison"
  | "appartement"
  | "villa"
  | "château"
  | "promotion"
  | "studio"
  | "duplex";

  interface IHouse extends Document {
    type: HouseType;
    agencyId: mongoose.Types.ObjectId;
    location: {
      latitude: number;
      longitude: number;
    };
    superficie: number;
    nombreChambre: number;
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
    price: number;  
  }
  
const houseSchema = new Schema<IHouse>(
  {
    type: {
      type: String,
      enum: ["maison", "appartement", "villa", "château", "promotion", "studio", "duplex"],
      required: true,
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    superficie: { type: Number, required: true },
    nombreChambre: { type: Number, required: true },
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
    price: { type: Number, required: true }, 
  },
  { timestamps: true }
);

const House = mongoose.model<IHouse>("House", houseSchema);

export default House;
