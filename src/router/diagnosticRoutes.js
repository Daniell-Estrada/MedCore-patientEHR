const express = require("express");
const router = express.Router();
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  getDiagnosticById,
  listPatientDiagnostics,
  createDiagnostic,
  updateDiagnostic,
  updateDiagnosticState,
  deleteDiagnostic,
} = require("../controllers/diagnosticController");
const {
  createDiagnosticValidators,
  updateDiagnosticValidators,
  updateDiagnosticStateValidators,
} = require("../middleware/validationMiddleware");
const { uploadMultiple } = require("../config/multer");

router.get(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getDiagnosticById,
);

router.get(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  listPatientDiagnostics,
);

router.post(
  "/patient/:patientId",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  uploadMultiple,
  createDiagnosticValidators,
  createDiagnostic,
);

router.patch(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  updateDiagnosticValidators,
  updateDiagnostic,
);

router.patch(
  "/:id/state",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  updateDiagnosticStateValidators,
  updateDiagnosticState,
);

router.delete(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  deleteDiagnostic,
);

module.exports = router;
