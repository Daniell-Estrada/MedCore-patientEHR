const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./router/routes");
const cors = require("cors");
const { MS_PATIENT_EHR_CONFIG } = require("./config/environment");

const port = MS_PATIENT_EHR_CONFIG.PORT;
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);

app.use(bodyParser.json());

app.use("/api/v1", routes);

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
