const express = require("express");
const {
  createPrescription,
  getPrescriptionsByPatient,
  getActivePrescriptionsByPatient,
  getPrescriptionById,
  getAllPrescriptionsPdfByPatient,
  downloadPrescriptionPdf,
  updatePrescriptionStatus,
} = require("../controllers/prescriptionController");
const {
  createPrescriptionValidation,
  patientIdValidation,
  paginationValidation,
  prescriptionIdValidation,
  updateStatusValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/", createPrescriptionValidation, createPrescription);

router.get(
  "/patient/:patientId",
  [...patientIdValidation, ...paginationValidation],
  getPrescriptionsByPatient,
);

router.get(
  "/patient/:patientId/active",
  patientIdValidation,
  getActivePrescriptionsByPatient,
);

router.get(
  "/patient/:patientId/pdf",
  patientIdValidation,
  getAllPrescriptionsPdfByPatient,
);

router.get("/:id", prescriptionIdValidation, getPrescriptionById);

router.get("/:id/pdf", prescriptionIdValidation, downloadPrescriptionPdf);

router.patch("/:id/status", updateStatusValidation, updatePrescriptionStatus);

module.exports = router;
