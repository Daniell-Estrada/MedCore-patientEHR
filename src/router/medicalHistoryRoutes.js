const express = require("express");
const router = express.Router();
const {
  getPatientMedicalHistory,
  getMedicalHistoryById,
  createMedicalHistory,
  updateMedicalHistory,
  getPatientTimeline,
  getMyMedicalHistory,
  getMyTimeline,
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
  "/patient/:patientId/timeline",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getPatientTimeline,
);

router.get("/me", requireRoles(["PACIENTE"]), getMyMedicalHistory);

router.get("/me/timeline", requireRoles(["PACIENTE"]), getMyTimeline);

router.get(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getMedicalHistoryById,
);

router.post(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  createMedicalHistoryValidators,
  createMedicalHistory,
);

router.patch(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  updateMedicalHistoryValidators,
  updateMedicalHistory,
);

module.exports = router;
