/**
 * Audit Constants Module for Healthcare Application
 * This module defines constants and configurations for auditing events
 * related to patient records, electronic health records (EHR), and system activities.
 */

const EventType = {
  PATIENT_CREATED: "PATIENT_CREATED",
  PATIENT_UPDATED: "PATIENT_UPDATED",
  PATIENT_ACCESSED: "PATIENT_ACCESSED",
  PATIENT_SEARCHED: "PATIENT_SEARCHED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_ACCESSED: "DOCUMENT_ACCESSED",
  EHR_CREATED: "EHR_CREATED",
  EHR_UPDATED: "EHR_UPDATED",
  EHR_ACCESSED: "EHR_ACCESSED",
  SYSTEM_ERROR: "SYSTEM_ERROR",
  UNAUTHORIZED_ACCESS_ATTEMPT: "UNAUTHORIZED_ACCESS_ATTEMPT",
  HTTP_POST_REQUEST: "HTTP_POST_REQUEST",
  HTTP_GET_REQUEST: "HTTP_GET_REQUEST",
  HTTP_PUT_REQUEST: "HTTP_PUT_REQUEST",
  HTTP_DELETE_REQUEST: "HTTP_DELETE_REQUEST",
  HTTP_PATCH_REQUEST: "HTTP_PATCH_REQUEST",
};

const UserRole = {
  ADMINISTRADOR: "ADMINISTRADOR",
  MEDICO: "MEDICO",
  ENFERMERA: "ENFERMERA",
  PACIENTE: "PACIENTE",
  SISTEMA: "SISTEMA",
  UNKNOWN: "UNKNOWN",
};

const SeverityLevel = {
  INFO: "INFO",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

const ActionType = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  ACCESS: "ACCESS",
  SEARCH: "SEARCH",
  UPLOAD: "UPLOAD",
  ERROR: "ERROR",
  VIOLATION: "VIOLATION",
};

const ResourceType = {
  PATIENT_RECORD: "PATIENT_RECORD",
  EHR_DOCUMENT: "EHR_DOCUMENT",
};

const EVENT_CONFIG = {
  [EventType.PATIENT_CREATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.CREATE,
    description: "New patient record created",
  },
  [EventType.PATIENT_UPDATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.UPDATE,
    description: "Patient record updated",
  },
  [EventType.PATIENT_ACCESSED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.ACCESS,
    description: "Patient record accessed",
  },
  [EventType.PATIENT_SEARCHED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.SEARCH,
    description: "Patient records searched",
  },
  [EventType.DOCUMENT_UPLOADED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.UPLOAD,
    description: "Document uploaded",
  },
  [EventType.DOCUMENT_ACCESSED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.ACCESS,
    description: "Document accessed",
  },
  [EventType.EHR_CREATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.CREATE,
    description: "Electronic health record created",
  },
  [EventType.EHR_UPDATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.UPDATE,
    description: "Electronic health record updated",
  },
  [EventType.EHR_ACCESSED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.ACCESS,
    description: "Electronic health record accessed",
  },
  [EventType.SYSTEM_ERROR]: {
    severity: SeverityLevel.HIGH,
    action: ActionType.ERROR,
    description: "System error occurred",
  },
  [EventType.UNAUTHORIZED_ACCESS_ATTEMPT]: {
    severity: SeverityLevel.CRITICAL,
    action: ActionType.VIOLATION,
    description: "Unauthorized access attempt",
  },
  [EventType.HTTP_POST_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.CREATE,
  },
  [EventType.HTTP_GET_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.READ,
  },
  [EventType.HTTP_PUT_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.UPDATE,
  },
  [EventType.HTTP_DELETE_REQUEST]: {
    severity: SeverityLevel.LOW,
    action: ActionType.DELETE,
  },
  [EventType.HTTP_PATCH_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.UPDATE,
  },
};

const HIPAA_SENSITIVE_ROUTES = ["/patients", "/documents", "/medical-history"];
const EXCLUDED_ROUTES = [];

const SENSITIVE_FIELDS = ["password", "token", "accessToken", "refreshToken"];

module.exports = {
  EventType,
  UserRole,
  SeverityLevel,
  ActionType,
  ResourceType,
  EVENT_CONFIG,
  HIPAA_SENSITIVE_ROUTES,
  EXCLUDED_ROUTES,
  SENSITIVE_FIELDS,
};
