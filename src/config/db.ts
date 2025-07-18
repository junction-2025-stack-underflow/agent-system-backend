import mongoose from "mongoose";
import chalk from "chalk";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI as string;

  if (!uri) {
    console.error(chalk.red("❌ MONGO_URI is not defined in your .env file"));
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(chalk.green("✅ Connected to MongoDB Atlas"));
  } catch (error) {
    console.error(chalk.red("❌ MongoDB connection error:"), error);
    throw error;
  }
};
