import mongoose from "mongoose";
import User from "./User";

// Define the Louer schema (inherits from User)
const louerSchema = new mongoose.Schema({
  louerSpecificField: { type: String }, // Example of louer-specific field
});

// Create the Louer discriminator
const Louer = User.discriminator("Louer", louerSchema);

export default Louer;
