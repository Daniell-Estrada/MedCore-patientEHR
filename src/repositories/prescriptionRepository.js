const prisma = require("../config/db/postgresql");
const cacheService = require("../services/cacheService");

/**
 * Repository for managing prescriptions.
 */
class PrescriptionRepository {
  /**
   * Create a new prescription
   * @param {string} patientId - Patient ID
   * @param {string} doctorId - Doctor ID
   * @param {object} prescriptionData - Prescription data
   * @returns {Promise<object>} Created prescription
   */
  async createPrescription(patientId, doctorId, prescriptionData) {
    // Get patient to check allergies
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
      select: { id: true, allergies: true },
    });

    if (!patient) {
      const error = new Error("Paciente no encontrado");
      error.status = 404;
      throw error;
    }

    // Check for allergies
    let allergyWarning = null;
    let allergyChecked = false;

    if (patient.allergies) {
      try {
        const allergies = JSON.parse(patient.allergies);
        const medicationName = prescriptionData.medicationName.toLowerCase();
        
        // Check if medication matches exactly or is part of allergy list
        // Using exact match to avoid false positives
        const hasAllergy = allergies.some((allergy) => {
          const allergyLower = allergy.toLowerCase();
          // Check for exact match or if medication name contains the full allergy name
          return allergyLower === medicationName || 
                 (medicationName.includes(allergyLower) && allergyLower.length >= 4);
        });

        if (hasAllergy) {
          allergyWarning = `ADVERTENCIA: El paciente tiene alergia registrada a medicamentos similares a ${prescriptionData.medicationName}`;
        }
        allergyChecked = true;
      } catch (e) {
        // If allergies is not valid JSON, log error and continue without check
        console.error(`Error parsing patient allergies for patient ${patientId}:`, e.message);
        allergyChecked = false;
      }
    }

    // Calculate duration based on medication type if not provided
    let duration = prescriptionData.duration;
    if (!duration && prescriptionData.medicationType) {
      duration = this.calculateDurationByMedicationType(
        prescriptionData.medicationType
      );
    }

    // Calculate end date
    const startDate = prescriptionData.startDate
      ? new Date(prescriptionData.startDate)
      : new Date();
    const endDate = duration
      ? new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000)
      : null;

    // Create prescription
    const prescription = await prisma.Prescription.create({
      data: {
        patientId,
        doctorId,
        medicationName: prescriptionData.medicationName,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: duration || 0,
        instructions: prescriptionData.instructions || null,
        medicationType: prescriptionData.medicationType || null,
        startDate,
        endDate,
        notes: allergyWarning || prescriptionData.notes || null,
        allergyChecked,
      },
    });

    return { prescription, allergyWarning };
  }

  /**
   * Get prescriptions for a patient
   * @param {string} patientId - Patient ID
   * @param {object} options - Query options (page, limit)
   * @returns {Promise<object>} Prescriptions list with pagination
   */
  async getPrescriptionsByPatient(patientId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await prisma.Patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      const error = new Error("Paciente no encontrado");
      error.status = 404;
      throw error;
    }

    const [prescriptions, total] = await Promise.all([
      prisma.Prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.Prescription.count({
        where: { patientId },
      }),
    ]);

    return {
      data: prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate treatment duration based on medication type
   * @param {string} medicationType - Type of medication
   * @returns {number} Duration in days
   */
  calculateDurationByMedicationType(medicationType) {
    const durationType = medicationType.toLowerCase();
    
    // Duration mapping based on common medication types
    const durationMap = {
      antibiotic: 7,
      antibiotico: 7,
      analgesic: 3,
      analgesico: 3,
      antiinflammatory: 5,
      antiinflamatorio: 5,
      antihypertensive: 30,
      antihipertensivo: 30,
      antidiabetic: 30,
      antidiabetico: 30,
      antacid: 14,
      antiacido: 14,
      vitamin: 30,
      vitamina: 30,
      supplement: 30,
      suplemento: 30,
    };

    // Find matching type
    for (const [key, value] of Object.entries(durationMap)) {
      if (durationType.includes(key)) {
        return value;
      }
    }

    // Default duration if type not found
    return 7;
  }

  /**
   * Get prescription by ID
   * @param {string} id - Prescription ID
   * @returns {Promise<object>} Prescription
   */
  async getPrescriptionById(id) {
    const prescription = await prisma.Prescription.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            allergies: true,
          },
        },
      },
    });

    if (!prescription) {
      const error = new Error("Prescripción no encontrada");
      error.status = 404;
      throw error;
    }

    return prescription;
  }
}

module.exports = new PrescriptionRepository();
