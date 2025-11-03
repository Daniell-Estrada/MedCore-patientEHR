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

router.post("/upload", uploadMultiple, uploadDocument);
router.get("/:id", downloadDocument);
router.get("/patient/:patientId", getDocumentByPatientId);
router.delete("/:id", deleteDocument);

router.post("/:id/version", uploadSingle, createDocumentVersion);
router.get("/:id/versions", listDocumentVersions);
router.get("/:id/version/:version", downloadDocumentVersion);

module.exports = router;
