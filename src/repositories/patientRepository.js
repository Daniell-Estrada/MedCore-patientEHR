const prisma = require("../config/db/postgresql");
const securityService = require("../services/securityService");
const calculateAge = require("../utils/calculateAge");

class PatientRepository {
  async getAllPatients(page, limit) {
    try {
      const patientsFromSecurity = await securityService.getAllPatients(
        page,
        limit,
      );

      const patientIds = patientsFromSecurity.data?.map((p) => p.id) || [];

      const patientsEHRData = await prisma.Patient.findMany({
        where: { userId: { in: patientIds } },
      });

      const combinedPatients =
        patientsFromSecurity.data?.map((securityPatient) => {
          const ehrData =
            patientsEHRData.find((p) => p.userId === securityPatient.id) || {};
          const age = securityPatient.date_of_birth
            ? calculateAge(new Date(securityPatient.date_of_birth))
            : null;

          return {
            ...securityPatient,
            ...ehrData,
            age,
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

      if (!patientFromSecurity || patientFromSecurity.role !== "PACIENTE") {
        throw new Error("Paciente no encontrado");
      }

      const patientEHR = await prisma.Patient.findFirst({
        where: { userId: id },
      });

      const age = patientFromSecurity.date_of_birth
        ? calculateAge(new Date(patientFromSecurity.date_of_birth))
        : null;

      return {
        ...patientFromSecurity,
        ...patientEHR,
        age,
      };
    } catch (error) {
      throw new Error(error.message || "Error al obtener paciente");
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
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const diagRows = await prisma.Diagnostic.findMany({
      where,
      select: { patientId: true },
    });
    const uniquePatientIds = Array.from(
      new Set(diagRows.map((r) => r.patientId)),
    );

    const total = uniquePatientIds.length;
    const pages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageIds = uniquePatientIds.slice(start, end);

    const patients = await prisma.Patient.findMany({
      where: { id: { in: pageIds } },
      orderBy: { createdAt: "desc" },
    });

    return { total, page, pages, data: patients };
  }

  async updatePatient(patientId, updateData) {
    const updatedSecurityUser = await securityService.updateUser(
      patientId,
      updateData,
    );

    const birthDate = updatedSecurityUser?.date_of_birth
      ? new Date(updatedSecurityUser.date_of_birth)
      : undefined;
    const age = birthDate ? calculateAge(birthDate) : undefined;

    await prisma.Patient.upsert({
      where: { userId: patientId },
      create: {
        userId: patientId,
        documentNumber: updatedSecurityUser?.identificacion,
        birthDate: birthDate || new Date(),
        age: typeof age === "number" ? age : 0,
        gender: updatedSecurityUser?.gender || "UNKNOWN",
        phone: updatedSecurityUser?.phone || null,
        address: null,
        state: updatedSecurityUser?.status || null,
      },
      update: {
        birthDate: birthDate ?? undefined,
        age: typeof age === "number" ? age : undefined,
        phone: updatedSecurityUser?.phone ?? undefined,
        state: updatedSecurityUser?.status ?? undefined,
      },
    });

    const finalAge = updatedSecurityUser?.date_of_birth
      ? calculateAge(new Date(updatedSecurityUser.date_of_birth))
      : null;
    return { ...updatedSecurityUser, age: finalAge };
  }

  async updatePatientState(patientId, newState) {
    const updatedUser = await securityService.updateUserState(
      patientId,
      newState,
    );
    await prisma.Patient.updateMany({
      where: { userId: patientId },
      data: { state: newState },
    });
    return updatedUser;
  }
}

module.exports = new PatientRepository();
