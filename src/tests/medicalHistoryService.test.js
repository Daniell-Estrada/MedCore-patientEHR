const mockPrismaInstance = {
  medicalHistory: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  diagnostic: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  DiagnosticDocument: {
    findMany: jest.fn(),
  },
};

jest.mock("../config/db/postgresql", () => mockPrismaInstance);

jest.mock("../services/securityService");
jest.mock("../services/cacheService");

const medicalHistoryRepository = require("../repositories/medicalHistoryRepository");
const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

const prisma = mockPrismaInstance;

/**
 * Test suite for medicalHistoryRepository
 * includes tests for retrieving medical histories,
 * creating new records, and handling error scenarios.
 */
describe("MedicalHistoryRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.medicalHistory.findUnique.mockReset();
    prisma.medicalHistory.create.mockReset();
    prisma.medicalHistory.update.mockReset();
    prisma.diagnostic.findMany.mockReset();
    prisma.diagnostic.count.mockReset();
    prisma.DiagnosticDocument.findMany.mockReset();

    securityService.getUserById.mockReset();
    cacheService.getUserById.mockReset();
  });

  describe("getMedicalHistoryById", () => {
    test("returns medical history with diagnostics successfully", async () => {
      const mockDoctor = {
        id: "doctor-1",
        email: "doctor@test.com",
        fullname: "Dr. Test",
        role: "MEDICO",
      };

      const mockMedicalHistory = {
        id: "mh-1",
        patientId: "patient-1",
        createdBy: "doctor-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        diagnostics: [
          {
            id: "diag-1",
            title: "Consulta general",
            description: "Chequeo rutinario",
            consultDate: new Date(),
            documents: [],
          },
        ],
      };

      prisma.medicalHistory.findUnique.mockResolvedValue(mockMedicalHistory);
      cacheService.getUserById.mockReturnValue(null);
      securityService.getUserById.mockResolvedValue(mockDoctor);

      const result =
        await medicalHistoryRepository.getMedicalHistoryById("mh-1");

      expect(result).toHaveProperty("id", "mh-1");
      expect(result).toHaveProperty("diagnostics");
      expect(result.diagnostics).toHaveLength(1);
      expect(result.doctor).toMatchObject({
        id: "doctor-1",
        fullname: "Dr. Test",
        email: "doctor@test.com",
      });
      expect(securityService.getUserById).toHaveBeenCalledWith("doctor-1");
    });

    test("throws 404 when medical history not found", async () => {
      prisma.medicalHistory.findUnique.mockResolvedValue(null);

      await expect(
        medicalHistoryRepository.getMedicalHistoryById("non-existent"),
      ).rejects.toMatchObject({
        message: "Medical history record not found",
        status: 404,
      });
    });
  });

  describe("getPatientMedicalHistory", () => {
    test("returns paginated medical history successfully", async () => {
      const mockMedicalHistory = {
        id: "mh-1",
        patientId: "patient-1",
        createdBy: "doctor-1",
        diagnostics: [
          {
            id: "diag-1",
            title: "Consulta 1",
            consultDate: new Date("2024-01-15"),
            documents: [],
          },
          {
            id: "diag-2",
            title: "Consulta 2",
            consultDate: new Date("2024-02-20"),
            documents: [],
          },
        ],
      };

      const mockDoctor = {
        id: "doctor-1",
        fullname: "Dr. Test",
        email: "doctor@test.com",
      };

      prisma.medicalHistory.findUnique.mockResolvedValue(mockMedicalHistory);
      prisma.diagnostic.count.mockResolvedValue(10);
      cacheService.getUserById.mockReturnValue(mockDoctor);

      const result = await medicalHistoryRepository.getPatientMedicalHistory(
        "patient-1",
        { page: 1, limit: 2 },
      );

      expect(result).toHaveProperty("diagnostics");
      expect(result.diagnostics).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
      });
      expect(result.doctor).toHaveProperty("fullname", "Dr. Test");
    });

    test("returns null when patient has no medical history", async () => {
      prisma.medicalHistory.findUnique.mockResolvedValue(null);

      const result = await medicalHistoryRepository.getPatientMedicalHistory(
        "patient-without-history",
        { page: 1, limit: 10 },
      );

      expect(result).toBeNull();
    });
  });

  describe("createMedicalHistory", () => {
    test("creates new medical history successfully", async () => {
      const mockNewHistory = {
        id: "new-mh-1",
        patientId: "patient-1",
        createdBy: "doctor-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.medicalHistory.findUnique.mockResolvedValue(null);
      prisma.medicalHistory.create.mockResolvedValue(mockNewHistory);

      const result = await medicalHistoryRepository.createMedicalHistory(
        "patient-1",
        "doctor-1",
      );

      expect(result).toMatchObject({
        id: "new-mh-1",
        patientId: "patient-1",
        createdBy: "doctor-1",
      });
      expect(prisma.medicalHistory.create).toHaveBeenCalledWith({
        data: {
          patientId: "patient-1",
          createdBy: "doctor-1",
        },
      });
    });

    test("returns existing medical history when already exists", async () => {
      const mockExistingHistory = {
        id: "existing-mh-1",
        patientId: "patient-1",
        createdBy: "doctor-original",
        createdAt: new Date("2024-01-01"),
      };

      prisma.medicalHistory.findUnique.mockResolvedValue(mockExistingHistory);

      const result = await medicalHistoryRepository.createMedicalHistory(
        "patient-1",
        "doctor-2",
      );

      expect(result).toMatchObject(mockExistingHistory);
      expect(prisma.medicalHistory.create).not.toHaveBeenCalled();
    });
  });
});
