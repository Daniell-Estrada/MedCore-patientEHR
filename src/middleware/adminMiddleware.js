const securityService = require("../services/securityService");

/**
 * Middleware to ensure the user is authenticated and has ADMINISTRADOR role
 */
async function AdminMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const userData = await securityService.getUserById(
      req.user.id,
      req.user.token,
    );
    req.securityUser = userData;

    const isAdmin = await securityService.validateUserRole(
      req.user.id,
      "ADMINISTRADOR",
      req.user.token,
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Acceso denegado. Solo administradores" });
    }

    next();
  } catch (error) {
    console.error("Error en AdminMiddleware:", error);
    return res
      .status(500)
      .json({ message: "Error validando permisos de administrador" });
  }
}

module.exports = AdminMiddleware;
