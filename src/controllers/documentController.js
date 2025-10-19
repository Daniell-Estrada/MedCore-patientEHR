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
            await fs.unlink(f.path);
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
    console.error("Error en uploadDocument:", error);
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
 * Download a document by its ID.
 */
const downloadDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await documentRepository.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }
    res.download(document.filePath, document.filename);
  } catch (error) {
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
  downloadDocument,
  deleteDocument,
};
