const { body, validationResult, query, param } = require("express-validator");

/**
 * Middleware to handle validation results
 */

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

const sanitizeText = (field) =>
  body(field)
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage(`${field} es obligatorio`);

const optionalText = (field) => body(field).optional().trim().escape();

const validateEmail = body("email")
  .optional()
  .trim()
  .isEmail()
  .withMessage("Email inválido")
  .normalizeEmail();

const validateUUID = (field) =>
  body(field)
    .optional()
    .isUUID()
    .withMessage(`${field} debe ser un UUID válido`);

const validateDate = (field) =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} debe ser una fecha ISO válida`)
    .toDate();

const validateAgeRange = body("age")
  .optional()
  .isInt({ min: 0, max: 100 })
  .withMessage("La edad debe estar entre 0 y 100 años");

const createPatientValidators = [
  optionalText("userId"),
  body("email")
    .if((value, { req }) => !req.body.userId)
    .trim()
    .isEmail()
    .withMessage(
      "Email es requerido y debe ser válido si no se proporciona userId",
    )
    .normalizeEmail(),
  body("fullname")
    .if((value, { req }) => !req.body.userId)
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage(
      "Nombre completo es requerido (mínimo 3 caracteres) si no se proporciona userId",
    ),
  body("identificacion")
    .if((value, { req }) => !req.body.userId)
    .trim()
    .escape()
    .matches(/^[A-Za-z0-9-_.]{5,50}$/)
    .withMessage(
      "Identificación es requerida y debe ser válida (5-50 caracteres alfanuméricos) si no se proporciona userId",
    ),
  body("date_of_birth")
    .if((value, { req }) => !req.body.userId)
    .isISO8601()
    .withMessage(
      "Fecha de nacimiento es requerida y debe ser ISO válida si no se proporciona userId",
    )
    .toDate(),
  optionalText("phone")
    .matches(/^[0-9+\-()\s]{6,20}$/)
    .withMessage("Teléfono debe tener formato válido"),
  optionalText("current_password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres"),
  handleValidation,
];

const updatePatientValidators = [
  optionalText("fullname").isLength({ min: 3 }).withMessage("Nombre muy corto"),
  optionalText("identificacion")
    .matches(/^[A-Za-z0-9-_.]{5,50}$/)
    .withMessage("Identificación inválida"),
  validateEmail,
  optionalText("phone")
    .matches(/^[0-9+\-()\s]{6,20}$/)
    .withMessage("Teléfono inválido"),
  validateDate("date_of_birth"),
  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Estado inválido"),
  handleValidation,
];

const advancedSearchQueryValidators = [
  query("diagnostic").optional().trim().escape(),
  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("dateFrom debe ser una fecha ISO válida"),
  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("dateTo debe ser una fecha ISO válida"),
  query("page")
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("page debe ser entero >= 1"),
  query("limit")
    .optional()
    .toInt()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit debe ser entero entre 1 y 100"),
  handleValidation,
];

const createDiagnosticValidators = [
  sanitizeText("title"),
  sanitizeText("description"),
  sanitizeText("symptoms"),
  sanitizeText("diagnosis"),
  sanitizeText("treatment"),
  optionalText("observations"),
  optionalText("prescriptions"),
  optionalText("physicalExam"),
  optionalText("vitalSigns"),
  validateDate("consultDate"),
  validateDate("nextAppointment"),
  handleValidation,
];

const updateDiagnosticValidators = [
  optionalText("title"),
  optionalText("description"),
  optionalText("symptoms"),
  optionalText("diagnosis"),
  optionalText("treatment"),
  optionalText("observations"),
  optionalText("prescriptions"),
  optionalText("physicalExam"),
  optionalText("vitalSigns"),
  validateDate("consultDate"),
  validateDate("nextAppointment"),
  handleValidation,
];

const updateDiagnosticStateValidators = [
  body("state")
    .exists()
    .isIn(["ACTIVE", "ARCHIVED", "DELETED"])
    .withMessage("Estado inválido. Debe ser ACTIVE, ARCHIVED o DELETED"),
  handleValidation,
];

const createMedicalHistoryValidators = [handleValidation];

const updateMedicalHistoryValidators = [handleValidation];

const createPrescriptionValidation = [
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isUUID()
    .withMessage("Patient ID must be a valid UUID"),

  body("diagnosticId")
    .optional()
    .isUUID()
    .withMessage("Diagnostic ID must be a valid UUID"),

  body("medications")
    .isArray({ min: 1 })
    .withMessage("At least one medication is required"),

  body("medications.*.medicationName")
    .notEmpty()
    .withMessage("Medication name is required")
    .trim()
    .escape(),

  body("medications.*.activeIngredient")
    .notEmpty()
    .withMessage("Active ingredient is required")
    .trim()
    .escape(),

  body("medications.*.dosage")
    .notEmpty()
    .withMessage("Dosage is required")
    .trim()
    .escape(),

  body("medications.*.frequency")
    .notEmpty()
    .withMessage("Frequency is required")
    .trim()
    .escape(),

  body("medications.*.duration")
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),

  body("medications.*.durationType")
    .notEmpty()
    .withMessage("Duration type is required")
    .isIn(["días", "semanas", "meses", "days", "weeks", "months"])
    .withMessage(
      "Duration type must be días, semanas, meses, days, weeks, or months",
    ),

  body("medications.*.instructions")
    .optional()
    .isString()
    .withMessage("Instructions must be a string")
    .trim(),

  body("medications.*.warnings")
    .optional()
    .isString()
    .withMessage("Warnings must be a string")
    .trim(),

  body("medications.*.medicationType")
    .optional()
    .isString()
    .withMessage("Medication type must be a string")
    .trim()
    .escape(),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .trim(),

  body("allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array"),

  body("allergies.*")
    .isString()
    .withMessage("Each allergy must be a string")
    .trim()
    .escape(),

  handleValidation,
];

const patientIdValidation = [
  param("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isUUID()
    .withMessage("Patient ID must be a valid UUID"),

  handleValidation,
];

const prescriptionIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Prescription ID is required")
    .isUUID()
    .withMessage("Prescription ID must be a valid UUID"),

  handleValidation,
];

const updateStatusValidation = [
  param("id")
    .notEmpty()
    .withMessage("Prescription ID is required")
    .isUUID()
    .withMessage("Prescription ID must be a valid UUID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "COMPLETED", "CANCELLED"])
    .withMessage("Status must be ACTIVE, COMPLETED, or CANCELLED"),

  handleValidation,
];

const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidation,
];

module.exports = {
  createPatientValidators,
  updatePatientValidators,
  advancedSearchQueryValidators,
  createDiagnosticValidators,
  updateDiagnosticValidators,
  updateDiagnosticStateValidators,
  createMedicalHistoryValidators,
  updateMedicalHistoryValidators,
  createPrescriptionValidation,
  patientIdValidation,
  prescriptionIdValidation,
  updateStatusValidation,
  paginationValidation,
};
