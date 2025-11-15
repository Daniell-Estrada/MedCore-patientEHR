const { axiosInstance } = require("../interceptors/axiosInterceptor");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");
const { getAuthHeader } = require("../middleware/requestContext");
const cacheService = require("./cacheService");

/**
 * Service to interact with the ms-security microservice for user management.
 * Includes caching to reduce redundant requests.
 */
const securityService = {
  async getAllPatients(page = 1, limit = 10) {
    try {
      const cachedPage = cacheService.getPatientPage(page, limit);
      if (cachedPage) {
        return cachedPage;
      }

      const headers = getAuthHeader();
      const res = await axiosInstance.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients`,
        {
          headers,
          params: { page, limit },
          maxRetries: 2,
          retryDelay: 500,
        },
      );

      const patientsData = res.data;
      cacheService.setPatientPage(page, limit, patientsData);

      if (patientsData.data && Array.isArray(patientsData.data)) {
        patientsData.data.forEach((patient) => {
          if (patient.id) {
            cacheService.setUserById(patient.id, patient);
            if (patient.role) {
              cacheService.setUserRole(patient.id, patient.role);
            }
          }
        });
      }

      return patientsData;
    } catch (err) {

    }
  },

  async getUserById(id) {
    try {
      const cachedUser = cacheService.getUserById(id);
      if (cachedUser) {
        return cachedUser;
      }

      const headers = getAuthHeader();
      const res = await axiosInstance.get(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/${id}`,
        {
          headers,
          maxRetries: 2,
          retryDelay: 500,
        },
      );

      const userData = res.data;
      cacheService.setUserById(id, userData);

      if (userData.role) {
        cacheService.setUserRole(id, userData.role);
      }

      return userData;
    } catch (err) {
      throw err;
    }
  },

  async createPatient(userData) {
    try {
      const headers = getAuthHeader();
      const res = await axiosInstance.post(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients`,
        userData,
        {
          headers,
          maxRetries: 1,
        },
      );

      const newPatient = res.data?.patient;

      cacheService.invalidatePatientPages();

      if (newPatient.id) {
        cacheService.setUserById(newPatient.id, newPatient);
        if (newPatient.role) {
          cacheService.setUserRole(newPatient.id, newPatient.role);
        }
      }

      return newPatient;
    } catch (err) {
      throw err;
    }
  },

  async updatePatient(userId, userData) {
    try {
      const headers = getAuthHeader();
      const res = await axiosInstance.put(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients/${userId}`,
        userData,
        {
          headers,
          maxRetries: 1,
        },
      );

      const updatedPatient = res.data;

      cacheService.invalidateUserData(userId);

      return updatedPatient;
    } catch (err) {
      throw err;
    }
  },

  async updatePatientState(userId, status) {
    try {
      const headers = getAuthHeader();
      const res = await axiosInstance.patch(
        `${MS_PATIENT_EHR_CONFIG.MS_SECURITY}/users/patients/${userId}/state`,
        { status },
        {
          headers,
          maxRetries: 1,
        },
      );

      const updatedUser = res.data;

      cacheService.invalidateUserData(userId);

      return updatedUser;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = securityService;
