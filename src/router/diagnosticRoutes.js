const express = require("express");
const router = express.Router();
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  createDiagnostic,
  getDiagnosticById,
  listPatientDiagnostics,
  getPredefinedDiagnostics,
  updateDiagnosticState,
} = require("../controllers/diagnosticController");
const {
  createDiagnosticValidators,
  updateDiagnosticStateValidators,
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

// Update diagnostic state (soft delete/archive)
router.patch(
  "/:id/state",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  updateDiagnosticStateValidators,
  updateDiagnosticState,
);

module.exports = router;
