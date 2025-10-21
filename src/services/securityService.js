const axios = require("axios");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");
const { getAuthHeader } = require("../middleware/requestContext");

/**
 * Service to interact with the ms-security microservice for user management.
 * It provides functions to get user details, validate user roles, fetch all patients, and create new users.
 */
const securityService = {
  async getUserById(id) {
    try {
      const headers = getAuthHeader();
      const res = await axios.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/${id}`,
        {
          headers,
        },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async validateUserRole(userId, role) {
    try {
      const headers = getAuthHeader();
      const res = await axios.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/${userId}`,
        {
          headers,
        },
      );

      return res.data.role === role;
    } catch (err) {
      throw err;
    }
  },

  async getAllPatients(page = 1, limit = 10) {
    try {
      const headers = getAuthHeader();
      const res = await axios.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients`,
        {
          headers,
          params: { page, limit },
        },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async createPatient(userData) {
    try {
      const headers = getAuthHeader();
      const res = await axios.post(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients`,
        userData,
        {
          headers,
        },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async updatePatient(userId, userData) {
    try {
      const headers = getAuthHeader();
      const res = await axios.put(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients/${userId}`,
        userData,
        { headers },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async updatePatientState(userId, status) {
    try {
      const headers = getAuthHeader();
      const res = await axios.patch(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients/:${userId}/state`,
        { status },
        { headers },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = securityService;
