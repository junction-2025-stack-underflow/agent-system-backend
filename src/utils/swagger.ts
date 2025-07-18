import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import dotenv from "dotenv";
import basicAuth from "express-basic-auth";

dotenv.config();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Houseek API",
    version: "1.0.0",
    description: "API documentation for Houseek Backend",
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  const hasPassword = !!process.env.SWAGGER_PASSWORD;

  if (isProduction && hasPassword) {
    app.use(
      "/docs",
      basicAuth({
        users: { admin: process.env.SWAGGER_PASSWORD! },
        challenge: true,
        realm: "Swagger UI",
      }),
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec)
    );
  } else {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // Swagger JSON
  app.get("/docs.json", (_, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
