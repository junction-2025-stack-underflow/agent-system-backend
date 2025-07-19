import swaggerJSDoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Houseek API",
      version: "1.0.0",
      description: "API for managing houses and client recommendations",
    },
    servers: [
      {
        url: "http://localhost:5001/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ClientInput: {
          type: "object",
          required: [
            "fullName",
            "telephone",
            "minBudget",
            "maxBudget",
            "desiredArea",
            "propertyType",
            "numberOfKids",
            "atitude",
            "longitude",
          ],
          properties: {
            fullName: { type: "string" },
            telephone: { type: "string" },
            email: { type: "string", format: "email" },
            preferences: {
              type: "object",
              required: [
                "minBudget",
                "maxBudget",
                "desiredArea",
                "propertyType",
                "numberOfKids",
                "atitude",
                "longitude",
              ],
              properties: {
                minBudget: { type: "number" },
                maxBudget: { type: "number" },
                desiredArea: { type: "number" },
                propertyType: {
                  type: "string",
                  enum: ["Apartment", "Villa", "House"],
                },
                numberOfKids: { type: "number" },
                atitude: { type: "number" },
                longitude: { type: "number" },
              },
            },
          },
        },
        HouseInput: {
          type: "object",
          required: [
            "price",
            "area",
            "propertyType",
            "location",
            "coordinates",
            "status",
          ],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            area: { type: "number" },
            propertyType: {
              type: "string",
              enum: ["Apartment", "Villa", "House"],
            },
            status: {
              type: "string",
              enum: ["available", "sold"],
            },
            location: { type: "string" },
            coordinates: {
              type: "object",
              required: ["atitude", "longitude"],
              properties: {
                atitude: { type: "number" },
                longitude: { type: "number" },
              },
            },
            features: {
              type: "object",
              properties: {
                bedrooms: { type: "number" },
                bathrooms: { type: "number" },
                garage: { type: "boolean" },
                garden: { type: "boolean" },
              },
            },
            images: {
              type: "array",
              items: {
                type: "string",
                format: "uri",
              },
            },
          },
        },
        AgencyInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
        AgencyLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
        EmailConfirmation: {
          type: "object",
          required: ["email", "code"],
          properties: {
            email: { type: "string", format: "email" },
            code: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts",], 
};
export const swaggerSpec = swaggerJSDoc(swaggerOptions);
fs.writeFileSync(
    path.join(__dirname, '../swagger.json'),
    JSON.stringify(swaggerSpec, null, 2)
  );
