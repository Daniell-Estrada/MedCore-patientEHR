const { MS_PATIENT_EHR_CONFIG } = require("../environment");
const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MS_PATIENT_EHR_CONFIG.DATABASE_URL_MONGO);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

module.exports = connectDB;
