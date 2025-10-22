const path = require("path");

class DocumentRecordsBuilder {
  /**
   * Creates document records from files for database insertion.
   */
  static buildDocumentRecords({
    diagnosticId,
    files,
    uploadedBy,
    uploadedFiles = null,
  }) {
    if (!files || files.length === 0) {
      return [];
    }

    if (uploadedFiles && uploadedFiles.length > 0) {
      return uploadedFiles.map(({ f, uploaded }) => ({
        diagnosticId,
        filename: f.originalname,
        storedFilename:
          uploaded.storedKey || f.filename || path.basename(uploaded.filePath),
        filePath: uploaded.filePath,
        fileType: (f.originalname.split(".").pop() || "").toLowerCase(),
        mimeType: f.mimetype,
        fileSize: f.size,
        description: null,
        uploadedBy,
      }));
    }

    return files.map((file) => ({
      diagnosticId,
      filename: file.originalname,
      storedFilename: file.filename,
      filePath: file.path,
      fileType: file.originalname.split(".").pop().toLowerCase(),
      mimeType: file.mimetype,
      fileSize: file.size,
      description: null,
      uploadedBy,
    }));
  }

  /**
   * Generates a unique filename for storage.
   */
  static generateUniqueFilename({
    patientId,
    originalname,
    prefix = "diagnostic",
  }) {
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const ext = path.extname(originalname);
    return `${prefix}-${patientId}-${timestamp}-${randomString}${ext}`;
  }
}

module.exports = DocumentRecordsBuilder;
