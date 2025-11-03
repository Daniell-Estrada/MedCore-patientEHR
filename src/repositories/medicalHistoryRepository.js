const prisma = require("../config/db/postgresql");
const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

/**
 * Repository for managing medical history records.
 */
class MedicalHistoryRepository {
  async getMedicalHistoryById(id) {
    try {
      const medicalHistory = await prisma.medicalHistory.findUnique({
        where: { id },
        include: {
          diagnostics: {
            orderBy: { consultDate: "desc" },
            include: {
              documents: true,
            },
          },
        },
      });

      if (!medicalHistory) {
        const error = new Error("Medical history record not found");
        error.status = 404;
        throw error;
      }

      let doctor = cacheService.getUserById(medicalHistory.createdBy);
      if (!doctor) {
        doctor = await securityService.getUserById(medicalHistory.createdBy);
      }

      return {
        ...medicalHistory,
        doctor: doctor
          ? {
              id: doctor.id,
              fullname: doctor.fullname,
              email: doctor.email,
            }
          : null,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPatientMedicalHistory(patientId, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const medicalHistory = await prisma.medicalHistory.findUnique({
        where: { patientId },
        include: {
          diagnostics: {
            orderBy: { consultDate: "desc" },
            skip,
            take: limit,
            include: {
              documents: true,
            },
          },
        },
      });

      if (!medicalHistory) {
        return null;
      }

      const totalDiagnostics = await prisma.diagnostic.count({
        where: { medicalHistoryId: medicalHistory.id },
      });

      let doctor = cacheService.getUserById(medicalHistory.createdBy);
      if (!doctor) {
        doctor = await securityService.getUserById(medicalHistory.createdBy);
      }

      return {
        ...medicalHistory,
        doctor: doctor
          ? {
              id: doctor.id,
              fullname: doctor.fullname,
              email: doctor.email,
            }
          : null,
        pagination: {
          page,
          limit,
          total: totalDiagnostics,
          totalPages: Math.ceil(totalDiagnostics / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async createMedicalHistory(patientId, userId) {
    try {
      const existingMedicalHistory = await prisma.medicalHistory.findUnique({
        where: { patientId },
      });

      if (existingMedicalHistory) {
        return existingMedicalHistory;
      }
      
      const medicalHistory = await prisma.medicalHistory.create({
        data: {
          patientId,
          createdBy: userId,
        },
      });

      return medicalHistory;
    } catch (error) {
      throw error;
    }
  }

  async updateMedicalHistory(id, data) {
    try {
      const medicalHistory = await prisma.medicalHistory.update({
        where: { id },
        data: {
          updatedAt: new Date(),
        },
      });

      return medicalHistory;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MedicalHistoryRepository();
