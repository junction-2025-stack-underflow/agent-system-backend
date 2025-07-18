
import winston from "winston";
const NODE_ENV = process.env.NODE_ENV || "development";
const logger = winston.createLogger({
  level: "error", 
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }), 
  ],
});
if (NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
type LogLevel = "error" | "warn" | "info" | "debug";
interface LogContext {
  [key: string]: any;
  error?: any; 
  ip?: string; 
  path?: string; 
  agencyId?: string; 
  email?: string; 
  clientId?: string; 
  houseId?: string; 
}
export const log = (level: LogLevel, message: string, context: LogContext = {}): void => {
  logger.log({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(), 
  });
};
export const logError = (message: string, context: LogContext = {}): void => {
  log("error", message, context);
};