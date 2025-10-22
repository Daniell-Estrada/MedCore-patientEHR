const NodeCache = require("node-cache");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");

/**
 * CacheService manages in-memory caching for users, patients, diagnostics and roles.
 * It uses the 'node-cache' library to provide TTL-based caching with metrics tracking.
 * Optimized to reduce external API calls and improve response times.
 */
class CacheService {
  constructor() {
    this.caches = {
      users: new NodeCache({
        stdTTL: 300,
        checkperiod: 60,
        useClones: false,
        maxKeys: 1000,
      }),

      patients: new NodeCache({
        stdTTL: 120,
        checkperiod: 30,
        useClones: false,
        maxKeys: 100,
      }),

      roles: new NodeCache({
        stdTTL: 600,
        checkperiod: 120,
        useClones: false,
        maxKeys: 500,
      }),

      diagnostics: new NodeCache({
        stdTTL: 180,
        checkperiod: 60,
        useClones: false,
        maxKeys: 200,
      }),

      relations: new NodeCache({
        stdTTL: 240,
        checkperiod: 60,
        useClones: false,
        maxKeys: 300,
      }),
    };
  }

  get(cacheType, key) {
    const cache = this.caches[cacheType];
    if (!cache) return null;

    const value = cache.get(key);
    if (value === undefined) return null;

    return value;
  }

  set(cacheType, key, value, ttl = null) {
    const cache = this.caches[cacheType];
    if (!cache) return false;

    return ttl ? cache.set(key, value, ttl) : cache.set(key, value);
  }

  delete(cacheType, key) {
    const cache = this.caches[cacheType];
    if (!cache) return false;

    return cache.del(key);
  }

  deletePattern(cacheType, pattern) {
    const cache = this.caches[cacheType];
    if (!cache) return 0;

    const keys = cache.keys();
    const regex = new RegExp(pattern);
    const keysToDelete = keys.filter((key) => regex.test(key));

    let deleted = 0;
    keysToDelete.forEach((key) => {
      deleted += cache.del(key);
    });

    return deleted;
  }

  flush(cacheType) {
    const cache = this.caches[cacheType];
    if (!cache) return false;

    cache.flushAll();
    return true;
  }

  flushAll() {
    Object.values(this.caches).forEach((cache) => cache.flushAll());
  }

  getUserById(userId) {
    return this.get("users", `user:${userId}`);
  }

  setUserById(userId, userData, ttl = null) {
    return this.set("users", `user:${userId}`, userData, ttl);
  }

  invalidateUser(userId) {
    return this.delete("users", `user:${userId}`);
  }

  getPatientPage(page, limit) {
    return this.get("patients", `patients:page:${page}:limit:${limit}`);
  }

  setPatientPage(page, limit, data) {
    return this.set("patients", `patients:page:${page}:limit:${limit}`, data);
  }

  invalidatePatientPages() {
    return this.deletePattern("patients", "^patients:page:");
  }

  getUserRole(userId) {
    return this.get("roles", `role:${userId}`);
  }

  setUserRole(userId, role) {
    return this.set("roles", `role:${userId}`, role);
  }

  invalidateUserRole(userId) {
    return this.delete("roles", `role:${userId}`);
  }

  invalidateUserData(userId) {
    this.invalidateUser(userId);
    this.invalidateUserRole(userId);
    this.invalidatePatientPages();
  }

  getDiagnosticById(diagnosticId) {
    return this.get("diagnostics", `diagnostic:${diagnosticId}`);
  }

  setDiagnosticById(diagnosticId, diagnosticData) {
    return this.set(
      "diagnostics",
      `diagnostic:${diagnosticId}`,
      diagnosticData,
    );
  }

  invalidateDiagnostic(diagnosticId) {
    return this.delete("diagnostics", `diagnostic:${diagnosticId}`);
  }

  getPatientDiagnostics(patientId) {
    return this.get("diagnostics", `patient:${patientId}:diagnostics`);
  }

  setPatientDiagnostics(patientId, diagnostics) {
    return this.set(
      "diagnostics",
      `patient:${patientId}:diagnostics`,
      diagnostics,
    );
  }

  invalidatePatientDiagnostics(patientId) {
    return this.delete("diagnostics", `patient:${patientId}:diagnostics`);
  }

  getPatientRelation(patientId, relationType) {
    return this.get("relations", `patient:${patientId}:${relationType}`);
  }

  setPatientRelation(patientId, relationType, data) {
    return this.set("relations", `patient:${patientId}:${relationType}`, data);
  }

  invalidatePatientRelations(patientId) {
    return this.deletePattern("relations", `^patient:${patientId}:`);
  }

  setMultipleUsers(users) {
    let count = 0;
    users.forEach((user) => {
      if (user.id) {
        this.setUserById(user.id, user);
        if (user.role) {
          this.setUserRole(user.id, user.role);
        }
        count++;
      }
    });
    return count;
  }

  getMultipleUsers(userIds) {
    const results = [];
    const missing = [];

    userIds.forEach((id) => {
      const user = this.getUserById(id);
      if (user) {
        results.push(user);
      } else {
        missing.push(id);
      }
    });

    return { found: results, missing };
  }
}

module.exports = new CacheService();

