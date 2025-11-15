const authMiddleware = require("../middleware/authMiddleware");
const { contextMiddleware } = require("../middleware/requestContext");
const patientRoutes = require("./patientRoutes");
const documentRoutes = require("./documentRoutes");
const medicalHistoryRoutes = require("./medicalHistoryRoutes");
const diagnosticRoutes = require("./diagnosticRoutes");
const { auditInterceptor } = require("../interceptors/auditInterceptor");
const router = require("express").Router();

router.use(contextMiddleware);
router.use(authMiddleware);
router.use(auditInterceptor);

router.use("/documents", documentRoutes);
router.use("/patients", patientRoutes);
router.use("/diagnostics", diagnosticRoutes);
router.use("/medical-history", medicalHistoryRoutes);

module.exports = router;
