const prisma = require("../config/db/postgresql");
const securityService = require("../services/securityService");
const DocumentRecordsBuilder = require("../utils/documentRecordsBuilder");
const { upload: storageUpload } = require("../services/storageService");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");
const fs = require("fs").promises;
const cacheService = require("../services/cacheService");

/**
 * Repository for managing diagnostics.
 */
class DiagnosticRepository {
  async getDiagnosticById(id) {
    const cached = cacheService.getDiagnosticById(id);
    if (cached) return cached;

    const diagnostic = await prisma.Diagnostic.findUnique({
      where: { id, state: { not: "DELETED" } },
    });

    if (!diagnostic) {
      const error = new Error("Diagnóstico no encontrado");
      error.status = 404;
      throw error;
    }

    cacheService.setDiagnosticById(id, diagnostic);
    return diagnostic;
  }

  async listDiagnosticsByPatient(
    patientId,
    { page = 1, limit = 20, state, dateFrom, dateTo } = {},
  ) {
    const cached = cacheService.getPatientDiagnosticsPage(patientId, {
      page,
      limit,
      state: state || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
    if (cached) return cached;

    const mh = await prisma.medicalHistory.findUnique({
      where: { patientId },
      select: { id: true },
    });

    if (!mh) {
      const error = new Error("Historial médico no encontrado");
      error.status = 404;
      throw error;
    }

    const where = { medicalHistoryId: mh.id };
    if (state) {
      where.state = state;
    }
    if (dateFrom || dateTo) {
      where.consultDate = {};
      if (dateFrom) where.consultDate.gte = new Date(dateFrom);
      if (dateTo) where.consultDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      prisma.Diagnostic.count({ where }),
      prisma.Diagnostic.findMany({
        where,
        orderBy: { consultDate: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const payload = {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      data: rows,
    };
    cacheService.setPatientDiagnosticsPage(
      patientId,
      {
        page,
        limit,
        state: state || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
      payload,
    );
    return payload;
  }

  async createDiagnostic(
    patientId,
    doctorId,
    diagnosticData,
    files,
    doctorUser = null,
  ) {
    let doctor;
    let patient;

    try {
      patient = await prisma.Patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      if (patient.state === "INACTIVE") {
        throw new Error("Cannot add diagnostics to an inactive patient");
      }

      if (doctorUser) {
        doctor = doctorUser;
      } else {
        doctor = await securityService.getUserById(doctorId);
      }

      if (!doctor || doctor.role !== "MEDICO") {
        throw new Error("Only doctors can add diagnostics");
      }

      const doctorData = {
        id: doctor.id,
        email: doctor.email,
        role: doctor.role,
        fullname: doctor.fullname,
      };

      doctor = doctorData;
    } catch (error) {
      await this.#cleanupTempFiles(files);
      throw error;
    }

    try {
      const diagnostic = await prisma.$transaction(async (tx) => {
        let medicalHistory = await tx.medicalHistory.findUnique({
          where: { patientId },
        });

        if (!medicalHistory) {
          medicalHistory = await tx.medicalHistory.create({
            data: {
              patientId,
              createdBy: doctorId,
            },
          });
        }

        const newDiagnostic = await tx.Diagnostic.create({
          data: {
            medicalHistoryId: medicalHistory.id,
            doctorId,
            title: diagnosticData.title,
            description: diagnosticData.description,
            symptoms: diagnosticData.symptoms,
            diagnosis: diagnosticData.diagnosis,
            treatment: diagnosticData.treatment,
            observations: diagnosticData.observations || null,
            prescriptions: diagnosticData.prescriptions || null,
            physicalExam: diagnosticData.physicalExam || null,
            vitalSigns: diagnosticData.vitalSigns || null,
            consultDate: diagnosticData.consultDate || new Date(),
            nextAppointment: diagnosticData.nextAppointment
              ? new Date(diagnosticData.nextAppointment)
              : null,
          },
        });

        if (files && files.length > 0) {
          const prepared = [];
          for (const f of files) {
            const buffer = f.buffer ? f.buffer : await fs.readFile(f.path);
            const filename = DocumentRecordsBuilder.generateUniqueFilename({
              patientId,
              originalname: f.originalname,
            });

            const uploaded = await storageUpload({
              buffer,
              originalname: f.originalname,
              filename,
              mimetype: f.mimetype,
            });

            prepared.push({ f, uploaded });
          }

          const documentRecords = DocumentRecordsBuilder.buildDocumentRecords({
            diagnosticId: newDiagnostic.id,
            files,
            uploadedBy: doctorId,
            uploadedFiles: prepared,
          });

          await tx.DiagnosticDocument.createMany({
            data: documentRecords,
          });

          await this.#cleanupTempFiles(files);
        }

        const result = await tx.Diagnostic.findUnique({
          where: { id: newDiagnostic.id },
          include: {
            documents: true,
            medicalHistory: {
              include: {
                patient: true,
              },
            },
          },
        });
        return {
          patient: result.medicalHistory.patient,
          doctor: doctor,
          documents: result.documents,
        };
      });

      cacheService.invalidateAllPatientDiagnostics(patientId);
      cacheService.invalidatePatientTimeline(patientId);
      cacheService.invalidatePatientMedicalHistory(patientId);
      cacheService.invalidateAllMedicalHistoriesPages();
      return diagnostic;
    } catch (error) {
      await this.#cleanupTempFiles(files);
      throw error;
    }
  }

  async updateDiagnostic(id, data) {
    const existing = await prisma.Diagnostic.findUnique({
      where: { id, state: { not: "DELETED" } },
    });
    if (!existing) {
      const error = new Error("Diagnóstico no encontrado");
      error.status = 404;
      throw error;
    }
    if (existing.state === "DELETED") {
      const error = new Error(
        "No se puede actualizar un diagnóstico eliminado",
      );
      error.status = 400;
      throw error;
    }

    const allowedFields = [
      "title",
      "description",
      "symptoms",
      "diagnosis",
      "treatment",
      "observations",
      "prescriptions",
      "physicalExam",
      "vitalSigns",
      "consultDate",
      "nextAppointment",
      "customFields",
    ];
    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await prisma.Diagnostic.update({
      where: { id },
      data: updateData,
    });

    try {
      cacheService.invalidateDiagnostic(id);
      const mh = await prisma.medicalHistory.findUnique({
        where: { id: existing.medicalHistoryId },
        select: { patientId: true },
      });
      if (mh?.patientId) {
        cacheService.invalidateAllPatientDiagnostics(mh.patientId);
        cacheService.invalidatePatientTimeline(mh.patientId);
        cacheService.invalidatePatientMedicalHistory(mh.patientId);
      }
    } catch (_) {}

    return updated;
  }

  async updateDiagnosticState(id, newState) {
    const existing = await prisma.Diagnostic.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Diagnóstico no encontrado");
      error.status = 404;
      throw error;
    }

    const updated = await prisma.Diagnostic.update({
      where: { id },
      data: { state: newState },
    });
    try {
      cacheService.invalidateDiagnostic(id);
      const mh = await prisma.medicalHistory.findFirst({
        where: { diagnostics: { some: { id } } },
        select: { patientId: true },
      });
      if (mh?.patientId) {
        cacheService.invalidateAllPatientDiagnostics(mh.patientId);
        cacheService.invalidatePatientTimeline(mh.patientId);
        cacheService.invalidatePatientMedicalHistory(mh.patientId);
      }
    } catch (_) {}
    return updated;
  }

  async deleteDiagnostic(id) {
    const existing = await prisma.Diagnostic.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error("Diagnóstico no encontrado");
      error.status = 404;
      throw error;
    }

    await prisma.Diagnostic.update({
      where: { id },
      data: { state: "DELETED" },
    });

    try {
      cacheService.invalidateDiagnostic(id);
      const mh = await prisma.medicalHistory.findFirst({
        where: { diagnostics: { some: { id } } },
        select: { patientId: true },
      });
      if (mh?.patientId) {
        cacheService.invalidateAllPatientDiagnostics(mh.patientId);
        cacheService.invalidatePatientTimeline(mh.patientId);
        cacheService.invalidatePatientMedicalHistory(mh.patientId);
      }
    } catch (_) {}
  }

  /**
   * Clean up temporary files from local filesystem
   */
  async #cleanupTempFiles(files) {
    if (!files?.length || MS_PATIENT_EHR_CONFIG.VERCEL) return;

    for (const file of files) {
      if (file.path) {
        try {
          await fs.unlink(file.path);
        } catch (error) {}
      }
    }
  }
}

module.exports = new DiagnosticRepository();
