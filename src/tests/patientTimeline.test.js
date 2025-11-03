const mockMedicalHistoryRepository = {
  getPatientTimeline: jest.fn(async (patientId, { page, limit }) => ({
    data: [
      {
        type: "diagnostic",
        id: "diag-1",
        diagnosticId: "diag-1",
        title: "Consulta inicial",
        timestamp: new Date().toISOString(),
        meta: { state: "ACTIVE", doctorId: "doc-1" },
      },
      {
        type: "document",
        id: "doc-1",
        diagnosticId: "diag-1",
        filename: "rayosx.pdf",
        timestamp: new Date().toISOString(),
      },
    ],
    pagination: { page, limit, total: 2, totalPages: 1 },
  })),
};

jest.mock(
  "../repositories/medicalHistoryRepository",
  () => mockMedicalHistoryRepository,
);

const {
  getPatientTimeline,
} = require("../controllers/medicalHistoryController");

/**
 * This test suite verifies the functionality of the Patient Timeline API,
 * specifically the retrieval of timeline events for a patient.
 */
describe("Patient Timeline API", () => {
  let req, res;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
  });

  beforeEach(() => {
    req = {
      params: { patientId: "pat-1" },
      query: { page: "1", limit: "20" },
      user: { id: "user-2", role: "MEDICO" },
    };

    const jsonMock = jest.fn();
    const statusMock = jest.fn(() => ({ json: jsonMock }));

    res = {
      status: statusMock,
      json: jsonMock,
    };

    mockMedicalHistoryRepository.getPatientTimeline.mockClear();
  });

  it("should return patient timeline events", async () => {
    await getPatientTimeline(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Array),
        pagination: expect.any(Object),
      }),
    );

    const callArgs = res.json.mock.calls[0][0];
    expect(callArgs.data).toHaveLength(2);
    expect(callArgs.pagination).toBeDefined();

    expect(
      mockMedicalHistoryRepository.getPatientTimeline,
    ).toHaveBeenCalledWith("pat-1", { page: 1, limit: 20 });
  });
});
