const prisma = require("../config/db/postgresql");
const fs = require("fs").promises;
const path = require("path");
const {
  upload: storageUpload,
  remove: storageRemove,
} = require("../services/storageService");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");

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

    const prepared = [];
    for (const f of files) {
      const buffer = f.buffer ? f.buffer : await fs.readFile(f.path);
      const timestamp = Date.now();
      const randomString = Math.round(Math.random() * 1e9);
      const ext = path.extname(f.originalname);

      const filename = `diagnostic-${patientId}-${timestamp}-${randomString}${ext}`;

      const uploaded = await storageUpload({
        buffer,
        originalname: f.originalname,
        filename,
        mimetype: f.mimetype,
      });

      prepared.push({ f, uploaded });
    }

    const records = prepared.map(({ f, uploaded }) => ({
      diagnosticId: diagnostic.id,
      filename: f.originalname,
      storedFilename:
        uploaded.storedKey || f.filename || path.basename(uploaded.filePath),
      filePath: uploaded.filePath,
      fileType: (f.originalname.split(".").pop() || "").toLowerCase(),
      mimeType: f.mimetype,
      fileSize: f.size,
      description: null,
      uploadedBy,
    }));

    await prisma.DiagnosticDocument.createMany({ data: records });

    const docs = await prisma.DiagnosticDocument.findMany({
      where: {
        diagnosticId: diagnostic.id,
        storedFilename: { in: records.map((r) => r.storedFilename) },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const f of files) {
      if (f.path && !MS_PATIENT_EHR_CONFIG.VERCEL) {
        try {
          await fs.unlink(f.path);
        } catch (_) {}
      }
    }
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

    await storageRemove({
      storedKey: doc.storedFilename,
      filePath: doc.filePath,
    });
    return true;
  }

  async #cleanupFiles(files) {
    if (!files?.length) return;
    for (const f of files) {
      try {
        if (f.path) await fs.unlink(f.path);
      } catch (_) {}
    }
  }
}

module.exports = new DocumentRepository();
