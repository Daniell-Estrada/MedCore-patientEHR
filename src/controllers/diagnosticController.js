const diagnosticRepository = require("../repositories/diagnosticRepository");

/**
 * Get a diagnostic by its ID.
 */
const getDiagnosticById = async (req, res) => {
  try {
    const { id } = req.params;
    const diagnostic = await diagnosticRepository.getDiagnosticById(id);
    return res.status(200).json({
      message: "Diagnóstico obtenido correctamente",
      data: diagnostic,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * List diagnostics for a specific patient with pagination and optional filters.
 */
const listPatientDiagnostics = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20, state, dateFrom, dateTo } = req.query;

    const payload = await diagnosticRepository.listDiagnosticsByPatient(
      patientId,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        state,
        dateFrom,
        dateTo,
      },
    );

    return res.status(200).json(payload);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Create a new diagnostic for a patient.
 */
const createDiagnostic = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;
    const files = req.files;

    const { title, description, symptoms, diagnosis, treatment } = req.body;

    if (!title || !description || !symptoms || !diagnosis || !treatment) {
      if (files && files.length > 0) {
        const fs = require("fs").promises;
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            new Error("Error deleting file");
          }
        }
      }

      return res.status(400).json({
        message: "Faltan campos obligatorios para crear el diagnóstico",
        required: [
          "title",
          "description",
          "symptoms",
          "diagnosis",
          "treatment",
        ],
      });
    }

    const diagnostic = await diagnosticRepository.createDiagnostic(
      patientId,
      doctorId,
      req.body,
      files,
      req.securityUser,
    );

    return res.status(201).json({
      message: "Diagnóstico creado correctamente",
      data: diagnostic,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Error interno del servidor" });
  }
};
/**
 * Update an existing diagnostic.
 */
const updateDiagnostic = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData === undefined) {
      return res
        .status(400)
        .json({ message: "No se proporcionaron datos para actualizar" });
    }

    const updated = await diagnosticRepository.updateDiagnostic(id, updateData);

    return res.status(200).json({
      message: "Diagnóstico actualizado correctamente",
      data: updated,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Error interno del servidor" });
  }
};

/**
 * Update the state of a diagnostic.
 */
const updateDiagnosticState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;
    const allowedStatus = ["ACTIVE", "INACTIVE", "DELETED"];

    if (!allowedStatus.includes(state)) {
      return res.status(400).json({
        message: `El estado debe ser uno de: ${allowedStatus.join(", ")}`,
      });
    }

    const updated = await diagnosticRepository.updateDiagnosticState(id, state);

    return res.status(200).json({
      message: "Estado del diagnóstico actualizado correctamente",
      data: updated,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Delete a diagnostic by its ID.
 */
const deleteDiagnostic = async (req, res) => {
  try {
    const { id } = req.params;
    await diagnosticRepository.deleteDiagnostic(id);
    return res.status(200).json({ message: "Diagnóstico eliminado" });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getDiagnosticById,
  listPatientDiagnostics,
  createDiagnostic,
  updateDiagnostic,
  updateDiagnosticState,
  deleteDiagnostic,
};
