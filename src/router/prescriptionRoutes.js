const express = require("express");
const {
  createPrescription,
  getPrescriptionsByPatient,
  getActivePrescriptionsByPatient,
  getPrescriptionById,
  getAllPrescriptionsPdfByPatient,
  downloadPrescriptionPdf,
  updatePrescriptionStatus,
} = require("../controllers/prescriptionController");
const {
  createPrescriptionValidation,
  patientIdValidation,
  paginationValidation,
  prescriptionIdValidation,
  updateStatusValidation,
} = require("../middleware/validationMiddleware");

const router = express.Router();

/**
 * @openapi
 * /prescriptions:
 *   post:
 *     tags: [Prescriptions]
 *     summary: Crea una prescripción para un paciente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Prescripción creada correctamente.
 */
router.post("/", createPrescriptionValidation, createPrescription);

/**
 * @openapi
 * /prescriptions/patient/{patientId}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Lista prescripciones de un paciente.
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listado de prescripciones.
 */
router.get(
  "/patient/:patientId",
  [...patientIdValidation, ...paginationValidation],
  getPrescriptionsByPatient,
);

/**
 * @openapi
 * /prescriptions/patient/{patientId}/active:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Obtiene las prescripciones activas del paciente.
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescripciones activas del paciente.
 */
router.get(
  "/patient/:patientId/active",
  patientIdValidation,
  getActivePrescriptionsByPatient,
);

/**
 * @openapi
 * /prescriptions/patient/{patientId}/pdf:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Descarga en un solo PDF todas las prescripciones del paciente.
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo PDF generado.
 */
router.get(
  "/patient/:patientId/pdf",
  patientIdValidation,
  getAllPrescriptionsPdfByPatient,
);

/**
 * @openapi
 * /prescriptions/{id}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Obtiene una prescripción por identificador.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescripción encontrada.
 *       404:
 *         description: Prescripción no existe.
 */
router.get("/:id", prescriptionIdValidation, getPrescriptionById);

/**
 * @openapi
 * /prescriptions/{id}/pdf:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Descarga un PDF de la prescripción.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo PDF devuelto.
 */
router.get("/:id/pdf", prescriptionIdValidation, downloadPrescriptionPdf);

/**
 * @openapi
 * /prescriptions/{id}/status:
 *   patch:
 *     tags: [Prescriptions]
 *     summary: Actualiza el estado de una prescripción.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 */
router.patch("/:id/status", updateStatusValidation, updatePrescriptionStatus);

module.exports = router;
