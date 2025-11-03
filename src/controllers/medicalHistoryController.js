const medicalHistoryRepository = require("../repositories/medicalHistoryRepository");

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
    if (error.message === "Patient not found") {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

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
    if (error.message === "Medical history record not found") {
      return res.status(404).json({ message: "Consulta médica no encontrada" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getPatientMedicalHistory,
  getMedicalHistoryById,
  createMedicalHistory,
  updateMedicalHistory,
};
