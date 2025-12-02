const mockPrismaInstance = {
  Patient: {
    findUnique: jest.fn(),
  },
  Prescription: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../config/db/postgresql", () => mockPrismaInstance);
jest.mock("../services/cacheService");

const prescriptionRepository = require("../repositories/prescriptionRepository");
const prisma = mockPrismaInstance;

describe("PrescriptionRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPrescription", () => {
    it("should create a prescription with allergy check", async () => {
      const patientId = "patient-123";
      const doctorId = "doctor-456";
      const prescriptionData = {
        medicationName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        duration: 7,
        instructions: "Take with food",
        medicationType: "Antibiotic",
      };

      // Mock patient with no allergies
      prisma.Patient.findUnique.mockResolvedValue({
        id: patientId,
        allergies: null,
      });

      // Mock prescription creation
      const mockPrescription = {
        id: "prescription-789",
        patientId,
        doctorId,
        medicationName: prescriptionData.medicationName,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: prescriptionData.duration,
        instructions: prescriptionData.instructions,
        medicationType: prescriptionData.medicationType,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        notes: null,
        allergyChecked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.Prescription.create.mockResolvedValue(mockPrescription);

      const result = await prescriptionRepository.createPrescription(
        patientId,
        doctorId,
        prescriptionData
      );

      expect(result.prescription).toBeDefined();
      expect(result.prescription.medicationName).toBe("Amoxicillin");
      expect(result.allergyWarning).toBeNull();
      expect(prisma.Patient.findUnique).toHaveBeenCalledWith({
        where: { id: patientId },
        select: { id: true, allergies: true },
      });
      expect(prisma.Prescription.create).toHaveBeenCalled();
    });

    it("should detect allergy and add warning to prescription", async () => {
      const patientId = "patient-123";
      const doctorId = "doctor-456";
      const prescriptionData = {
        medicationName: "Penicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        duration: 7,
      };

      // Mock patient with penicillin allergy
      prisma.Patient.findUnique.mockResolvedValue({
        id: patientId,
        allergies: JSON.stringify(["Penicillin", "Aspirin"]),
      });

      const mockPrescription = {
        id: "prescription-789",
        patientId,
        doctorId,
        medicationName: prescriptionData.medicationName,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: prescriptionData.duration,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        notes: expect.stringContaining("ADVERTENCIA"),
        allergyChecked: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.Prescription.create.mockResolvedValue(mockPrescription);

      const result = await prescriptionRepository.createPrescription(
        patientId,
        doctorId,
        prescriptionData
      );

      expect(result.allergyWarning).toContain("ADVERTENCIA");
      expect(result.allergyWarning).toContain("Penicillin");
      expect(result.prescription.allergyChecked).toBe(true);
    });

    it("should throw error if patient not found", async () => {
      prisma.Patient.findUnique.mockResolvedValue(null);

      await expect(
        prescriptionRepository.createPrescription(
          "invalid-id",
          "doctor-456",
          {}
        )
      ).rejects.toThrow("Paciente no encontrado");
    });

    it("should calculate duration based on medication type", async () => {
      const patientId = "patient-123";
      const doctorId = "doctor-456";
      const prescriptionData = {
        medicationName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        medicationType: "Antibiotic",
        // No duration provided
      };

      prisma.Patient.findUnique.mockResolvedValue({
        id: patientId,
        allergies: null,
      });

      const mockPrescription = {
        id: "prescription-789",
        patientId,
        doctorId,
        medicationName: prescriptionData.medicationName,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: 7, // Should be calculated from antibiotic type
        medicationType: prescriptionData.medicationType,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        allergyChecked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.Prescription.create.mockResolvedValue(mockPrescription);

      const result = await prescriptionRepository.createPrescription(
        patientId,
        doctorId,
        prescriptionData
      );

      // Check that duration was calculated
      const createCall = prisma.Prescription.create.mock.calls[0][0];
      expect(createCall.data.duration).toBe(7); // Antibiotics default to 7 days
    });
  });

  describe("getPrescriptionsByPatient", () => {
    it("should return paginated prescriptions for a patient", async () => {
      const patientId = "patient-123";

      prisma.Patient.findUnique.mockResolvedValue({ id: patientId });

      const mockPrescriptions = [
        {
          id: "prescription-1",
          patientId,
          medicationName: "Medication A",
          dosage: "100mg",
          frequency: "Once daily",
          createdAt: new Date(),
        },
        {
          id: "prescription-2",
          patientId,
          medicationName: "Medication B",
          dosage: "200mg",
          frequency: "Twice daily",
          createdAt: new Date(),
        },
      ];

      prisma.Prescription.findMany.mockResolvedValue(mockPrescriptions);
      prisma.Prescription.count.mockResolvedValue(2);

      const result = await prescriptionRepository.getPrescriptionsByPatient(
        patientId,
        { page: 1, limit: 20 }
      );

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(prisma.Prescription.findMany).toHaveBeenCalledWith({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      });
    });

    it("should throw error if patient not found", async () => {
      prisma.Patient.findUnique.mockResolvedValue(null);

      await expect(
        prescriptionRepository.getPrescriptionsByPatient("invalid-id")
      ).rejects.toThrow("Paciente no encontrado");
    });
  });

  describe("calculateDurationByMedicationType", () => {
    it("should return correct duration for antibiotics", () => {
      const duration =
        prescriptionRepository.calculateDurationByMedicationType("Antibiotic");
      expect(duration).toBe(7);
    });

    it("should return correct duration for analgesics", () => {
      const duration =
        prescriptionRepository.calculateDurationByMedicationType("Analgesic");
      expect(duration).toBe(3);
    });

    it("should return correct duration for vitamins", () => {
      const duration =
        prescriptionRepository.calculateDurationByMedicationType("Vitamin");
      expect(duration).toBe(30);
    });

    it("should return default duration for unknown type", () => {
      const duration =
        prescriptionRepository.calculateDurationByMedicationType("Unknown");
      expect(duration).toBe(7);
    });
  });

  describe("getPrescriptionById", () => {
    it("should return prescription by ID", async () => {
      const prescriptionId = "prescription-123";
      const mockPrescription = {
        id: prescriptionId,
        patientId: "patient-456",
        medicationName: "Medication A",
        patient: {
          id: "patient-456",
          allergies: null,
        },
      };

      prisma.Prescription.findUnique.mockResolvedValue(mockPrescription);

      const result =
        await prescriptionRepository.getPrescriptionById(prescriptionId);

      expect(result).toEqual(mockPrescription);
      expect(prisma.Prescription.findUnique).toHaveBeenCalledWith({
        where: { id: prescriptionId },
        include: {
          patient: {
            select: {
              id: true,
              allergies: true,
            },
          },
        },
      });
    });

    it("should throw error if prescription not found", async () => {
      prisma.Prescription.findUnique.mockResolvedValue(null);

      await expect(
        prescriptionRepository.getPrescriptionById("invalid-id")
      ).rejects.toThrow("Prescripción no encontrada");
    });
  });
});
