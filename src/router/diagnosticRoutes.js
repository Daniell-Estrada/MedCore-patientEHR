const express = require("express");
const router = express.Router();
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  getDiagnosticById,
  listPatientDiagnostics,
  getPredefinedDiagnostics,
} = require("../controllers/diagnosticController");

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

router.get(
  "/predefined/list",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  getPredefinedDiagnostics,
);

module.exports = router;
