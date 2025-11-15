const express = require("express");
const router = express.Router();
const { uploadMultiple, uploadSingle } = require("../config/multer");
const {
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getDocumentByPatientId,
  createDocumentVersion,
  listDocumentVersions,
  downloadDocumentVersion,
} = require("../controllers/documentController");
const { requireRoles } = require("../middleware/roleMiddleware");

router.post(
  "/upload",
  uploadMultiple,
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  uploadDocument,
);
router.get("/:id", downloadDocument);
router.get("/patient/:patientId", getDocumentByPatientId);
router.delete(
  "/:id",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  deleteDocument,
);

router.post(
  "/:id/version",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  uploadSingle,
  createDocumentVersion,
);
router.get(
  "/:id/versions",
  requireRoles(["MEDICO", "ADMINISTRADOR"]),
  listDocumentVersions,
);
router.get("/:id/version/:version", downloadDocumentVersion);

module.exports = router;
