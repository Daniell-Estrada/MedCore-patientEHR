const mockPrismaInstance = {
  Patient: {
    findUnique: jest.fn(),
  },
  Diagnostic: {
    findFirst: jest.fn(),
  },
  DiagnosticDocument: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
  },
  DocumentVersion: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../config/db/postgresql", () => mockPrismaInstance);

jest.mock("../services/storageService");

const mockFsPromises = {
  readFile: jest.fn(),
  unlink: jest.fn(),
};

jest.mock("fs", () => ({
  promises: mockFsPromises,
}));

const documentRepository = require("../repositories/documentRepository");
const storageService = require("../services/storageService");

const prisma = mockPrismaInstance;

/**
 * Test suite for documentRepository
 * includes tests for uploading documents with version tracking,
 * creating new document versions, and deleting documents.
 */
describe("DocumentRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.Patient.findUnique.mockReset();
    prisma.Diagnostic.findFirst.mockReset();
    prisma.DiagnosticDocument.findUnique.mockReset();
    prisma.DiagnosticDocument.findMany.mockReset();
    prisma.DiagnosticDocument.createMany.mockReset();
    prisma.DiagnosticDocument.delete.mockReset();
    prisma.DocumentVersion.create.mockReset();
    prisma.DocumentVersion.findMany.mockReset();
    prisma.DocumentVersion.findFirst.mockReset();
    prisma.DocumentVersion.createMany.mockReset();
    prisma.$transaction.mockReset();

    storageService.upload.mockReset();
    storageService.remove.mockReset();
    mockFsPromises.readFile.mockReset();
    mockFsPromises.unlink.mockReset();

    process.env.VERCEL = "false";
  });

  describe("uploadDocuments", () => {
    test("uploads documents successfully with version tracking", async () => {
      const mockPatient = { id: "patient-1" };
      const mockDiagnostic = { id: "diag-1" };
      const mockFiles = [
        {
          originalname: "test.pdf",
          buffer: Buffer.from("test content"),
          mimetype: "application/pdf",
          size: 1024,
        },
      ];

      const mockUploadResult = {
        url: "https://storage.test/file.pdf",
        storedKey: "stored-file.pdf",
        filePath: "https://storage.test/file.pdf",
      };

      const mockCreatedDocs = [
        {
          id: "doc-1",
          diagnosticId: "diag-1",
          filename: "test.pdf",
          storedFilename: "stored-file.pdf",
          filePath: "https://storage.test/file.pdf",
          fileType: "pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          currentVersion: 1,
          createdAt: new Date(),
        },
      ];

      prisma.Patient.findUnique.mockResolvedValue(mockPatient);
      prisma.Diagnostic.findFirst.mockResolvedValue(mockDiagnostic);
      storageService.upload.mockResolvedValue(mockUploadResult);

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          DiagnosticDocument: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            findMany: jest.fn().mockResolvedValue(mockCreatedDocs),
          },
          DocumentVersion: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      prisma.DiagnosticDocument.findMany.mockResolvedValue(mockCreatedDocs);

      const result = await documentRepository.uploadDocuments({
        patientId: "patient-1",
        diagnosticId: "diag-1",
        files: mockFiles,
        uploadedBy: "doctor-1",
      });

      expect(storageService.upload).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    test("throws error when patient not found", async () => {
      prisma.Patient.findUnique.mockResolvedValue(null);
      mockFsPromises.unlink.mockResolvedValue(undefined);

      await expect(
        documentRepository.uploadDocuments({
          patientId: "non-existent",
          diagnosticId: "diag-1",
          files: [],
          uploadedBy: "doctor-1",
        }),
      ).rejects.toThrow("Paciente no encontrado");
    });
  });

  describe("createDocumentVersion", () => {
    test("creates new version and increments version number", async () => {
      const mockDocument = {
        id: "doc-1",
        diagnosticId: "diag-1",
        filename: "old-file.pdf",
        storedFilename: "old-stored.pdf",
        filePath: "/path/to/old-file.pdf",
        currentVersion: 1,
        fileType: "pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      };

      const mockFile = {
        originalname: "new-file.pdf",
        buffer: Buffer.from("new content"),
        mimetype: "application/pdf",
        size: 2048,
      };

      const mockUploadResult = {
        url: "https://storage.test/new-file.pdf",
        storedKey: "new-stored.pdf",
        filePath: "https://storage.test/new-file.pdf",
      };

      const mockNewVersion = {
        id: "ver-2",
        documentId: "doc-1",
        version: 2,
        filename: "new-file.pdf",
        storedFilename: "new-stored.pdf",
        filePath: "https://storage.test/new-file.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
        fileSize: 2048,
        uploadedBy: "doctor-1",
        reason: "Updated report",
        createdAt: new Date(),
      };

      prisma.DiagnosticDocument.findUnique.mockResolvedValue(mockDocument);
      storageService.upload.mockResolvedValue(mockUploadResult);

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          DocumentVersion: {
            create: jest.fn().mockResolvedValue(mockNewVersion),
          },
          DiagnosticDocument: {
            update: jest
              .fn()
              .mockResolvedValue({ ...mockDocument, currentVersion: 2 }),
            findUnique: jest
              .fn()
              .mockResolvedValue({ ...mockDocument, currentVersion: 2 }),
          },
        });
      });

      const result = await documentRepository.createDocumentVersion({
        documentId: "doc-1",
        file: mockFile,
        uploadedBy: "doctor-1",
        reason: "Updated report",
      });

      expect(storageService.upload).toHaveBeenCalled();
      expect(result.version).toBe(2);
    });

    test("throws 404 when document not found", async () => {
      prisma.DiagnosticDocument.findUnique.mockResolvedValue(null);
      mockFsPromises.unlink.mockResolvedValue(undefined);

      await expect(
        documentRepository.createDocumentVersion({
          documentId: "non-existent",
          file: {},
          uploadedBy: "doctor-1",
        }),
      ).rejects.toMatchObject({
        message: "Documento no encontrado",
        status: 404,
      });
    });
  });

  describe("deleteDocument", () => {
    test("deletes document and removes from storage", async () => {
      const mockDocument = {
        id: "doc-1",
        storedFilename: "stored-file.pdf",
        filePath: "/path/to/file.pdf",
      };

      prisma.DiagnosticDocument.findUnique.mockResolvedValue(mockDocument);
      prisma.DiagnosticDocument.delete.mockResolvedValue(mockDocument);
      storageService.remove.mockResolvedValue(true);

      const result = await documentRepository.deleteDocument("doc-1");

      expect(result).toBe(true);
      expect(storageService.remove).toHaveBeenCalled();
      expect(prisma.DiagnosticDocument.delete).toHaveBeenCalledWith({
        where: { id: "doc-1" },
      });
    });
  });
});
