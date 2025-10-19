const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MS_PATIENT_EHR_CONFIG } = require("./environment");

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const diagnosticStorage = MS_PATIENT_EHR_CONFIG.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join("uploads", "patients/diagnostics");
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const patientId = req.params.patientId || "unknown";
        const timestamp = Date.now();
        const randomString = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);

        const filename = `diagnostic-${patientId}-${timestamp}-${randomString}${ext}`;
        cb(null, filename);
      },
    });

const diagnosticFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  const allowedExtensions = /pdf|jpg|jpeg|png/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  return cb(new Error("Tipo de archivo no permitido"), false);
};

const uploadDiagnostic = multer({
  storage: diagnosticStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: diagnosticFileFilter,
});

module.exports = {
  uploadSingle: uploadDiagnostic.single("document"),
  uploadMultiple: uploadDiagnostic.array("documents", 5),
};
