const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

/**
 * Factory middleware to enforce that the authenticated user has one of the allowed roles.
 * It also attaches the ms-security user to req.securityUser for downstream use.
 */
function requireRoles(allowedRoles = []) {
  return async function roleMiddleware(req, res, next) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "No autenticado" });
      }

      if (!req.securityUser) {
        let userData = cacheService.getUserById(req.user.id);

        if (!userData) {
          userData = await securityService.getUserById(req.user.id);
        }

        req.securityUser = userData;
      }

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
