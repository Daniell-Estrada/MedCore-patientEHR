const prisma = require("../config/db/postgresql");
const cacheService = require("../services/cacheService");

/**
 * Repository for managing diagnostics.
 */
class DiagnosticRepository {
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
}

module.exports = new DiagnosticRepository();
