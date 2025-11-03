const prisma = require("../config/db/postgresql");
const securityService = require("../services/securityService");
const DocumentRecordsBuilder = require("../utils/documentRecordsBuilder");
const { upload: storageUpload } = require("../services/storageService");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");
const medicalHistoryRepository = require("./medicalHistoryRepository");
const fs = require("fs").promises;

/**
 * Repository for managing diagnostics.
 */
class DiagnosticRepository {
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

      return diagnostic;
    } catch (error) {
      await this.#cleanupTempFiles(files);
      throw error;
    }
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
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }
  }
}

module.exports = new DiagnosticRepository();
