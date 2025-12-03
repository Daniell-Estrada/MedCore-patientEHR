const prisma = require("../config/db/postgresql");
const cacheService = require("../services/cacheService");
const securityService = require("../services/securityService");

/**
 * Repository for managing diagnostics.
 */
class DiagnosticRepository {
  /**
   * Create a new diagnostic for a patient.
   * Automatically creates the medical history if it doesn't exist.
   * @param {string} patientId - The patient's ID
   * @param {string} doctorId - The doctor's ID (from JWT)
   * @param {object} diagnosticData - The diagnostic data
   * @returns {object} The created diagnostic with related data
   */
  async createDiagnostic(patientId, doctorId, diagnosticData) {
    // Verify patient exists
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      const error = new Error("Paciente no encontrado");
      error.status = 404;
      throw error;
    }

    // Get or create medical history
    let medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId },
    });

    if (!medicalHistory) {
      medicalHistory = await prisma.medicalHistory.create({
        data: {
          patientId,
          createdBy: doctorId,
        },
      });
    }

    // Create the diagnostic
    const diagnostic = await prisma.Diagnostic.create({
      data: {
        medicalHistoryId: medicalHistory.id,
        doctorId,
        title: diagnosticData.title,
        description: diagnosticData.description,
        symptoms: diagnosticData.symptoms,
        diagnosis: diagnosticData.diagnosis,
        treatment: diagnosticData.treatment,
        observations: diagnosticData.observations || null,
        prescriptions: diagnosticData.prescriptions || null,
        physicalExam: diagnosticData.physicalExam || null,
        vitalSigns: diagnosticData.vitalSigns || null,
        consultDate: diagnosticData.consultDate
          ? new Date(diagnosticData.consultDate)
          : new Date(),
        nextAppointment: diagnosticData.nextAppointment
          ? new Date(diagnosticData.nextAppointment)
          : null,
        customFields: diagnosticData.customFields || null,
      },
    });

    // Get doctor info for response
    let doctor = cacheService.getUserById(doctorId);
    if (!doctor) {
      try {
        doctor = await securityService.getUserById(doctorId);
        if (doctor) {
          cacheService.setUserById(doctorId, doctor);
        }
      } catch (_) {
        doctor = null;
      }
    }

    // Invalidate related caches
    cacheService.invalidateAllPatientDiagnostics(patientId);
    cacheService.invalidatePatientMedicalHistory(patientId);
    cacheService.invalidatePatientTimeline(patientId);
    cacheService.invalidateAllMedicalHistoriesPages();

    return {
      ...diagnostic,
      patient: {
        id: patient.id,
      },
      doctor: doctor
        ? {
            id: doctor.id,
            fullname: doctor.fullname,
            email: doctor.email,
          }
        : { id: doctorId },
      medicalHistory: {
        id: medicalHistory.id,
      },
    };
  }

  async getDiagnosticById(id) {
    const cached = cacheService.getDiagnosticById(id);
    if (cached) return cached;

    const diagnostic = await prisma.Diagnostic.findUnique({
      where: { id, state: { not: "DELETED" } },
    });

    if (!diagnostic) {
      const error = new Error("Diagnóstico no encontrado");
      error.status = 404;
      throw error;
    }

    cacheService.setDiagnosticById(id, diagnostic);
    return diagnostic;
  }

  async listDiagnosticsByPatient(
    patientId,
    { page = 1, limit = 20, state, dateFrom, dateTo } = {},
  ) {
    const cached = cacheService.getPatientDiagnosticsPage(patientId, {
      page,
      limit,
      state: state || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
    if (cached) return cached;

    const mh = await prisma.medicalHistory.findUnique({
      where: { patientId },
      select: { id: true },
    });

    if (!mh) {
      const error = new Error("Historial médico no encontrado");
      error.status = 404;
      throw error;
    }

    const where = { medicalHistoryId: mh.id };
    if (state) {
      where.state = state;
    }
    if (dateFrom || dateTo) {
      where.consultDate = {};
      if (dateFrom) where.consultDate.gte = new Date(dateFrom);
      if (dateTo) where.consultDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      prisma.Diagnostic.count({ where }),
      prisma.Diagnostic.findMany({
        where,
        orderBy: { consultDate: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const payload = {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      data: rows,
    };
    cacheService.setPatientDiagnosticsPage(
      patientId,
      {
        page,
        limit,
        state: state || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
      payload,
    );
    return payload;
  }

  async getPredefinedDiagnostics({ category, severity } = {}) {
    const where = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;

    const diagnostics = await prisma.PredefinedDiagnostic.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return diagnostics;
  }

  /**
   * Update the state of a diagnostic (soft delete/archive).
   * @param {string} id - The diagnostic ID
   * @param {string} state - The new state (ACTIVE, ARCHIVED, DELETED)
   * @returns {object} The updated diagnostic
   */
  async updateDiagnosticState(id, state) {
    // Verify diagnostic exists
    const existing = await prisma.Diagnostic.findUnique({
      where: { id },
      include: {
        medicalHistory: {
          select: { patientId: true },
        },
      },
    });

    if (!existing) {
      const error = new Error("Diagnóstico no encontrado");
      error.status = 404;
      throw error;
    }

    // Update the state
    const diagnostic = await prisma.Diagnostic.update({
      where: { id },
      data: {
        state,
        updatedAt: new Date(),
      },
    });

    // Invalidate caches
    const patientId = existing.medicalHistory?.patientId;
    cacheService.invalidateDiagnostic(id);
    if (patientId) {
      cacheService.invalidateAllPatientDiagnostics(patientId);
      cacheService.invalidatePatientMedicalHistory(patientId);
      cacheService.invalidatePatientTimeline(patientId);
    }
    cacheService.invalidateAllMedicalHistoriesPages();

    return diagnostic;
  }
}

module.exports = new DiagnosticRepository();
