const diagnosticRepository = require("../repositories/diagnosticRepository");

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
    );

    return res.status(201).json({
      message: "Diagnóstico creado correctamente",
      data: diagnostic,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  createDiagnostic,
};
