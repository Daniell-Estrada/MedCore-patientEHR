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
const AdminMiddleware = require("../middleware/adminMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  updatePatientValidators,
  createPatientValidators,
  advancedSearchQueryValidators,
} = require("../middleware/validationMiddleware");

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
router.put(
  "/:id",
  AdminMiddleware,
  requireRoles(["ADMINISTRADOR"]),
  updatePatientValidators,
  updatePatient,
);
router.patch(
  "/state/:id",
  AdminMiddleware,
  requireRoles(["ADMINISTRADOR"]),
  updatePatientState,
);

module.exports = router;
