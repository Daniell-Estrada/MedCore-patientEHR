const mockPrismaInstance = {
  Patient: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  Diagnostic: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock("../config/db/postgresql", () => mockPrismaInstance);

jest.mock("../services/securityService");
jest.mock("../services/cacheService");

const patientRepository = require("../repositories/patientRepository");
const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

const prisma = mockPrismaInstance;

/**
 * Test suite for patientRepository
 * includes tests for retrieving patients,
 * creating new patient records, and handling error scenarios.
 */
describe("PatientRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.Patient.findUnique.mockReset();
    prisma.Patient.findMany.mockReset();
    prisma.Patient.findFirst.mockReset();
    prisma.Patient.create.mockReset();
    prisma.Patient.upsert.mockReset();
    prisma.Diagnostic.findMany.mockReset();
    prisma.Diagnostic.count.mockReset();

    securityService.getAllPatients.mockReset();
    securityService.getUserById.mockReset();
    securityService.createPatient.mockReset();
    securityService.updatePatient.mockReset();
    securityService.updatePatientState.mockReset();

    cacheService.getUserById.mockReset();
    cacheService.setUserById.mockReset();
    cacheService.setUserRole.mockReset();
    cacheService.getPatientPage.mockReset();
    cacheService.setPatientPage.mockReset();
    cacheService.getMultipleUsers.mockReset();
  });

  describe("getAllPatients", () => {
    test("returns paginated patients successfully", async () => {
      const mockSecurityData = {
        total: 2,
        data: [
          {
            id: "patient-1",
            email: "patient1@test.com",
            fullname: "Patient One",
            role: "PACIENTE",
          },
          {
            id: "patient-2",
            email: "patient2@test.com",
            fullname: "Patient Two",
            role: "PACIENTE",
          },
        ],
      };

      const mockEHRData = [
        { id: "patient-1", createdAt: new Date(), updatedAt: new Date() },
        { id: "patient-2", createdAt: new Date(), updatedAt: new Date() },
      ];

      cacheService.getPatientPage.mockReturnValue(null);
      securityService.getAllPatients.mockResolvedValue(mockSecurityData);
      prisma.Patient.findMany.mockResolvedValue(mockEHRData);

      const result = await patientRepository.getAllPatients(1, 10);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty("email");
      expect(result.data[0]).toHaveProperty("createdAt");
      expect(securityService.getAllPatients).toHaveBeenCalledWith(1, 10);
    });

    test("handles empty patient list", async () => {
      const mockSecurityData = { total: 0, data: [] };

      cacheService.getPatientPage.mockReturnValue(null);
      securityService.getAllPatients.mockResolvedValue(mockSecurityData);
      prisma.Patient.findMany.mockResolvedValue([]);

      const result = await patientRepository.getAllPatients(1, 10);

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
      expect(result.pages).toBe(0);
    });
  });

  describe("getPatientById", () => {
    test("returns patient with combined data successfully", async () => {
      const mockSecurityPatient = {
        id: "patient-1",
        email: "patient@test.com",
        fullname: "Test Patient",
        role: "PACIENTE",
      };

      const mockEHRPatient = {
        id: "patient-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      securityService.getUserById.mockResolvedValue(mockSecurityPatient);
      prisma.Patient.findFirst.mockResolvedValue(mockEHRPatient);

      const result = await patientRepository.getPatientById("patient-1");

      expect(result).toHaveProperty("email", "patient@test.com");
      expect(result).toHaveProperty("fullname", "Test Patient");
      expect(result).toHaveProperty("createdAt");
      expect(securityService.getUserById).toHaveBeenCalledWith("patient-1");
    });

    test("throws 404 when patient not found in security service", async () => {
      securityService.getUserById.mockResolvedValue(null);

      await expect(
        patientRepository.getPatientById("non-existent"),
      ).rejects.toMatchObject({
        message: "Paciente no encontrado",
        status: 404,
      });
    });
  });

  describe("createPatient", () => {
    test("creates patient with userId successfully", async () => {
      const mockUser = {
        id: "user-1",
        email: "patient@test.com",
        fullname: "New Patient",
        role: "PACIENTE",
      };

      const mockEHRPatient = {
        id: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      securityService.getUserById.mockResolvedValue(mockUser);
      prisma.Patient.findUnique.mockResolvedValue(null);
      prisma.Patient.create.mockResolvedValue(mockEHRPatient);

      const result = await patientRepository.createPatient({
        userId: "user-1",
      });

      expect(result).toHaveProperty("email", "patient@test.com");
      expect(result).toHaveProperty("createdAt");
      expect(prisma.Patient.create).toHaveBeenCalledWith({
        data: { id: "user-1" },
      });
    });

    test("creates patient and user when userId not provided", async () => {
      const patientData = {
        email: "newpatient@test.com",
        fullname: "Brand New Patient",
        identificacion: "123456789",
        phone: "1234567890",
        date_of_birth: "1990-01-01",
      };

      const mockCreatedUser = {
        id: "new-user-1",
        ...patientData,
        role: "PACIENTE",
      };

      const mockEHRPatient = {
        id: "new-user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      securityService.createPatient.mockResolvedValue(mockCreatedUser);
      prisma.Patient.findUnique.mockResolvedValue(null);
      prisma.Patient.create.mockResolvedValue(mockEHRPatient);

      const result = await patientRepository.createPatient(patientData);

      expect(result).toHaveProperty("email", "newpatient@test.com");
      expect(securityService.createPatient).toHaveBeenCalled();
      expect(prisma.Patient.create).toHaveBeenCalled();
    });
  });
});
