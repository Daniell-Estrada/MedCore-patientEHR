const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Service for generating prescription PDFs
 */
class PrescriptionPDFService {
  /**
   * Generate a PDF for a prescription
   * @param {object} prescription - Prescription data
   * @param {object} patientInfo - Patient information
   * @param {object} doctorInfo - Doctor information
   * @returns {Promise<string>} Path to generated PDF
   */
  async generatePrescriptionPDF(prescription, patientInfo, doctorInfo) {
    return new Promise((resolve, reject) => {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "uploads", "prescriptions");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate filename
        const filename = `prescription_${prescription.id}_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).font("Helvetica-Bold").text("PRESCRIPCIÓN MÉDICA", {
          align: "center",
        });
        doc.moveDown();

        // Divider line
        doc
          .strokeColor("#333333")
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
        doc.moveDown();

        // Patient Information
        doc.fontSize(14).font("Helvetica-Bold").text("Información del Paciente");
        doc.fontSize(10).font("Helvetica");
        doc.text(`Nombre: ${patientInfo.fullname || "N/A"}`);
        doc.text(`Identificación: ${patientInfo.identificacion || "N/A"}`);
        if (patientInfo.age) {
          doc.text(`Edad: ${patientInfo.age} años`);
        }
        doc.moveDown();

        // Doctor Information
        doc.fontSize(14).font("Helvetica-Bold").text("Médico Tratante");
        doc.fontSize(10).font("Helvetica");
        doc.text(`Dr(a). ${doctorInfo.fullname || "N/A"}`);
        if (doctorInfo.email) {
          doc.text(`Contacto: ${doctorInfo.email}`);
        }
        doc.moveDown();

        // Divider line
        doc
          .strokeColor("#333333")
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
        doc.moveDown();

        // Prescription Details
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Detalles de la Prescripción");
        doc.fontSize(12).font("Helvetica");
        doc.moveDown(0.5);

        // Medication name
        doc
          .font("Helvetica-Bold")
          .text("Medicamento: ", { continued: true })
          .font("Helvetica")
          .text(prescription.medicationName);

        // Dosage
        doc
          .font("Helvetica-Bold")
          .text("Dosis: ", { continued: true })
          .font("Helvetica")
          .text(prescription.dosage);

        // Frequency
        doc
          .font("Helvetica-Bold")
          .text("Frecuencia: ", { continued: true })
          .font("Helvetica")
          .text(prescription.frequency);

        // Duration
        if (prescription.duration) {
          doc
            .font("Helvetica-Bold")
            .text("Duración del tratamiento: ", { continued: true })
            .font("Helvetica")
            .text(`${prescription.duration} días`);
        }

        // Medication type
        if (prescription.medicationType) {
          doc
            .font("Helvetica-Bold")
            .text("Tipo de medicamento: ", { continued: true })
            .font("Helvetica")
            .text(prescription.medicationType);
        }

        // Dates
        const startDate = new Date(prescription.startDate).toLocaleDateString(
          "es-ES"
        );
        doc
          .font("Helvetica-Bold")
          .text("Fecha de inicio: ", { continued: true })
          .font("Helvetica")
          .text(startDate);

        if (prescription.endDate) {
          const endDate = new Date(prescription.endDate).toLocaleDateString(
            "es-ES"
          );
          doc
            .font("Helvetica-Bold")
            .text("Fecha de finalización: ", { continued: true })
            .font("Helvetica")
            .text(endDate);
        }

        doc.moveDown();

        // Instructions
        if (prescription.instructions) {
          doc.fontSize(12).font("Helvetica-Bold").text("Instrucciones:");
          doc.fontSize(10).font("Helvetica").text(prescription.instructions, {
            align: "justify",
          });
          doc.moveDown();
        }

        // Notes/Warnings
        if (prescription.notes) {
          doc.fontSize(12).font("Helvetica-Bold").text("Notas:");
          doc.fontSize(10).font("Helvetica");
          
          // Highlight allergy warnings
          if (prescription.notes.includes("ADVERTENCIA")) {
            doc.fillColor("red").text(prescription.notes, {
              align: "justify",
            });
            doc.fillColor("black");
          } else {
            doc.text(prescription.notes, {
              align: "justify",
            });
          }
          doc.moveDown();
        }

        // Footer
        doc.moveDown(2);
        doc
          .strokeColor("#333333")
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();
        doc.moveDown();

        doc.fontSize(8).font("Helvetica").fillColor("#666666");
        doc.text(`Fecha de emisión: ${new Date().toLocaleString("es-ES")}`, {
          align: "center",
        });
        doc.text(`ID de Prescripción: ${prescription.id}`, {
          align: "center",
        });

        // Finalize PDF
        doc.end();

        writeStream.on("finish", () => {
          resolve(filePath);
        });

        writeStream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PrescriptionPDFService();
