const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");
const attachSecurityUser = require("./attachSecurityUser");

/**
 * Factory middleware to enforce that the authenticated user has one of the allowed roles.
 * It also attaches the ms-security user to req.securityUser for downstream use.
 */
function requireRoles(allowedRoles = []) {
  return async function roleMiddleware(req, res, next) {
    try {
      await attachSecurityUser(req, res, async () => {});

      if (allowedRoles.length === 0) return next();

      const hasRole = allowedRoles.includes(req.securityUser.role);
      if (!hasRole) {
        return res
          .status(403)
          .json({ message: "Acceso denegado. Permisos insuficientes" });
      }

      return next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error validando permisos de usuario" });
    }
  };
}

module.exports = { requireRoles };
