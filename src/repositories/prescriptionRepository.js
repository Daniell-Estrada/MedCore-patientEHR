const prisma = require("../config/db/postgresql");

class PrescriptionRepository {
  async createPrescription(prescriptionData) {
    const {
      medicalHistoryId,
      diagnosticId,
      doctorId,
      patientId,
      medications,
      notes,
      allergies,
      validUntil,
    } = prescriptionData;

    return await prisma.Prescription.create({
      data: {
        medicalHistoryId,
        diagnosticId,
        doctorId,
        patientId,
        notes,
        allergies: allergies || [],
        validUntil: validUntil ? new Date(validUntil) : null,
        medications: {
          create: medications.map((med) => ({
            medicationName: med.medicationName,
            activeIngredient: med.activeIngredient,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            durationType: med.durationType,
            instructions: med.instructions,
            warnings: med.warnings,
          })),
        },
      },
      include: {
        medications: true,
        medicalHistory: {
          include: {
            patient: true,
          },
        },
      },
    });
  }

  async getPrescriptionsByPatientId(patientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      prisma.Prescription.findMany({
        where: { patientId },
        include: {
          medications: true,
        },
        orderBy: {
          prescriptionDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.Prescription.count({
        where: { patientId },
      }),
    ]);

    return {
      data: prescriptions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getPrescriptionById(id) {
    return await prisma.Prescription.findUnique({
      where: { id },
      include: {
        medications: true,
        medicalHistory: {
          include: {
            patient: true,
          },
        },
      },
    });
  }

  async updatePrescriptionStatus(id, status) {
    return await prisma.Prescription.update({
      where: { id },
      data: { status },
      include: {
        medications: true,
      },
    });
  }

  async getPrescriptionsByDoctorId(doctorId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      prisma.Prescription.findMany({
        where: { doctorId },
        include: {
          medications: true,
        },
        orderBy: {
          prescriptionDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.Prescription.count({
        where: { doctorId },
      }),
    ]);

    return {
      data: prescriptions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getActivePrescriptionsByPatientId(patientId) {
    return await prisma.Prescription.findMany({
      where: {
        patientId,
        status: "ACTIVE",
      },
      include: {
        medications: true,
      },
      orderBy: {
        prescriptionDate: "desc",
      },
    });
  }

  async getPatientAllergies(patientId) {
    const prescriptions = await prisma.Prescription.findMany({
      where: { patientId },
      select: {
        allergies: true,
      },
    });

    const allAllergies = prescriptions.flatMap((p) => p.allergies);
    return [...new Set(allAllergies)];
  }
}

module.exports = new PrescriptionRepository();
