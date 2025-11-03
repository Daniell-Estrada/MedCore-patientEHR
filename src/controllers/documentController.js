const documentRepository = require("../repositories/documentRepository");
const { validateDocument } = require("../utils/documentValidator");

/**
 * Upload documents associated with a patient and diagnostic.
 */
const uploadDocument = async (req, res) => {
  try {
    const { patientId, diagnosticId } = req.body;

    if (!patientId || !diagnosticId) {
      if (req.files?.length) {
        const fs = require("fs").promises;
        for (const f of req.files) {
          try {
            if (f.path) await fs.unlink(f.path);
          } catch (_) {}
        }
      }
      return res.status(400).json({
        message:
          "Asociación obligatoria: se requieren patientId y diagnosticId",
      });
    }

    const { error } = validateDocument({ files: req.files || [] });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const docs = await documentRepository.uploadDocuments({
      patientId,
      diagnosticId,
      files: req.files || [],
      uploadedBy: req.user.id,
    });
    return res.status(201).json({
      message: "Documento(s) subido(s) correctamente",
      data: docs,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get documents by patient ID.
 */
const getDocumentByPatientId = async (req, res) => {
  const { patientId } = req.params;
  try {
    const documents =
      await documentRepository.getDocumentsByPatientId(patientId);
    return res.status(200).json({
      message: "Documentos obtenidos correctamente",
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * List all versions of a document by its ID.
 */
const listDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await documentRepository.getDocumentVersions(id);
    return res.status(200).json({
      message: "Versiones obtenidas correctamente",
      data: versions,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Download a document by its ID.
 */
const downloadDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await documentRepository.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }
    if (/^https?:\/\//i.test(document.filePath)) {
      return res.redirect(302, document.filePath);
    }
    return res.download(document.filePath, document.filename);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Download a specific version of a document.
 */
const downloadDocumentVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const v = await documentRepository.getDocumentVersion(
      id,
      parseInt(version, 10),
    );
    if (!v) {
      return res.status(404).json({ message: "Versión no encontrada" });
    }
    if (/^https?:\/:\//i.test(v.filePath)) {
      return res.redirect(302, v.filePath);
    }
    return res.download(v.filePath, v.filename);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Create a new version of a document.
 */
const createDocumentVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const file = req.file;

    const { error } = validateDocument({ files: file ? [file] : [] });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const version = await documentRepository.createDocumentVersion({
      documentId: id,
      file,
      uploadedBy: req.user.id,
      reason: reason || null,
    });

    return res.status(201).json({
      message: "Nueva versión creada correctamente",
      data: version,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Delete a document by its ID.
 */
const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await documentRepository.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }
    await documentRepository.deleteDocument(id);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  uploadDocument,
  getDocumentByPatientId,
  listDocumentVersions,
  downloadDocument,
  downloadDocumentVersion,
  createDocumentVersion,
  deleteDocument,
};

