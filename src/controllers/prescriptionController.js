const prescriptionRepository = require("../repositories/prescriptionRepository");
const prescriptionPDFService = require("../services/prescriptionPDFService");
const securityService = require("../services/securityService");
const prisma = require("../config/db/postgresql");

/**
 * Create a new prescription for a patient
 * POST /api/prescriptions
 */
const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions,
      medicationType,
      startDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!patientId || !medicationName || !dosage || !frequency) {
      return res.status(400).json({
        message: "Faltan campos obligatorios",
        required: ["patientId", "medicationName", "dosage", "frequency"],
      });
    }

    const doctorId = req.user.id;

    // Create prescription with allergy check
    const { prescription, allergyWarning } =
      await prescriptionRepository.createPrescription(patientId, doctorId, {
        medicationName,
        dosage,
        frequency,
        duration,
        instructions,
        medicationType,
        startDate,
        notes,
      });

    // Get patient and doctor info for PDF
    const patientInfo = await securityService.getUserById(patientId);
    const doctorInfo = req.securityUser || { fullname: "Doctor", email: "" };

    // Generate PDF
    let pdfPath = null;
    try {
      pdfPath = await prescriptionPDFService.generatePrescriptionPDF(
        prescription,
        patientInfo,
        doctorInfo
      );

      // Update prescription with PDF path
      await prisma.Prescription.update({
        where: { id: prescription.id },
        data: { pdfPath },
      });
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      // Continue even if PDF generation fails
    }

    return res.status(201).json({
      message: "Prescripción creada correctamente",
      data: {
        ...prescription,
        pdfPath,
      },
      warning: allergyWarning || null,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error creating prescription:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get prescription history for a patient
 * GET /api/prescriptions/patient/:patientId
 */
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await prescriptionRepository.getPrescriptionsByPatient(
      patientId,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      }
    );

    return res.status(200).json({
      message: "Historial de prescripciones obtenido correctamente",
      ...result,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error getting prescriptions:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get prescription PDF
 * GET /api/prescriptions/:id/pdf
 */
const getPrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prescriptionRepository.getPrescriptionById(id);

    if (!prescription.pdfPath) {
      return res.status(404).json({
        message: "PDF no disponible para esta prescripción",
      });
    }

    // Check if file exists
    const fs = require("fs");
    if (!fs.existsSync(prescription.pdfPath)) {
      return res.status(404).json({
        message: "Archivo PDF no encontrado",
      });
    }

    // Send PDF file
    return res.download(prescription.pdfPath, `prescripcion_${id}.pdf`);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error getting prescription PDF:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionPDF,
};
