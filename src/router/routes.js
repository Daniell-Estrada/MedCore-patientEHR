const authMiddleware = require("../middleware/authMiddleware");
const patientRoutes = require("./patientRoutes");
const router = require("express").Router();

router.use(authMiddleware);

router.use("/patients", patientRoutes);

module.exports = router;
