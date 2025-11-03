const mockPrismaInstance = {
  Patient: {
    findUnique: jest.fn(),
  },
  medicalHistory: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  Diagnostic: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  DiagnosticDocument: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../config/db/postgresql", () => mockPrismaInstance);

jest.mock("../services/securityService");
jest.mock("../services/storageService");

const mockFsPromises = {
  readFile: jest.fn(),
  unlink: jest.fn(),
};

jest.mock("fs", () => ({
  promises: mockFsPromises,
}));

const diagnosticRepository = require("../repositories/diagnosticRepository");
const securityService = require("../services/securityService");
const storageService = require("../services/storageService");

const prisma = mockPrismaInstance;

/**
 * Test suite for diagnosticRepository
 * this includes tests for creating diagnostics with and without files,
 * handling medical history creation, and error scenarios.
 */
describe("DiagnosticRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.Patient.findUnique.mockReset();
    prisma.medicalHistory.findUnique.mockReset();
    prisma.medicalHistory.create.mockReset();
    prisma.Diagnostic.create.mockReset();
    prisma.Diagnostic.findUnique.mockReset();
    prisma.DiagnosticDocument.createMany.mockReset();
    prisma.$transaction.mockReset();

    securityService.getUserById.mockReset();
    storageService.upload.mockReset();
    mockFsPromises.readFile.mockReset();
    mockFsPromises.unlink.mockReset();

    process.env.VERCEL = "false";
  });

  describe("createDiagnostic", () => {
    test("creates diagnostic without files successfully", async () => {
      const mockPatient = {
        id: "patient-1",
        state: "ACTIVE",
      };

      const mockDoctor = {
        id: "doctor-1",
        email: "doctor@test.com",
        role: "MEDICO",
        fullname: "Dr. Test",
      };

      const mockMedicalHistory = {
        id: "mh-1",
        patientId: "patient-1",
        createdBy: "doctor-1",
      };

      const mockDiagnostic = {
        id: "diag-1",
        medicalHistoryId: "mh-1",
        doctorId: "doctor-1",
        title: "Consulta general",
        description: "Chequeo de rutina",
        symptoms: "Ninguno",
        diagnosis: "Paciente sano",
        treatment: "Ninguno",
        consultDate: new Date(),
      };

      const diagnosticData = {
        title: "Consulta general",
        description: "Chequeo de rutina",
        symptoms: "Ninguno",
        diagnosis: "Paciente sano",
        treatment: "Ninguno",
      };

      prisma.Patient.findUnique.mockResolvedValue(mockPatient);
      securityService.getUserById.mockResolvedValue(mockDoctor);

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          medicalHistory: {
            findUnique: jest.fn().mockResolvedValue(mockMedicalHistory),
            create: jest.fn().mockResolvedValue(mockMedicalHistory),
          },
          Diagnostic: {
            create: jest.fn().mockResolvedValue(mockDiagnostic),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDiagnostic,
              documents: [],
              medicalHistory: {
                ...mockMedicalHistory,
                patient: mockPatient,
              },
            }),
          },
          DiagnosticDocument: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        });
      });

      const result = await diagnosticRepository.createDiagnostic(
        "patient-1",
        "doctor-1",
        diagnosticData,
        null,
      );

      expect(result).toHaveProperty("patient");
      expect(result).toHaveProperty("doctor");
      expect(result.doctor.id).toBe("doctor-1");
      expect(prisma.Patient.findUnique).toHaveBeenCalledWith({
        where: { id: "patient-1" },
      });
    });

    test("creates diagnostic with files successfully", async () => {
      const mockPatient = { id: "patient-1", state: "ACTIVE" };
      const mockDoctor = {
        id: "doctor-1",
        email: "doctor@test.com",
        role: "MEDICO",
        fullname: "Dr. Test",
      };
      const mockMedicalHistory = { id: "mh-1", patientId: "patient-1" };

      const mockFiles = [
        {
          originalname: "rayos-x.pdf",
          buffer: Buffer.from("file content"),
          mimetype: "application/pdf",
          size: 2048,
        },
      ];

      const mockDiagnostic = {
        id: "diag-1",
        medicalHistoryId: "mh-1",
        doctorId: "doctor-1",
        title: "Radiografía",
        description: "Examen de tórax",
        symptoms: "Dolor en pecho",
        diagnosis: "Normal",
        treatment: "Ninguno",
      };

      prisma.Patient.findUnique.mockResolvedValue(mockPatient);
      securityService.getUserById.mockResolvedValue(mockDoctor);
      storageService.upload.mockResolvedValue({
        url: "https://storage.test/file.pdf",
        storedKey: "stored-file.pdf",
        filePath: "https://storage.test/file.pdf",
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          medicalHistory: {
            findUnique: jest.fn().mockResolvedValue(mockMedicalHistory),
          },
          Diagnostic: {
            create: jest.fn().mockResolvedValue(mockDiagnostic),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDiagnostic,
              documents: [
                {
                  id: "doc-1",
                  diagnosticId: mockDiagnostic.id,
                  filename: "rayos-x.pdf",
                  storedFilename: "stored-file.pdf",
                  filePath: "https://storage.test/file.pdf",
                },
              ],
              medicalHistory: {
                ...mockMedicalHistory,
                patient: mockPatient,
              },
            }),
          },
          DiagnosticDocument: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      mockFsPromises.unlink.mockResolvedValue(undefined);

      const result = await diagnosticRepository.createDiagnostic(
        "patient-1",
        "doctor-1",
        {
          title: "Radiografía",
          description: "Examen de tórax",
          symptoms: "Dolor en pecho",
          diagnosis: "Normal",
          treatment: "Ninguno",
        },
        mockFiles,
      );

      expect(result).toHaveProperty("documents");
      expect(result.documents).toHaveLength(1);
      expect(storageService.upload).toHaveBeenCalled();
    });

    test("creates medical history if not exists", async () => {
      const mockPatient = { id: "patient-1", state: "ACTIVE" };
      const mockDoctor = {
        id: "doctor-1",
        email: "doctor@test.com",
        role: "MEDICO",
        fullname: "Dr. Test",
      };

      const mockNewMedicalHistory = {
        id: "new-mh-1",
        patientId: "patient-1",
        createdBy: "doctor-1",
      };

      const mockDiagnostic = {
        id: "diag-1",
        medicalHistoryId: "new-mh-1",
        doctorId: "doctor-1",
        title: "Primera consulta",
        description: "Consulta inicial",
        symptoms: "Varios",
        diagnosis: "A investigar",
        treatment: "Pendiente",
      };

      prisma.Patient.findUnique.mockResolvedValue(mockPatient);
      securityService.getUserById.mockResolvedValue(mockDoctor);

      const mockCreate = jest.fn().mockResolvedValue(mockNewMedicalHistory);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          medicalHistory: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: mockCreate,
          },
          Diagnostic: {
            create: jest.fn().mockResolvedValue(mockDiagnostic),
            findUnique: jest.fn().mockResolvedValue({
              ...mockDiagnostic,
              documents: [],
              medicalHistory: {
                ...mockNewMedicalHistory,
                patient: mockPatient,
              },
            }),
          },
          DiagnosticDocument: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        });
      });

      await diagnosticRepository.createDiagnostic(
        "patient-1",
        "doctor-1",
        {
          title: "Primera consulta",
          description: "Consulta inicial",
          symptoms: "Varios",
          diagnosis: "A investigar",
          treatment: "Pendiente",
        },
        null,
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          patientId: "patient-1",
          createdBy: "doctor-1",
        },
      });
    });

    test("throws error when patient not found", async () => {
      prisma.Patient.findUnique.mockResolvedValue(null);

      await expect(
        diagnosticRepository.createDiagnostic(
          "non-existent",
          "doctor-1",
          {
            title: "Test",
            description: "Test",
            symptoms: "Test",
            diagnosis: "Test",
            treatment: "Test",
          },
          null,
        ),
      ).rejects.toThrow("Patient not found");
    });

    test("throws error when patient is inactive", async () => {
      const mockInactivePatient = {
        id: "patient-1",
        state: "INACTIVE",
      };

      prisma.Patient.findUnique.mockResolvedValue(mockInactivePatient);

      await expect(
        diagnosticRepository.createDiagnostic(
          "patient-1",
          "doctor-1",
          {
            title: "Test",
            description: "Test",
            symptoms: "Test",
            diagnosis: "Test",
            treatment: "Test",
          },
          null,
        ),
      ).rejects.toThrow("Cannot add diagnostics to an inactive patient");
    });
  });
});
