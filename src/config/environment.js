/**
 * This file loads environment variables from a .env file and exports them as a configuration object.
 * It uses the dotenv package to manage environment variables.
 */
require("dotenv").config();

const MS_PATIENT_EHR_CONFIG = {
  DATABASE_URL_POSTGRES: process.env.DATABASE_URL_POSTGRESQL || "",
  DATABASE_URL_MONGO: process.env.DATABASE_URL_MONGO || "",
  PORT: process.env.PORT || 3013,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [],
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MS_SECURITY: process.env.MS_SECURITY,
};

module.exports = { MS_PATIENT_EHR_CONFIG };
