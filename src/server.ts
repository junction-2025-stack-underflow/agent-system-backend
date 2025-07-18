import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import chalk from "chalk";
import { setupSwagger } from "./utils/swagger";
import { appRouter } from "./routes";
import { connectDB } from "./config/db";
import compression from "compression";
import path = require("path");
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const app = express();

// Middlewares setup
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Setup Swagger for API documentation
setupSwagger(app);

// Register routes
app.use("/api", appRouter);
// Server configuration
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`
        ${chalk.green("houseek API is running 🚀")}
        - Local:        ${chalk.blue(`http://localhost:${PORT}`)}
        - Environment:  ${chalk.blue(process.env.NODE_ENV || "development")}
        - Docs:         ${chalk.blue(`http://localhost:${PORT}/docs`)}
      `);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log(chalk.yellow("\nShutting down gracefully..."));
      server.close(() => {
        console.log(chalk.green("Server closed. Goodbye!"));
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("Failed to connect to the database", err);
    process.exit(1); 
  }
};

startServer();
