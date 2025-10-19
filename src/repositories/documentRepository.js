const prisma = require("../config/db/postgresql");
const fs = require("fs").promises;

/**
 * Repository for managing diagnostic documents.
 */
class DocumentRepository {
  async uploadDocuments({ patientId, diagnosticId, files, uploadedBy }) {
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      await this.#cleanupFiles(files);
      throw new Error("Paciente no encontrado");
    }

    const diagnostic = await prisma.Diagnostic.findFirst({
      where: { id: diagnosticId, patientId },
      select: { id: true },
    });

    if (!diagnostic) {
      await this.#cleanupFiles(files);
      throw new Error(
        "La consulta/diagnóstico no existe o no pertenece al paciente",
      );
    }

    if (!files || files.length === 0) {
      throw new Error("Se requiere al menos un archivo");
    }

    const records = files.map((file) => ({
      diagnosticId: diagnostic.id,
      filename: file.originalname,
      storedFilename: file.filename,
      filePath: file.path,
      fileType: (file.originalname.split(".").pop() || "").toLowerCase(),
      mimeType: file.mimetype,
      fileSize: file.size,
      description: null,
      uploadedBy,
    }));

    await prisma.DiagnosticDocument.createMany({
      data: records,
    });

    const docs = await prisma.DiagnosticDocument.findMany({
      where: {
        diagnosticId: diagnostic.id,
        storedFilename: { in: files.map((f) => f.filename) },
      },
      orderBy: { createdAt: "desc" },
    });
    return docs;
  }

  async getDocumentById(id) {
    return prisma.DiagnosticDocument.findUnique({ where: { id } });
  }

  async getDocumentsByPatientId(patientId) {
    return prisma.DiagnosticDocument.findMany({
      where: { diagnostic: { patientId } },
      orderBy: { createdAt: "desc" },
      include: {
        diagnostic: {
          select: { id: true, title: true, date: true, doctorId: true },
        },
      },
    });
  }

  async deleteDocument(id) {
    const doc = await prisma.DiagnosticDocument.findUnique({ where: { id } });
    if (!doc) return false;
    await prisma.DiagnosticDocument.delete({ where: { id } });
    try {
      await fs.unlink(doc.filePath);
    } catch (_) {}
    return true;
  }

  async #cleanupFiles(files) {
    if (!files?.length) return;
    for (const f of files) {
      try {
        await fs.unlink(f.path);
      } catch (_) {}
    }
  }
}

module.exports = new DocumentRepository();
