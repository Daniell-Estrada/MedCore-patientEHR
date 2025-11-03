const multer = require("multer");
const path = require("path");

const diagnosticStorage = multer.memoryStorage();

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
