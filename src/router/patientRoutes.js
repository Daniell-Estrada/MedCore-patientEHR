const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  updatePatient,
  updatePatientState,
} = require("../controllers/patientController");
const AdminMiddleware = require("../middleware/adminMiddleware");

router.use(AdminMiddleware);

router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);
router.patch("/state/:id", updatePatientState);

module.exports = router;
