const { PrismaClient } = require(".prisma/client-postgresql");
const { MS_PATIENT_EHR_CONFIG } = require("../environment");

/**
 * PrismaPostgresql class to manage Prisma Client instance
 * Implements Singleton pattern to ensure a single instance
 * throughout the application lifecycle.
 */
class PrismaPostgresql extends PrismaClient {
  static getInstance() {
    if (!PrismaPostgresql.instance) {
      PrismaPostgresql.instance = new PrismaClient({
        log: [
          { level: "query", emit: "event" },
          { level: "error", emit: "event" },
          { level: "info", emit: "event" },
          { level: "warn", emit: "event" },
        ],
        errorFormat: "pretty",
      });

      if (MS_PATIENT_EHR_CONFIG.NODE_ENV === "development") {
        PrismaPostgresql.instance.$on("query", (e) => {
          console.log("Query: " + e.query);
          console.log("Params: " + e.params);
          console.log("Duration: " + e.duration + "ms");
        });
      }

      PrismaPostgresql.instance.$on("error", (e) => {
        new Error(`Error in Prisma Client: ${e.message}`);
      });
    }

    return PrismaPostgresql.instance;
  }

  static async disconnect() {
    if (PrismaPostgresql.instance) {
      await PrismaPostgresql.instance.$disconnect();
    }
  }
}

module.exports = PrismaPostgresql.getInstance();
