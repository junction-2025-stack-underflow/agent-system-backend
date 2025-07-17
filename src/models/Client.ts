import mongoose from "mongoose";
import User from "./User";

// Define the Client schema (inherits from User)
const clientSchema = new mongoose.Schema({
  clientSpecificField: { type: String }, // Example of client-specific field
});

// Create the Client discriminator
const Client = User.discriminator("Client", clientSchema);

module.exports = Client;
