import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import chalk from "chalk";
import { morganMiddleware } from "./middlewares/morgan.middleware";
import { i18n } from "./middlewares/i18n.middleware";
import { setupSwagger } from "./utils/swagger";
import { rateLimiter } from "./middlewares/rate-limiter.middleware";
import { appRouter } from "./routes";
import { connectDB } from "./config/db";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const app = express();

// Middlewares setup
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter());
app.use(morganMiddleware);
app.use(i18n);

// Setup Swagger for API documentation
setupSwagger(app);

// Register routes
app.use("/", appRouter);

// Server configuration
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`
        ${chalk.green("Orental API is running 🚀")}
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

    // Handle termination signals
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("Failed to connect to the database", err);
    process.exit(1); // Exit if the DB connection fails
  }
};

// Start the server
startServer();
