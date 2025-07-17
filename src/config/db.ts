import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.DATABASE_URL || "");
    console.log(
      chalk.green(`MongoDB connected: ${connection.connection.host}`)
    );
    return connection;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(
        chalk.red("Failed to connect to database"),
        chalk.yellow(err.message)
      );
    } else {
      console.error(chalk.red("Failed to connect to database"));
    }
    process.exit(1);
  }
};

export { connectDB };
