const prisma = require("../config/db/postgresql");
const securityService = require("../services/securityService");
const fs = require("fs").promises;

/**
 * Repository for managing diagnostics.
 */
class DiagnosticRepository {
  async createDiagnostic(patientId, doctorId, diagnosticData, files) {
    try {
      const patient = await prisma.Patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      if (patient.state === "INACTIVE") {
        throw new Error("Cannot add diagnostics to an inactive patient");
      }

      const doctor = await securityService.getUserById(doctorId);

      if (!doctor || doctor.role !== "MEDICO") {
        throw new Error("Only doctors can add diagnostics");
      }

      const diagnostic = await prisma.$transaction(async (tx) => {
        const newDiagnostic = await tx.Diagnostic.create({
          data: {
            patientId,
            doctorId,
            title: diagnosticData.title,
            description: diagnosticData.description,
            symptoms: diagnosticData.symptoms,
            diagnosis: diagnosticData.diagnosis,
            treatment: diagnosticData.treatment,
            observations: diagnosticData.observations || null,
            nextAppointment: diagnosticData.nextAppointment
              ? new Date(diagnosticData.nextAppointment)
              : null,
          },
        });

        if (files && files.length > 0) {
          const documentRecords = files.map((file) => ({
            diagnosticId: newDiagnostic.id,
            filename: file.originalname,
            storedFilename: file.filename,
            filePath: file.path,
            fileType: file.originalname.split(".").pop().toLowerCase(),
            mimeType: file.mimetype,
            fileSize: file.size,
            description: null,
            uploadedBy: doctorId,
          }));

          await tx.DiagnosticDocument.createMany({
            data: documentRecords,
          });
        }

        const result = await tx.Diagnostic.findUnique({
          where: { id: newDiagnostic.id },
          include: {
            documents: true,
            patient: true,
          },
        });
        return {
          patient: result.patient,
          doctor: doctor,
          documents: result.documents,
        };
      });

      return diagnostic;
    } catch (error) {
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (fsError) {
            new Error("Error deleting file");
          }
        }
      }
      throw error;
    }
  }
}

module.exports = new DiagnosticRepository();
