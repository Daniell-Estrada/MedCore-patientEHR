const request = require("supertest");
const express = require("express");

jest.mock("../repositories/prescriptionRepository");
jest.mock("../services/securityService");
jest.mock("../services/prescriptionPdfService");
jest.mock("../middleware/authMiddleware", () => (req, res, next) => {
  req.user = { id: "550e8400-e29b-41d4-a716-446655440003", role: "DOCTOR" };
  next();
});
jest.mock("../middleware/requestContext", () => ({
  contextMiddleware: (req, res, next) => next(),
}));
jest.mock("../interceptors/auditInterceptor", () => ({
  auditInterceptor: (req, res, next) => next(),
}));

const mockMedicalHistoryFindUnique = jest.fn();
const mockMedicalHistoryCreate = jest.fn();

jest.mock("../config/db/postgresql", () => ({
  MedicalHistory: {
    findUnique: mockMedicalHistoryFindUnique,
    create: mockMedicalHistoryCreate,
  },
}));

const prescriptionRoutes = require("../router/prescriptionRoutes");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const securityService = require("../services/securityService");
const prescriptionPdfService = require("../services/prescriptionPdfService");
const authMiddleware = require("../middleware/authMiddleware");

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use("/api/prescriptions", prescriptionRoutes);

describe("Prescription Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/prescriptions - Create Prescription", () => {
    const validPrescriptionData = {
      patientId: "550e8400-e29b-41d4-a716-446655440001",
      diagnosticId: "550e8400-e29b-41d4-a716-446655440002",
      medications: [
        {
          medicationName: "Ibuprofeno",
          activeIngredient: "Ibuprofeno 400mg",
          dosage: "400mg",
          frequency: "Cada 8 horas",
          duration: 5,
          durationType: "días",
          medicationType: "antiinflamatorio",
          instructions: "Tomar con alimentos",
          warnings: "No tomar con el estómago vacío",
        },
      ],
      notes: "Completar el tratamiento completo",
      allergies: [],
    };

    const mockPatient = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      username: "Juan Pérez",
      email: "juan@example.com",
      documentNumber: "12345678",
    };

    const mockDoctor = {
      id: "550e8400-e29b-41d4-a716-446655440003",
      username: "Dr. García",
      email: "garcia@example.com",
    };

    const mockMedicalHistory = {
      id: "550e8400-e29b-41d4-a716-446655440004",
      patientId: "550e8400-e29b-41d4-a716-446655440001",
      createdBy: "550e8400-e29b-41d4-a716-446655440003",
    };

    const mockPrescription = {
      id: "550e8400-e29b-41d4-a716-446655440005",
      medicalHistoryId: "550e8400-e29b-41d4-a716-446655440004",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      patientId: "550e8400-e29b-41d4-a716-446655440001",
      prescriptionDate: new Date(),
      validUntil: new Date(),
      status: "ACTIVE",
      notes: "Completar el tratamiento completo",
      allergies: ["penicilina"],
      medications: [
        {
          id: "550e8400-e29b-41d4-a716-446655440006",
          prescriptionId: "550e8400-e29b-41d4-a716-446655440005",
          medicationName: "Amoxicilina",
          activeIngredient: "Amoxicilina 500mg",
          dosage: "500mg",
          frequency: "Cada 8 horas",
          duration: 7,
          durationType: "días",
          instructions: "Tomar con alimentos",
          warnings: "No consumir alcohol",
        },
      ],
    };

    it("should create a prescription successfully", async () => {
      securityService.getUserById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);

      prescriptionRepository.getPatientAllergies.mockResolvedValueOnce([]);

      mockMedicalHistoryFindUnique.mockResolvedValueOnce(mockMedicalHistory);

      prescriptionRepository.createPrescription.mockResolvedValueOnce(
        mockPrescription,
      );

      prescriptionPdfService.generatePrescriptionPdf.mockResolvedValueOnce(
        Buffer.from("PDF content"),
      );

      const response = await request(app)
        .post("/api/prescriptions")
        .send(validPrescriptionData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Prescription created successfully");
      expect(response.body.prescription).toBeDefined();
      expect(response.body.pdf).toBeDefined();
      expect(response.body.pdf.available).toBe(true);
    });

    it("should return 400 if patient ID is missing", async () => {
      const invalidData = { ...validPrescriptionData };
      delete invalidData.patientId;

      const response = await request(app)
        .post("/api/prescriptions")
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it("should return 400 if medications array is empty", async () => {
      const invalidData = {
        ...validPrescriptionData,
        medications: [],
      };

      const response = await request(app)
        .post("/api/prescriptions")
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it("should return 404 if patient not found", async () => {
      securityService.getUserById.mockResolvedValueOnce(null);

      const response = await request(app)
        .post("/api/prescriptions")
        .send(validPrescriptionData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Patient not found");
    });

    it("should detect allergy conflicts and return 400", async () => {
      const allergyConflictData = {
        ...validPrescriptionData,
        medications: [
          {
            medicationName: "Amoxicilina",
            activeIngredient: "Amoxicilina 500mg",
            dosage: "500mg",
            frequency: "Cada 8 horas",
            duration: 7,
            durationType: "días",
            medicationType: "antibiotico",
            instructions: "Tomar con alimentos",
            warnings: "No consumir alcohol",
          },
        ],
        allergies: ["penicilina"],
      };

      securityService.getUserById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);

      prescriptionRepository.getPatientAllergies.mockResolvedValueOnce([]);

      mockMedicalHistoryFindUnique.mockResolvedValueOnce(mockMedicalHistory);

      const response = await request(app)
        .post("/api/prescriptions")
        .send(allergyConflictData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Allergy conflicts detected");
      expect(response.body.allergyWarnings).toBeDefined();
      expect(response.body.allergyWarnings.length).toBeGreaterThan(0);
    });

    it("should validate medication duration and return warnings", async () => {
      const invalidDurationData = {
        ...validPrescriptionData,
        medications: [
          {
            ...validPrescriptionData.medications[0],
            duration: 30,
            medicationType: "antibiotico",
          },
        ],
        allergies: [],
      };

      securityService.getUserById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);

      prescriptionRepository.getPatientAllergies.mockResolvedValueOnce([]);

      mockMedicalHistoryFindUnique.mockResolvedValueOnce(mockMedicalHistory);

      prescriptionRepository.createPrescription.mockResolvedValueOnce(
        mockPrescription,
      );

      prescriptionPdfService.generatePrescriptionPdf.mockResolvedValueOnce(
        Buffer.from("PDF content"),
      );

      const response = await request(app)
        .post("/api/prescriptions")
        .send(invalidDurationData);

      expect(response.status).toBe(201);
      expect(response.body.durationWarnings).toBeDefined();
    });
  });

  describe("GET /api/prescriptions/patient/:patientId - Get Patient Prescriptions", () => {
    const mockPatient = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      username: "Juan Pérez",
    };

    const mockPrescriptions = {
      data: [
        {
          id: "550e8400-e29b-41d4-a716-446655440005",
          patientId: "550e8400-e29b-41d4-a716-446655440001",
          doctorId: "550e8400-e29b-41d4-a716-446655440003",
          status: "ACTIVE",
          prescriptionDate: new Date(),
          medications: [],
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440007",
          patientId: "550e8400-e29b-41d4-a716-446655440001",
          doctorId: "550e8400-e29b-41d4-a716-446655440003",
          status: "COMPLETED",
          prescriptionDate: new Date(),
          medications: [],
        },
      ],
      total: 2,
      page: 1,
      pages: 1,
    };

    it("should get all prescriptions for a patient", async () => {
      securityService.getUserById.mockImplementation(() =>
        Promise.resolve(mockPatient),
      );
      prescriptionRepository.getPrescriptionsByPatientId.mockImplementation(
        () => Promise.resolve(mockPrescriptions),
      );

      const response = await request(app).get(
        "/api/prescriptions/patient/550e8400-e29b-41d4-a716-446655440001",
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Prescriptions retrieved successfully",
      );
      expect(response.body.data).toHaveLength(2);
      expect(response.body.patient).toBeDefined();
    });

    it("should return 404 if patient not found", async () => {
      securityService.getUserById.mockImplementation(() =>
        Promise.resolve(null),
      );

      const response = await request(app).get(
        "/api/prescriptions/patient/550e8400-e29b-41d4-a716-446655440099",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Patient not found");
    });

    it("should support pagination", async () => {
      securityService.getUserById.mockImplementation(() =>
        Promise.resolve(mockPatient),
      );
      prescriptionRepository.getPrescriptionsByPatientId.mockImplementation(
        () =>
          Promise.resolve({
            ...mockPrescriptions,
            page: 2,
          }),
      );

      const response = await request(app)
        .get("/api/prescriptions/patient/550e8400-e29b-41d4-a716-446655440001")
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
    });
  });

  describe("GET /api/prescriptions/:id - Get Prescription by ID", () => {
    const mockPrescription = {
      id: "550e8400-e29b-41d4-a716-446655440005",
      patientId: "550e8400-e29b-41d4-a716-446655440001",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      status: "ACTIVE",
      medications: [
        {
          id: "550e8400-e29b-41d4-a716-446655440006",
          medicationName: "Amoxicilina",
          dosage: "500mg",
        },
      ],
    };

    it("should get a prescription by ID", async () => {
      prescriptionRepository.getPrescriptionById.mockResolvedValueOnce(
        mockPrescription,
      );

      const response = await request(app).get(
        "/api/prescriptions/550e8400-e29b-41d4-a716-446655440005",
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Prescription retrieved successfully");
      expect(response.body.prescription).toBeDefined();
      expect(response.body.prescription.id).toBe(
        "550e8400-e29b-41d4-a716-446655440005",
      );
    });

    it("should return 404 if prescription not found", async () => {
      prescriptionRepository.getPrescriptionById.mockResolvedValueOnce(null);

      const response = await request(app).get(
        "/api/prescriptions/550e8400-e29b-41d4-a716-446655440099",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Prescription not found");
    });
  });

  describe("GET /api/prescriptions/:id/pdf - Download Prescription PDF", () => {
    const mockPrescription = {
      id: "550e8400-e29b-41d4-a716-446655440005",
      patientId: "550e8400-e29b-41d4-a716-446655440001",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      status: "ACTIVE",
      prescriptionDate: new Date(),
      medications: [],
    };

    const mockPatient = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      username: "Juan Pérez",
    };

    const mockDoctor = {
      id: "550e8400-e29b-41d4-a716-446655440003",
      username: "Dr. García",
    };

    it("should download prescription PDF", async () => {
      prescriptionRepository.getPrescriptionById.mockResolvedValueOnce(
        mockPrescription,
      );
      securityService.getUserById
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);

      const mockPdfBuffer = Buffer.from("PDF content");
      prescriptionPdfService.generatePrescriptionPdf.mockResolvedValueOnce(
        mockPdfBuffer,
      );

      const response = await request(app).get(
        "/api/prescriptions/550e8400-e29b-41d4-a716-446655440005/pdf",
      );

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "550e8400-e29b-41d4-a716-446655440005.pdf",
      );
    });

    it("should return 404 if prescription not found for PDF", async () => {
      prescriptionRepository.getPrescriptionById.mockResolvedValueOnce(null);

      const response = await request(app).get(
        "/api/prescriptions/550e8400-e29b-41d4-a716-446655440099/pdf",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Prescription not found");
    });
  });

  describe("PATCH /api/prescriptions/:id/status - Update Prescription Status", () => {
    const mockPrescription = {
      id: "550e8400-e29b-41d4-a716-446655440005",
      status: "COMPLETED",
      medications: [],
    };

    it("should update prescription status", async () => {
      prescriptionRepository.updatePrescriptionStatus.mockResolvedValueOnce(
        mockPrescription,
      );

      const response = await request(app)
        .patch("/api/prescriptions/550e8400-e29b-41d4-a716-446655440005/status")
        .send({ status: "COMPLETED" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Prescription status updated successfully",
      );
      expect(response.body.prescription.status).toBe("COMPLETED");
    });

    it("should return 400 for invalid status", async () => {
      const response = await request(app)
        .patch("/api/prescriptions/550e8400-e29b-41d4-a716-446655440005/status")
        .send({ status: "INVALID_STATUS" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/prescriptions/patient/:patientId/active - Get Active Prescriptions", () => {
    const mockPatient = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      username: "Juan Pérez",
    };

    const mockActivePrescriptions = [
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        patientId: "550e8400-e29b-41d4-a716-446655440001",
        status: "ACTIVE",
        medications: [],
      },
    ];

    it("should get active prescriptions for a patient", async () => {
      securityService.getUserById.mockResolvedValueOnce(mockPatient);
      prescriptionRepository.getActivePrescriptionsByPatientId.mockResolvedValueOnce(
        mockActivePrescriptions,
      );

      const response = await request(app).get(
        "/api/prescriptions/patient/550e8400-e29b-41d4-a716-446655440001/active",
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Active prescriptions retrieved successfully",
      );
      expect(response.body.total).toBe(1);
      expect(response.body.prescriptions).toHaveLength(1);
    });

    it("should return 404 if patient not found", async () => {
      securityService.getUserById.mockImplementation(() =>
        Promise.resolve(null),
      );

      const response = await request(app).get(
        "/api/prescriptions/patient/550e8400-e29b-41d4-a716-446655440099/active",
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Patient not found");
    });
  });
});
