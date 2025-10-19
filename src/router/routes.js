const authMiddleware = require("../middleware/authMiddleware");
const { contextMiddleware } = require("../middleware/requestContext");
const patientRoutes = require("./patientRoutes");
const documentRoutes = require("./documentRoutes");
const router = require("express").Router();

router.use(contextMiddleware);
router.use(authMiddleware);

router.use("/documents", documentRoutes);
router.use("/patients", patientRoutes);

module.exports = router;
