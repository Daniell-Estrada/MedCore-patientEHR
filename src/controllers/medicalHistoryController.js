const medicalHistoryRepository = require("../repositories/medicalHistoryRepository");

/**
 * Get all medical history records with pagination.
 */
const getAllMedicalHistories = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payload = await medicalHistoryRepository.getAllMedicalHistories({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get medical history records for a specific patient with pagination.
 */
const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const payload = await medicalHistoryRepository.getPatientMedicalHistory(
      patientId,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
    );

    if (!payload) {
      return res.status(404).json({
        message: "No se encontró historial médico para este paciente",
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get the authenticated patient's own medical history with pagination.
 */
const getMyMedicalHistory = async (req, res) => {
  try {
    const patientId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!patientId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const payload = await medicalHistoryRepository.getPatientMedicalHistory(
      patientId,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
    );

    if (!payload) {
      return res.status(404).json({
        message: "No se encontró historial médico para este paciente",
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get a specific medical history record by its ID.
 */
const getMedicalHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await medicalHistoryRepository.getMedicalHistoryById(id);

    return res.status(200).json({
      message: "Consulta médica obtenida correctamente",
      data: record,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get the timeline of medical history events for a specific patient.
 */
const getPatientTimeline = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const payload = await medicalHistoryRepository.getPatientTimeline(
      patientId,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
    );

    return res.status(200).json({
      message: "Timeline obtenido correctamente",
      ...payload,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Get the authenticated patient's own medical history timeline.
 */
const getMyTimeline = async (req, res) => {
  try {
    const patientId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!patientId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const payload = await medicalHistoryRepository.getPatientTimeline(
      patientId,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
    );

    return res.status(200).json({
      message: "Timeline obtenido correctamente",
      ...payload,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Create or get an existing medical history record for a patient.
 */
const createMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    const record = await medicalHistoryRepository.createMedicalHistory(
      patientId,
      userId,
    );

    return res.status(201).json({
      message: "Historial médico creado/obtenido correctamente",
      data: record,
    });
  } catch (error) {
    console.error("Error creating medical history:", error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Error interno del servidor" });
  }
};

/**
 * Update an existing medical history record.
 */
const updateMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedRecord = await medicalHistoryRepository.updateMedicalHistory(
      id,
      updateData,
    );

    return res.status(200).json({
      message: "Consulta médica actualizada correctamente",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating medical history:", error);
    if (error.message === "Medical history record not found") {
      return res.status(404).json({ message: "Consulta médica no encontrada" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getAllMedicalHistories,
  getPatientMedicalHistory,
  getMedicalHistoryById,
  getPatientTimeline,
  getMyMedicalHistory,
  getMyTimeline,
  createMedicalHistory,
  updateMedicalHistory,
};
