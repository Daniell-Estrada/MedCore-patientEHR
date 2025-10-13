const axios = require("axios");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");

/**
 * Service to interact with the ms-security microservice for user management.
 * It provides functions to get user details, validate user roles, fetch all patients, and create new users.
 */
const securityService = {
  async getUserById(userId, token) {
    try {
      const res = await axios.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async validateUserRole(userId, role, token) {
    try {
      const res = await axios.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/${userId}/roles`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data.includes(role);
    } catch (err) {
      throw err;
    }
  },

  async getAllPatients(token, page = 1, limit = 10) {
    try {
      const res = await axios.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { role: "PACIENTE", page, limit },
        },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  async createUser(userData, token) {
    try {
      const res = await axios.post(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = securityService;
