const jwt = require("jsonwebtoken");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");
const { setToken, setUser } = require("./requestContext");

/**
 * Middleware to authenticate requests using JWT tokens.
 * It checks for the presence of a Bearer token in the Authorization header,
 * verifies it, and attaches the decoded user information to the request object.
 * If the token is missing or invalid, it responds with a 401 Unauthorized status.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, MS_PATIENT_EHR_CONFIG.JWT_SECRET);
    const user = { token, ...decoded };
    req.user = user;
    setToken(token);
    setUser(decoded);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;
