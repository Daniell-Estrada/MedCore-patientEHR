const express = require("express");
const router = express.Router();
const {
  getPatientMedicalHistory,
  getMedicalHistoryById,
  createMedicalHistory,
  updateMedicalHistory,
} = require("../controllers/medicalHistoryController");
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  createMedicalHistoryValidators,
  updateMedicalHistoryValidators,
} = require("../middleware/validationMiddleware");

router.get(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getPatientMedicalHistory,
);

router.get(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getMedicalHistoryById,
);

router.post(
  "/patient/:patientId",
  requireRoles(["MEDICO"]),
  createMedicalHistoryValidators,
  createMedicalHistory,
);

router.patch(
  "/:id",
  requireRoles(["MEDICO"]),
  updateMedicalHistoryValidators,
  updateMedicalHistory,
);

module.exports = router;
