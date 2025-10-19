const path = require("path");
const fs = require("fs");
const { MS_PATIENT_EHR_CONFIG } = require("../config/environment");
const fsp = require("fs").promises;

let put, del;
try {
  ({ put, del } = require("@vercel/blob"));
} catch (_) {}

const LOCAL_ROOT = path.join("uploads", "patients", "diagnostics");

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_ROOT)) {
    fs.mkdirSync(LOCAL_ROOT, { recursive: true });
  }
}

/**
 * Upload a file buffer or stream and return { url, storedKey, filePath }.
 * In serverless environments, uses Vercel Blob Storage.
 * In local environments, saves to local filesystem.
 */
async function upload({ buffer, originalname, filename, mimetype }) {
  const ext = path.extname(originalname || filename || "");
  const safeName =
    filename || `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (MS_PATIENT_EHR_CONFIG.VERCEL) {
    if (!put)
      throw new Error("Storage provider not available in serverless env");
    const key = `patients/diagnostics/${safeName}`;
    const { url } = await put(key, buffer, {
      access: "public",
      contentType: mimetype,
    });
    return { url, storedKey: key, filePath: url };
  }

  ensureLocalDir();
  const filePath = path.join(LOCAL_ROOT, safeName);
  await fsp.writeFile(filePath, buffer);
  return { url: null, storedKey: safeName, filePath };
}

/**
 * Delete a previously stored file.
 * Accepts either a storedKey (blob path) or a local filePath.
 */
async function remove({ storedKey, filePath }) {
  try {
    if (MS_PATIENT_EHR_CONFIG.VERCEL && storedKey && del) {
      await del(storedKey);
      return true;
    }
    if (filePath) {
      await fsp.unlink(filePath);
      return true;
    }
  } catch (_) {}
  return false;
}

module.exports = { upload, remove };
