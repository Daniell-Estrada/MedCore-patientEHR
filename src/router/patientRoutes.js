const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  updatePatientState,
  advancedSearchPatients,
} = require("../controllers/patientController");
const { createDiagnostic } = require("../controllers/diagnosticController");
const AdminMiddleware = require("../middleware/adminMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  updatePatientValidators,
  createDiagnosticValidators,
  createPatientValidators,
  advancedSearchQueryValidators,
} = require("../middleware/validationMiddleware");
const { uploadMultiple } = require("../config/multer");

router.get(
  "/",
  requireRoles(["ADMINISTRADOR", "MEDICO", "ENFERMERO"]),
  getAllPatients,
);
router.get(
  "/search/advanced",
  requireRoles(["ADMINISTRADOR", "MEDICO", "ENFERMERO"]),
  advancedSearchQueryValidators,
  advancedSearchPatients,
);
router.get(
  "/:id",
  requireRoles(["ADMINISTRADOR", "MEDICO", "ENFERMERO", "PACIENTE"]),
  getPatientById,
);
router.post(
  "/",
  requireRoles(["ADMINISTRADOR"]),
  createPatientValidators,
  createPatient,
);
router.put("/:id", AdminMiddleware, updatePatientValidators, updatePatient);
router.patch("/state/:id", AdminMiddleware, updatePatientState);

router.post(
  "/:patientId/diagnostics",
  requireRoles(["ADMINISTRADOR", "MEDICO"]),
  uploadMultiple,
  createDiagnosticValidators,
  createDiagnostic,
);

module.exports = router;
