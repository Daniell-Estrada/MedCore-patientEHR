/**
 * Audit Mappers Module for Healthcare Application
 * This module provides functions to map HTTP requests and responses
 * to audit event types, resource types, and metadata for auditing purposes.
 */
const {
  EventType,
  ActionType,
  ResourceType,
  SeverityLevel,
  EVENT_CONFIG,
  HIPAA_SENSITIVE_ROUTES,
  SENSITIVE_FIELDS,
} = require("../constants/auditConstants");

const ROUTE_PATTERNS = [
  {
    pattern: /\/patients\/search/i,
    event: EventType.PATIENT_SEARCHED,
    resource: ResourceType.PATIENT_RECORD,
  },
  {
    pattern: /\/patients\/.+/i,
    methods: ["GET"],
    event: EventType.PATIENT_ACCESSED,
    resource: ResourceType.PATIENT_RECORD,
  },
  {
    pattern: /\/patients/i,
    methods: ["POST"],
    event: EventType.PATIENT_CREATED,
    resource: ResourceType.PATIENT_RECORD,
  },
  {
    pattern: /\/patients/i,
    methods: ["PUT", "PATCH"],
    event: EventType.PATIENT_UPDATED,
    resource: ResourceType.PATIENT_RECORD,
  },
  {
    pattern: /\/documents\/.+\/download/i,
    methods: ["GET"],
    event: EventType.DOCUMENT_ACCESSED,
    resource: ResourceType.EHR_DOCUMENT,
  },
  {
    pattern: /\/documents\/.+/i,
    methods: ["GET"],
    event: EventType.DOCUMENT_ACCESSED,
    resource: ResourceType.EHR_DOCUMENT,
  },
  {
    pattern: /\/documents/i,
    methods: ["POST"],
    event: EventType.DOCUMENT_UPLOADED,
    resource: ResourceType.EHR_DOCUMENT,
  },
  {
    pattern: /\/medical-history\/.+/i,
    methods: ["GET"],
    event: EventType.EHR_ACCESSED,
    resource: ResourceType.EHR_DOCUMENT,
  },
  {
    pattern: /\/medical-history/i,
    methods: ["POST"],
    event: EventType.EHR_CREATED,
    resource: ResourceType.EHR_DOCUMENT,
  },
  {
    pattern: /\/medical-history/i,
    methods: ["PUT", "PATCH"],
    event: EventType.EHR_UPDATED,
    resource: ResourceType.EHR_DOCUMENT,
  },
];

function matchRoutePattern(pattern, method, path) {
  if (!pattern.pattern.test(path)) return null;
  if (pattern.methods && !pattern.methods.includes(method)) return null;
  return pattern;
}

function determineEventType(method, path, statusCode) {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = path.toLowerCase();

  if (statusCode >= 500) return EventType.SYSTEM_ERROR;

  for (const pattern of ROUTE_PATTERNS) {
    const match = matchRoutePattern(pattern, normalizedMethod, normalizedPath);
    if (!match) continue;

    if (match.event) return match.event;
  }

  if (statusCode === 401 || statusCode === 403) {
    return EventType.UNAUTHORIZED_ACCESS_ATTEMPT;
  }

  return `HTTP_${normalizedMethod}_REQUEST`;
}

function getEventConfig(eventType, method, path, success) {
  const config = EVENT_CONFIG[eventType];

  if (!config) {
    return {
      severity: SeverityLevel.INFO,
      action: ActionType.ACCESS,
      description: `${method} request to ${path} ${success ? "successful" : "failed"}`,
    };
  }

  return {
    severity: config.severity,
    action: config.action,
    description:
      config.description ||
      `${method} request to ${path} ${success ? "successful" : "failed"}`,
  };
}

function determineResourceType(path) {
  const lowerPath = path.toLowerCase();

  if (lowerPath.includes("/patient")) return ResourceType.PATIENT_RECORD;
  if (lowerPath.includes("/document") || lowerPath.includes("/medical-history"))
    return ResourceType.EHR_DOCUMENT;

  return null;
}

function isHipaaSensitiveRoute(path) {
  const lowerPath = path.toLowerCase();
  return HIPAA_SENSITIVE_ROUTES.some((route) => lowerPath.includes(route));
}

function extractResourceId(req) {
  return (
    req.params?.id ||
    req.params?.patientId ||
    req.params?.documentId ||
    req.query?.id ||
    null
  );
}

function sanitizeRequestBody(body) {
  if (!body || typeof body !== "object") return {};

  const sanitized = { ...body };
  SENSITIVE_FIELDS.forEach((field) => {
    if (sanitized[field]) sanitized[field] = "***REDACTED***";
  });

  return sanitized;
}

function buildAuditMetadata(req, res, duration) {
  return {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
    body: sanitizeRequestBody(req.body),
    statusCode: res.statusCode,
    contentType: res.get("Content-Type"),
    duration: `${duration}ms`,
    requestSize: req.get("Content-Length") || 0,
    responseSize: res.get("Content-Length") || 0,
  };
}

module.exports = {
  determineEventType,
  getEventConfig,
  determineResourceType,
  isHipaaSensitiveRoute,
  extractResourceId,
  sanitizeRequestBody,
  buildAuditMetadata,
};
