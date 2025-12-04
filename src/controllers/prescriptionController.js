const prescriptionRepository = require("../repositories/prescriptionRepository");
const securityService = require("../services/securityService");
const prescriptionPdfService = require("../services/prescriptionPdfService");

/**
 * Medication allergy database - medications and their active ingredients
 * Used to verify patient allergies
 */
const MEDICATION_DATABASE = {
  penicilina: ["amoxicilina", "ampicilina", "penicilina"],
  sulfonamidas: ["sulfametoxazol", "sulfasalazina"],
  aspirina: ["ácido acetilsalicílico", "aspirina", "asa"],
  ibuprofeno: ["ibuprofeno", "naproxeno"],
  codeina: ["codeína", "morfina", "oxicodona"],
  latex: ["látex"],
};

/**
 * Medication duration by type
 */
const MEDICATION_DURATION = {
  antibiotico: { min: 5, max: 14, default: 7, type: "días" },
  antiinflamatorio: { min: 3, max: 10, default: 5, type: "días" },
  analgesico: { min: 1, max: 7, default: 3, type: "días" },
  antihipertensivo: { min: 30, max: 365, default: 30, type: "días" },
  anticoagulante: { min: 30, max: 365, default: 90, type: "días" },
  vitamina: { min: 30, max: 90, default: 30, type: "días" },
  antidiabetico: { min: 30, max: 365, default: 30, type: "días" },
  default: { min: 1, max: 30, default: 7, type: "días" },
};

/**
 * Check if medication conflicts with patient allergies
 */
const checkAllergyConflict = (allergies, activeIngredient) => {
  if (!allergies || allergies.length === 0) return null;

  const lowerIngredient = activeIngredient.toLowerCase();

  for (const allergy of allergies) {
    const lowerAllergy = allergy.toLowerCase();

    if (lowerIngredient.includes(lowerAllergy)) {
      return allergy;
    }

    if (MEDICATION_DATABASE[lowerAllergy]) {
      const relatedMedications = MEDICATION_DATABASE[lowerAllergy];
      for (const med of relatedMedications) {
        if (lowerIngredient.includes(med)) {
          return allergy;
        }
      }
    }
  }

  return null;
};

/**
 * Validate medication duration based on type
 */
const validateMedicationDuration = (medicationType, duration, durationType) => {
  const medType = medicationType.toLowerCase();
  const config = MEDICATION_DURATION[medType] || MEDICATION_DURATION.default;

  let durationInDays = duration;
  if (durationType === "semanas" || durationType === "weeks") {
    durationInDays = duration * 7;
  } else if (durationType === "meses" || durationType === "months") {
    durationInDays = duration * 30;
  }

  if (durationInDays < config.min || durationInDays > config.max) {
    return {
      valid: false,
      message: `La duración para ${medicationType} debe estar entre ${config.min} y ${config.max} días. Duración sugerida: ${config.default} ${config.type}`,
      suggested: { duration: config.default, durationType: config.type },
    };
  }

  return { valid: true };
};

/**
 * Create a new prescription
 */
const createPrescription = async (req, res) => {
  try {
    const { patientId, diagnosticId, medications, notes, allergies } = req.body;
    const doctorId = req.user.id;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    if (!medications || medications.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one medication is required" });
    }

    const patientInfo = await securityService.getUserById(patientId);
    if (!patientInfo) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const prisma = require("../config/db/postgresql");
    let medicalHistory = await prisma.MedicalHistory.findUnique({
      where: { patientId },
    });

    if (!medicalHistory) {
      medicalHistory = await prisma.MedicalHistory.create({
        data: {
          patientId,
          createdBy: doctorId,
        },
      });
    }

    const historicalAllergies =
      await prescriptionRepository.getPatientAllergies(patientId);
    const combinedAllergies = [
      ...new Set([...(allergies || []), ...historicalAllergies]),
    ];

    const allergyWarnings = [];
    const durationWarnings = [];

    for (const med of medications) {
      const allergyConflict = checkAllergyConflict(
        combinedAllergies,
        med.activeIngredient,
      );

      if (allergyConflict) {
        allergyWarnings.push({
          medication: med.medicationName,
          allergy: allergyConflict,
          message: `ADVERTENCIA: El paciente es alérgico a ${allergyConflict}. El medicamento ${med.medicationName} contiene ${med.activeIngredient}.`,
        });
      }

      if (med.medicationType) {
        const durationValidation = validateMedicationDuration(
          med.medicationType,
          med.duration,
          med.durationType,
        );

        if (!durationValidation.valid) {
          durationWarnings.push({
            medication: med.medicationName,
            message: durationValidation.message,
            suggested: durationValidation.suggested,
          });
        }
      }
    }

    if (allergyWarnings.length > 0) {
      return res.status(400).json({
        message: "Allergy conflicts detected",
        allergyWarnings,
        patientAllergies: combinedAllergies,
      });
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const prescription = await prescriptionRepository.createPrescription({
      medicalHistoryId: medicalHistory.id,
      diagnosticId: diagnosticId || null,
      doctorId,
      patientId,
      medications,
      notes,
      allergies: combinedAllergies,
      validUntil,
    });

    const doctorInfo = await securityService.getUserById(doctorId);
    const pdfBuffer = await prescriptionPdfService.generatePrescriptionPdf(
      prescription,
      patientInfo,
      doctorInfo,
    );

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
      durationWarnings: durationWarnings.length > 0 ? durationWarnings : null,
      pdf: {
        available: true,
        size: pdfBuffer.length,
        downloadUrl: `/api/prescriptions/${prescription.id}/pdf`,
      },
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return res.status(500).json({
      message: "Error creating prescription",
      error: error.message,
    });
  }
};

/**
 * Get prescriptions by patient ID with pagination and optional status filter
 */
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const patientInfo = await securityService.getUserById(patientId);
    if (!patientInfo) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const result = await prescriptionRepository.getPrescriptionsByPatientId(
      patientId,
      parseInt(page),
      parseInt(limit),
    );

    if (status) {
      result.data = result.data.filter((p) => p.status === status);
      result.total = result.data.length;
      result.pages = Math.ceil(result.total / limit);
    }

    return res.status(200).json({
      message: "Prescriptions retrieved successfully",
      ...result,
      patient: {
        id: patientInfo.id,
        name: patientInfo.name || patientInfo.username,
      },
    });
  } catch (error) {
    console.error("Error getting prescriptions:", error);
    return res.status(500).json({
      message: "Error retrieving prescriptions",
      error: error.message,
    });
  }
};

/**
 * Get prescription by ID
 */
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prescriptionRepository.getPrescriptionById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    return res.status(200).json({
      message: "Prescription retrieved successfully",
      prescription,
    });
  } catch (error) {
    console.error("Error getting prescription:", error);
    return res.status(500).json({
      message: "Error retrieving prescription",
      error: error.message,
    });
  }
};

/**
 * Download all prescriptions as PDF for a patient
 */

const getAllPrescriptionsPdfByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    const [patientInfo, prescriptions] = await Promise.all([
      securityService.getUserById(patientId),
      prescriptionRepository.getAllPrescriptionsByPatientId(patientId),
    ]);

    for (const prescription of prescriptions) {
      const doctorInfo = await securityService.getUserById(
        prescription.doctorId,
      );
      prescription.doctorInfo = doctorInfo;
    }

    console.log("Prescriptions found:", patientInfo);

    if (!patientInfo) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!prescriptions || prescriptions.length === 0) {
      return res
        .status(404)
        .json({ message: "No prescriptions found for this patient" });
    }

    const pdfBuffer = await prescriptionPdfService.generateAllPrescriptionsPdf(
      prescriptions,
      patientInfo,
    );

    const filenameBase =
      (patientInfo.fullname || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "") || patientId;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=all-prescriptions-${filenameBase}.pdf`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

/**
 * Download prescription as PDF
 */
const downloadPrescriptionPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prescriptionRepository.getPrescriptionById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const [patientInfo, doctorInfo] = await Promise.all([
      securityService.getUserById(prescription.patientId),
      securityService.getUserById(prescription.doctorId),
    ]);

    const pdfBuffer = await prescriptionPdfService.generatePrescriptionPdf(
      prescription,
      patientInfo,
      doctorInfo,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription-${prescription.id}.pdf`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading prescription PDF:", error);
    return res.status(500).json({
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

/**
 * Update prescription status
 */
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "COMPLETED", "CANCELLED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses: ["ACTIVE", "COMPLETED", "CANCELLED"],
      });
    }

    const prescription = await prescriptionRepository.updatePrescriptionStatus(
      id,
      status,
    );

    return res.status(200).json({
      message: "Prescription status updated successfully",
      prescription,
    });
  } catch (error) {
    console.error("Error updating prescription status:", error);
    return res.status(500).json({
      message: "Error updating prescription status",
      error: error.message,
    });
  }
};

/**
 * Get active prescriptions for a patient
 */
const getActivePrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patientInfo = await securityService.getUserById(patientId);
    if (!patientInfo) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const prescriptions =
      await prescriptionRepository.getActivePrescriptionsByPatientId(patientId);

    return res.status(200).json({
      message: "Active prescriptions retrieved successfully",
      total: prescriptions.length,
      prescriptions,
      patient: {
        id: patientInfo.id,
        name: patientInfo.name || patientInfo.username,
      },
    });
  } catch (error) {
    console.error("Error getting active prescriptions:", error);
    return res.status(500).json({
      message: "Error retrieving active prescriptions",
      error: error.message,
    });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionById,
  getAllPrescriptionsPdfByPatient,
  downloadPrescriptionPdf,
  updatePrescriptionStatus,
  getActivePrescriptionsByPatient,
};
