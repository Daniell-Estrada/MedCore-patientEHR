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

  async getPatientTimeline(patientId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const mh = await prisma.medicalHistory.findUnique({
      where: { patientId },
      select: { id: true },
    });

    if (!mh) {
      const error = new Error("Historial médico no encontrado");
      error.status = 404;
      throw error;
    }

    const [diagnostics, documents] = await Promise.all([
      prisma.diagnostic.findMany({
        where: { medicalHistoryId: mh.id },
        select: {
          id: true,
          title: true,
          consultDate: true,
          state: true,
          doctorId: true,
        },
      }),
      prisma.DiagnosticDocument.findMany({
        where: {
          diagnostic: { medicalHistoryId: mh.id },
        },
        select: {
          id: true,
          filename: true,
          createdAt: true,
          diagnosticId: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const events = [
      ...diagnostics.map((d) => ({
        type: "diagnostic",
        id: d.id,
        diagnosticId: d.id,
        title: d.title,
        timestamp: d.consultDate,
        meta: { state: d.state, doctorId: d.doctorId },
      })),
      ...documents.map((doc) => ({
        type: "document",
        id: doc.id,
        diagnosticId: doc.diagnosticId,
        filename: doc.filename,
        timestamp: doc.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = events.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = events.slice(start, start + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
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
      const existingRecord = await prisma.medicalHistory.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        const error = new Error("Medical history record not found");
        error.status = 404;
        throw error;
      }

      const medicalHistory = await prisma.medicalHistory.update({
        where: { id },
        data: {
          ...data,
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
