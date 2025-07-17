import morgan from "morgan";
import chalk from "chalk";

export const morganMiddleware = morgan((tokens, req, res) => {
  const logFormat = [
    chalk.blue(tokens.method(req, res)) + " ", // HTTP Method (e.g., GET, POST)
    chalk.cyan(tokens.url(req, res)) + " ", // URL of the request
    chalk.magenta(tokens.status(req, res)) + " ", // Response status code
    chalk.gray(tokens.res(req, res, "content-length") || "unknown") + " ", // Content-length, defaults to 'unknown' if missing
    chalk.green(tokens["response-time"](req, res) + " ms"), // Response time in milliseconds
    chalk.yellow(tokens["user-agent"](req, res)?.split(" ")[0]) + " ", // User-Agent
  ];

  // Return the formatted log message as a string
  return logFormat.join(" | ");
});
