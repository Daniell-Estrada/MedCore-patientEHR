const prisma = require("../config/db/postgresql");
const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

class PatientRepository {
  async getAllPatients(page, limit) {
    try {
      const patientsFromSecurity = await securityService.getAllPatients(
        page,
        limit,
      );

      const patientIds = patientsFromSecurity.data?.map((p) => p.id) || [];

      const patientsEHRData = await prisma.Patient.findMany({
        where: { id: { in: patientIds } },
      });

      const combinedPatients =
        patientsFromSecurity.data?.map((securityPatient) => {
          const ehrData =
            patientsEHRData.find((p) => p.id === securityPatient.id) || {};

          return {
            ...securityPatient,
            ...ehrData,
          };
        }) || [];

      return {
        total: patientsFromSecurity.total || 0,
        page: parseInt(page),
        pages: Math.ceil((patientsFromSecurity.total || 0) / limit),
        data: combinedPatients,
      };
    } catch (error) {
      throw new Error("Error al obtener pacientes");
    }
  }

  async getPatientById(id) {
    try {
      const patientFromSecurity = await securityService.getUserById(id);

      if (!patientFromSecurity) {
        const error = new Error("Paciente no encontrado");
        error.status = 404;
        throw error;
      }

      if (patientFromSecurity.role && patientFromSecurity.role !== "PACIENTE") {
        const error = new Error("El usuario no es un paciente");
        error.status = 404;
        throw error;
      }

      const patientEHR = await prisma.Patient.findFirst({
        where: { id },
      });

      if (!patientEHR) {
        const error = new Error("Registro EHR del paciente no encontrado");
        error.status = 404;
        throw error;
      }

      return {
        ...patientFromSecurity,
        ...patientEHR,
      };
    } catch (error) {
      throw error;
    }
  }

  async advancePatientSearch({
    diagnostic,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
  }) {
    const where = {};
    if (diagnostic) {
      where.diagnosis = { contains: diagnostic, mode: "insensitive" };
    }
    if (dateFrom || dateTo) {
      where.consultDate = {};
      if (dateFrom) where.consultDate.gte = new Date(dateFrom);
      if (dateTo) where.consultDate.lte = new Date(dateTo);
    }

    const diagRows = await prisma.Diagnostic.findMany({
      where,
      select: {
        medicalHistory: {
          select: {
            patientId: true,
          },
        },
      },
    });
    const uniquePatientIds = Array.from(
      new Set(diagRows.map((r) => r.medicalHistory.patientId)),
    );

    const total = uniquePatientIds.length;
    const pages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageIds = uniquePatientIds.slice(start, end);

    const localPatients = await prisma.Patient.findMany({
      where: { id: { in: pageIds } },
      orderBy: { createdAt: "desc" },
    });

    const { found: cachedUsers, missing: missingIds } =
      cacheService.getMultipleUsers(pageIds);

    const enrichedPatients = [...localPatients];

    for (let i = 0; i < enrichedPatients.length; i++) {
      const patient = enrichedPatients[i];
      const cachedUser = cachedUsers.find((u) => u.id === patient.id);

      if (cachedUser) {
        enrichedPatients[i] = {
          ...cachedUser,
          ...patient,
        };
      }
    }

    if (missingIds.length > 0) {
      const missingUsersPromises = missingIds.map(async (id) => {
        try {
          return await securityService.getUserById(id);
        } catch (error) {
          return null;
        }
      });

      const missingUsers = await Promise.all(missingUsersPromises);

      missingUsers.forEach((user) => {
        if (user && user.id) {
          cacheService.setUserById(user.id, user);
          if (user.role) {
            cacheService.setUserRole(user.id, user.role);
          }

          const patientIndex = enrichedPatients.findIndex(
            (p) => p.id === user.id,
          );
          if (patientIndex !== -1) {
            enrichedPatients[patientIndex] = {
              ...user,
              ...enrichedPatients[patientIndex],
            };
          }
        }
      });
    }

    return { total, page, pages, data: enrichedPatients };
  }

  async createPatient(patientData) {
    try {
      let userFromSecurity;
      let id = patientData.userId;

      if (!id) {
        const userData = {
          email: patientData.email,
          fullname: patientData.fullname,
          identificacion: patientData.identificacion,
          current_password:
            patientData.current_password || this.#generateTempPassword(),
          role: "PACIENTE",
          phone: patientData.phone,
          date_of_birth: patientData.date_of_birth,
        };

        userFromSecurity = await securityService.createPatient(userData);
      } else {
        userFromSecurity = await securityService.getUserById(id);
      }

      id = userFromSecurity.id;
      const existingPatient = await prisma.Patient.findUnique({
        where: { id },
      });

      if (existingPatient) {
        throw new Error("El paciente ya existe en el sistema EHR");
      }

      const newPatient = await prisma.Patient.create({
        data: { id },
      });

      return {
        ...userFromSecurity,
        ...newPatient,
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePatient(patientId, updateData) {
    const response = await securityService.updatePatient(patientId, updateData);

    const updatePatient = await prisma.Patient.upsert({
      where: { id: patientId },
      create: { id: patientId },
      update: {},
    });

    return {
      message: response?.message,
      patient: { ...response?.patient, ...updatePatient },
    };
  }

  async updatePatientState(patientId, newState) {
    const response = await securityService.updatePatientState(
      patientId,
      newState,
    );

    return {
      message: response?.message,
      patient: { ...response?.patient, id: patientId },
    };
  }

  #generateTempPassword() {
    return Math.random().toString(36).slice(-8) + "Aa1!";
  }
}

module.exports = new PatientRepository();
