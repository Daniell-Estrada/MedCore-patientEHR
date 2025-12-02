const express = require("express");
const router = express.Router();
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionPDF,
} = require("../controllers/prescriptionController");
const {
  createPrescriptionValidators,
} = require("../middleware/validationMiddleware");

// Create a new prescription
router.post(
  "/",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  createPrescriptionValidators,
  createPrescription
);

// Get prescription history for a patient
router.get(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR", "ENFERMERO"]),
  getPrescriptionsByPatient
);

// Get prescription PDF
router.get(
  "/:id/pdf",
  requireRoles(["MEDICO", "ADMINISTRADOR", "ENFERMERO"]),
  getPrescriptionPDF
);

module.exports = router;
