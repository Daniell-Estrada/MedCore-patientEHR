const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./router/routes");
const cors = require("cors");
const { initialize, disconnect } = require("./interceptors/auditInterceptor");
const { MS_PATIENT_EHR_CONFIG } = require("./config/environment");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./config/swagger");

const port = MS_PATIENT_EHR_CONFIG.PORT;
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);

app.use(bodyParser.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true }),
);
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/v1", routes);

process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await initialize();
});

