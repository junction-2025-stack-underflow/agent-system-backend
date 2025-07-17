import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import dotenv from "dotenv";
import basicAuth from "express-basic-auth";

dotenv.config();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Orental API",
    version: "1.0.0",
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Apply basic authentication in production only
  if (process.env.NODE_ENV === "production" && process.env.SWAGGER_PASSWORD) {
    app.use(
      "/docs",
      basicAuth({
        users: { admin: process.env.SWAGGER_PASSWORD },
        challenge: true,
        realm: "Swagger UI",
      })
    );
  }

  // Swagger Page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Swagger JSON
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
