const securityService = require("../services/securityService");
const cacheService = require("../services/cacheService");

/**
    * Middleware to attach full user data from ms-security to the request object.
 */
async function attachSecurityUser(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "No autenticado" });
    }

    let userData = cacheService.getUserById(req.user.id);

    if (!userData) {
      userData = await securityService.getUserById(req.user.id);
    }

    req.securityUser = userData;
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: "Error obteniendo datos del usuario" 
    });
  }
}

module.exports = attachSecurityUser;