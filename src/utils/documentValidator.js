/**
 * Validates uploaded document files.
 * Ensures at least one file is present, checks file types and sizes.
 */
function validateDocument(payload) {
  const files = payload?.files || [];
  if (!Array.isArray(files) || files.length === 0) {
    return {
      error: { details: [{ message: "Se requiere al menos un archivo" }] },
    };
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxSize = 10 * 1024 * 1024;

  for (const f of files) {
    if (!allowedTypes.includes(f.mimetype)) {
      return {
        error: {
          details: [
            {
              message:
                "Tipo de archivo no permitido. Solo PDF, JPEG y PNG son aceptados.",
            },
          ],
        },
      };
    }
    if (f.size > maxSize) {
      return {
        error: {
          details: [
            {
              message: "El tamaño del archivo excede el límite máximo de 10 MB",
            },
          ],
        },
      };
    }
  }

  return { error: null };
}

module.exports = { validateDocument };
