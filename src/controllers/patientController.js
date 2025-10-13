const prisma = require("../config/db/postgresql");
const calculateAge = require("../utils/calculateAge");
const securityService = require("../services/securityService");

/**
 * Get all patients with pagination
 * Combines data from ms-security and local EHR database
 */
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const patientsFromSecurity = await securityService.getAllPatients(
      req.user.token,
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

    return res.status(200).json({
      total: patientsFromSecurity.total || 0,
      page: parseInt(page),
      pages: Math.ceil((patientsFromSecurity.total || 0) / limit),
      data: combinedPatients,
    });
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);
    return res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

/**
 * Get patient by ID
 * Combines data from ms-security and local EHR database
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientFromSecurity = await securityService.getUserById(
      id,
      req.user.token,
    );

    if (!patientFromSecurity || patientFromSecurity.role !== "PACIENTE") {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const patientEHR = await prisma.Patient.findFirst({
      where: { userId: id },
    });

    const age = patientFromSecurity.date_of_birth
      ? calculateAge(new Date(patientFromSecurity.date_of_birth))
      : null;

    return res.json({
      ...patientFromSecurity,
      ...patientEHR,
      age,
    });
  } catch (error) {
    console.error("Error en getPatientById:", error);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Update patient information
 * Updates data in local EHR database
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    let { fullname, identificacion, email, phone, date_of_birth, status } =
      req.body;
    const userId = req.securityUser?.id || req.user?.id;
    if (date_of_birth) {
      const parsedDate = new Date(date_of_birth);
      if (isNaN(parsedDate.getTime())) {
        return res
          .status(400)
          .json({ message: "La fecha de nacimiento no es válida" });
      }
      date_of_birth = parsedDate;
    }

    const updatedPatient = await prisma.users.update({
      where: { id },
      data: {
        identificacion: identificacion || undefined,
        fullname: fullname || undefined,
        phone: phone || undefined,
        email: email || undefined,
        date_of_birth: date_of_birth || undefined,
        status: status || undefined,
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
      select: {
        id: true,
        email: true,
        identificacion: true,
        fullname: true,
        current_password: true,
        status: true,
        phone: true,
        date_of_birth: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: { select: { id: true, fullname: true, email: true } },
      },
    });

    const age = updatedPatient.date_of_birth
      ? calculateAge(updatedPatient.date_of_birth)
      : null;

    return res.status(200).json({
      message: "Paciente actualizado correctamente",
      patient: {
        ...updatedPatient,
        age,
      },
    });
  } catch (error) {
    console.error("Error en updatePatient:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Update patient state (ACTIVE/INACTIVE)
 */
const updatePatientState = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.securityUser?.id || req.user?.id;

    const allowedStatus = ["ACTIVE", "INACTIVE"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: `El estado debe ser uno de: ${allowedStatus.join(", ")}`,
      });
    }

    const patient = await prisma.users.findFirst({
      where: { id, role: "PACIENTE" },
    });

    if (!patient) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }

    const updatedPatient = await prisma.users.update({
      where: { id: patient.id },
      data: {
        status,
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
      select: {
        id: true,
        email: true,
        identificacion: true,
        fullname: true,
        phone: true,
        date_of_birth: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        updatedBy: { select: { id: true, fullname: true, email: true } },
      },
    });

    return res.json({
      message: "Estado del paciente actualizado correctamente",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Error en updatePatientState:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  updatePatient,
  updatePatientState,
};
