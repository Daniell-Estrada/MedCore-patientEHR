const patientRepository = require("../repositories/patientRepository");

/**
 * Get all patients with pagination
 * Combines data from ms-security and local EHR database
 */
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const payload = await patientRepository.getAllPatients(page, limit);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

/**
 * Get patient by ID
 * Combines data from ms-security and local EHR database
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = await patientRepository.getPatientById(id);
    return res.json(payload);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Advanced search for patients based on diagnostic and date range
 */
const advancedSearchPatients = async (req, res) => {
  try {
    const { diagnostic, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    if (!diagnostic && !dateFrom && !dateTo) {
      return res.status(400).json({
        message: "Insuficient parameters for search",
        required: [
          "At least one of the following query parameters must be provided:",
          "diagnostic (string)",
          "dateFrom (ISO date string)",
          "dateTo (ISO date string)",
        ],
      });
    }

    const payload = await patientRepository.advancePatientSearch({
      diagnostic,
      dateFrom,
      dateTo,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return res.status(200).json({
      ...payload,
      filters: {
        diagnostic: diagnostic || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Update patient information
 * Delegates core user updates to ms-security and syncs EHR projection (age, patient row)
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await patientRepository.updatePatient(id, req.body);
    return res.status(200).json({
      message: "Paciente actualizado correctamente",
      patient: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Update patient state (ACTIVE/INACTIVE) via ms-security and mirror locally
 */
const updatePatientState = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatus = ["ACTIVE", "INACTIVE"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: `El estado debe ser uno de: ${allowedStatus.join(", ")}`,
      });
    }
    const updatedUser = await patientRepository.updatePatientState(id, status);
    return res.json({
      message: "Estado del paciente actualizado correctamente",
      patient: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatient,
  updatePatientState,
  advancedSearchPatients,
};
