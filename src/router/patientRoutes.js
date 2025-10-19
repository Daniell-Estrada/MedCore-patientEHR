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
// const AdminMiddleware = require("../middleware/adminMiddleware");
const { uploadMultiple } = require("../config/multer");

// router.use(AdminMiddleware);

router.get("/", getAllPatients);
router.get("/search/advanced", advancedSearchPatients);
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);
router.patch("/state/:id", updatePatientState);

router.post("/:patientId/diagnostics", uploadMultiple, createDiagnostic);

module.exports = router;
