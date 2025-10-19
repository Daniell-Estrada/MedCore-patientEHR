const express = require("express");
const router = express.Router();
const { uploadMultiple } = require("../config/multer");
const {
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getDocumentByPatientId,
} = require("../controllers/documentController");

router.post("/upload", uploadMultiple, uploadDocument);
router.get("/:id", downloadDocument);
router.get("/patient/:patientId", getDocumentByPatientId);
router.delete("/:id", deleteDocument);

module.exports = router;
