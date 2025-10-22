const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

/**
 * Middleware to enforce that the authenticated user is an administrator.
 */
async function AdminMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!req.securityUser) {
      let userData = cacheService.getUserById(req.user.id);

      if (!userData) {
        userData = await securityService.getUserById(req.user.id);
      }

      req.securityUser = userData;
    }

    if (req.securityUser.role !== "ADMINISTRADOR") {
      return res
        .status(403)
        .json({ message: "Acceso denegado. Solo administradores" });
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error validando permisos de administrador" });
  }
}

module.exports = AdminMiddleware;
