const prisma = require("../config/db/postgresql");
const fs = require("fs").promises;
const DocumentRecordsBuilder = require("../utils/documentRecordsBuilder");
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
      where: {
        id: diagnosticId,
        medicalHistory: {
          patientId: patientId,
        },
      },
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
      const filename = DocumentRecordsBuilder.generateUniqueFilename({
        patientId,
        originalname: f.originalname,
      });

      const uploaded = await storageUpload({
        buffer,
        originalname: f.originalname,
        filename,
        mimetype: f.mimetype,
      });

      prepared.push({ f, uploaded });
    }

    const records = DocumentRecordsBuilder.buildDocumentRecords({
      diagnosticId: diagnostic.id,
      files,
      uploadedBy,
      uploadedFiles: prepared,
    });

    const docs = await prisma.$transaction(async (tx) => {
      await tx.DiagnosticDocument.createMany({ data: records });

      const created = await tx.DiagnosticDocument.findMany({
        where: {
          diagnosticId: diagnostic.id,
          storedFilename: { in: records.map((r) => r.storedFilename) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (created.length) {
        const versions = created.map((d) => ({
          documentId: d.id,
          version: 1,
          filename: d.filename,
          storedFilename: d.storedFilename,
          filePath: d.filePath,
          fileType: d.fileType,
          mimeType: d.mimeType,
          fileSize: d.fileSize,
          description: d.description || null,
          uploadedBy,
          reason: "initial",
        }));
        await tx.DocumentVersion.createMany({ data: versions });
      }

      return created;
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

  /**
   * Create a new version for an existing document, updating the current document fields
   */
  async createDocumentVersion({ documentId, file, uploadedBy, reason = null }) {
    const doc = await prisma.DiagnosticDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      const err = new Error("Documento no encontrado");
      err.status = 404;
      throw err;
    }

    const buffer = file.buffer ? file.buffer : await fs.readFile(file.path);
    const filename = DocumentRecordsBuilder.generateUniqueFilename({
      patientId: doc.diagnosticId,
      originalname: file.originalname,
    });
    const uploaded = await storageUpload({
      buffer,
      originalname: file.originalname,
      filename,
      mimetype: file.mimetype,
    });

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.DiagnosticDocument.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          currentVersion: true,
          filename: true,
          storedFilename: true,
          filePath: true,
          fileType: true,
          mimeType: true,
          fileSize: true,
          description: true,
        },
      });

      const nextVersion = (current.currentVersion || 1) + 1;
      const versionRecord = await tx.DocumentVersion.create({
        data: {
          documentId: documentId,
          version: nextVersion,
          filename: file.originalname,
          storedFilename: uploaded.storedKey || filename,
          filePath: uploaded.filePath,
          fileType: (file.originalname.split(".").pop() || "").toLowerCase(),
          mimeType: file.mimetype,
          fileSize: file.size,
          description: null,
          uploadedBy,
          reason,
        },
      });

      await tx.DiagnosticDocument.update({
        where: { id: documentId },
        data: {
          filename: versionRecord.filename,
          storedFilename: versionRecord.storedFilename,
          filePath: versionRecord.filePath,
          fileType: versionRecord.fileType,
          mimeType: versionRecord.mimeType,
          fileSize: versionRecord.fileSize,
          currentVersion: nextVersion,
        },
      });

      return versionRecord;
    });

    if (file.path && !MS_PATIENT_EHR_CONFIG.VERCEL) {
      try {
        await fs.unlink(file.path);
      } catch (_) {}
    }

    try {
      await storageRemove({
        storedKey: doc.storedFilename,
        filePath: doc.filePath,
      });
    } catch (_) {}

    return result;
  }

  async getDocumentVersions(documentId) {
    const exists = await prisma.DiagnosticDocument.findUnique({
      where: { id: documentId },
      select: { id: true },
    });
    if (!exists) {
      const err = new Error("Documento no encontrado");
      err.status = 404;
      throw err;
    }
    return prisma.DocumentVersion.findMany({
      where: { documentId },
      orderBy: { version: "desc" },
    });
  }

  async getDocumentVersion(documentId, version) {
    const v = await prisma.DocumentVersion.findFirst({
      where: { documentId, version },
    });
    if (!v) {
      const err = new Error("Versión no encontrada");
      err.status = 404;
      throw err;
    }
    return v;
  }

  async getDocumentById(id) {
    return prisma.DiagnosticDocument.findUnique({ where: { id } });
  }

  async getDocumentsByPatientId(patientId) {
    return prisma.DiagnosticDocument.findMany({
      where: {
        diagnostic: {
          medicalHistory: {
            patientId: patientId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        diagnostic: {
          select: {
            id: true,
            title: true,
            consultDate: true,
            doctorId: true,
          },
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
