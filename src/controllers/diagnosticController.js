const diagnosticRepository = require("../repositories/diagnosticRepository");

/**
 * Create a new diagnostic for a patient.
 */
const createDiagnostic = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const diagnosticData = req.body;

    const diagnostic = await diagnosticRepository.createDiagnostic(
      patientId,
      doctorId,
      diagnosticData,
    );

    return res.status(201).json({
      message: "Diagnóstico creado correctamente",
      data: diagnostic,
    });
  } catch (error) {
    console.error("Error creating diagnostic:", error);
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

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
 * Get the list of predefined diagnostics.
 */
const getPredefinedDiagnostics = async (req, res) => {
  try {
    const { category, severity } = req.query;
    
    const diagnostics = await diagnosticRepository.getPredefinedDiagnostics({
      category,
      severity,
    });

    return res.status(200).json({
      message: "Diagnósticos predefinidos obtenidos correctamente",
      data: diagnostics,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  createDiagnostic,
  getDiagnosticById,
  listPatientDiagnostics,
  getPredefinedDiagnostics,
};
