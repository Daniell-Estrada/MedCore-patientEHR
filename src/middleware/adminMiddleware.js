const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");
const attachSecurityUser = require("./attachSecurityUser");

/**
 * Middleware to enforce that the authenticated user is an administrator.
 */
async function AdminMiddleware(req, res, next) {
  try {
    await attachSecurityUser(req, res, async () => {});

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
