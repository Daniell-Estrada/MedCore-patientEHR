const express = require("express");
const router = express.Router();
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  createDiagnostic,
  getDiagnosticById,
  listPatientDiagnostics,
  getPredefinedDiagnostics,
} = require("../controllers/diagnosticController");
const {
  createDiagnosticValidators,
} = require("../middleware/validationMiddleware");

// Create a new diagnostic for a patient
router.post(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  createDiagnosticValidators,
  createDiagnostic,
);

router.get(
  "/predefined/list",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getPredefinedDiagnostics,
);

router.get(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  listPatientDiagnostics,
);

router.get(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getDiagnosticById,
);

module.exports = router;
