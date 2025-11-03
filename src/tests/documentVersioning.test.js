const mockDocumentRepository = {
  createDocumentVersion: jest.fn(
    async ({ documentId, file, uploadedBy, reason }) => ({
      id: "ver-1",
      documentId,
      version: 2,
      filename: file.originalname,
      storedFilename: `stored-${file.originalname}`,
      filePath: "/tmp/stored/file",
      fileType: "pdf",
      mimeType: file.mimetype,
      fileSize: file.size || 3,
      description: null,
      uploadedBy,
      reason: reason || null,
      createdAt: new Date().toISOString(),
    }),
  ),
};

jest.mock("../repositories/documentRepository", () => mockDocumentRepository);

const { createDocumentVersion } = require("../controllers/documentController");

/**
 * This test suite verifies the functionality of the Document Versioning API,
 * specifically the creation of new document versions.
 */
describe("Document Versioning API", () => {
  let req, res;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  });

  beforeEach(() => {
    req = {
      params: { id: "doc-123" },
      body: { reason: "Corrección de informe" },
      file: {
        originalname: "test.pdf",
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("PDF"),
      },
      user: { id: "user-1", role: "MEDICO" },
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };

    mockDocumentRepository.createDocumentVersion.mockClear();
  });

  it("should create a new version for an existing document", async () => {
    await createDocumentVersion(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 2,
        }),
      }),
    );
    expect(mockDocumentRepository.createDocumentVersion).toHaveBeenCalledWith({
      documentId: "doc-123",
      file: req.file,
      uploadedBy: "user-1",
      reason: "Corrección de informe",
    });
  });
});
