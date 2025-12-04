const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const { MS_PATIENT_EHR_CONFIG } = require("./environment");

const API_BASE_PATH = "/api/v1";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "MedCore Patient EHR API",
    version: "1.0.0",
    description:
      "Documentación interactiva para los servicios del MedCore Patient EHR.",
  },
  servers: [
    {
      url: API_BASE_PATH,
      description: "Servidor actual",
    },
    {
      url: `http://localhost:${MS_PATIENT_EHR_CONFIG.PORT}${API_BASE_PATH}`,
      description: "Entorno local",
    },
  ],
  tags: [
    { name: "Prescriptions", description: "Prescripciones y descargas PDF" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  definition,
  apis: [
    path.join(__dirname, "../router/prescriptionRoutes.js"),
    path.join(__dirname, "../controllers/prescriptionController.js"),
    path.join(__dirname, "../middleware/**/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
