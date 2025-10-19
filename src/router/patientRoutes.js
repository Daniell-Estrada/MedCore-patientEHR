const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
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
router.put("/:id", AdminMiddleware, updatePatientValidators, updatePatient);
router.patch("/state/:id", AdminMiddleware, updatePatientState);

router.post(
  "/:patientId/diagnostics",
  requireRoles(["MEDICO"]),
  uploadMultiple,
  createDiagnosticValidators,
  createDiagnostic,
);

module.exports = router;
