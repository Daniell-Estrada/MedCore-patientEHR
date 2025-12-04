const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Service to generate PDF for medical prescriptions.
 */
class PrescriptionPdfService {
  async generatePrescriptionPdf(prescription, patientInfo, doctorInfo) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        doc
          .fontSize(20)
          .fillColor("#2c3e50")
          .text("PRESCRIPCIÓN MÉDICA", { align: "center" })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .fillColor("#7f8c8d")
          .text(
            `Fecha de emisión: ${new Date(prescription.prescriptionDate).toLocaleDateString("es-ES")}`,
            { align: "center" },
          )
          .text(`N° Prescripción: ${prescription.id}`, { align: "center" })
          .moveDown(1);

        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke("#bdc3c7")
          .moveDown(1);

        doc
          .fontSize(14)
          .fillColor("#2c3e50")
          .text("Información del Médico", { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .fillColor("#34495e")
          .text(`Nombre: ${doctorInfo.fullname}`)
          .text(`ID Médico: ${doctorInfo.id}`)
          .text(`Email: ${doctorInfo.email || "N/A"}`)
          .moveDown(1);

        doc
          .fontSize(14)
          .fillColor("#2c3e50")
          .text("Información del Paciente", { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(11)
          .fillColor("#34495e")
          .text(`Nombre: ${patientInfo.fullname}`)
          .text(`Documento: ${patientInfo.identificacion || "N/A"}`)
          .text(`ID Paciente: ${patientInfo.id}`)
          .moveDown(0.5);

        if (prescription.allergies && prescription.allergies.length > 0) {
          doc
            .fontSize(11)
            .fillColor("#e74c3c")
            .text("Alergias Conocidas: ", { continued: true })
            .fillColor("#c0392b")
            .text(prescription.allergies.join(", "), { bold: true })
            .moveDown(1);
        }

        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke("#bdc3c7")
          .moveDown(1);

        doc
          .fontSize(14)
          .fillColor("#2c3e50")
          .text("Medicamentos Prescritos", { underline: true })
          .moveDown(0.5);

        prescription.medications.forEach((med, index) => {
          const yPosition = doc.y;

          if (yPosition > doc.page.height - 150) {
            doc.addPage();
          }

          doc
            .fontSize(12)
            .fillColor("#16a085")
            .text(`${index + 1}. ${med.medicationName}`, { bold: true })
            .moveDown(0.3);

          doc
            .fontSize(10)
            .fillColor("#34495e")
            .text(`   Principio Activo: ${med.activeIngredient}`)
            .text(`   Dosificación: ${med.dosage}`)
            .text(`   Frecuencia: ${med.frequency}`)
            .text(
              `   Duración: ${med.duration} ${med.durationType}${med.duration > 1 ? "s" : ""}`,
            );

          if (med.instructions) {
            doc
              .fillColor("#7f8c8d")
              .text(`   Instrucciones: ${med.instructions}`);
          }

          if (med.warnings) {
            doc.fillColor("#e74c3c").text(`   Advertencias: ${med.warnings}`);
          }

          doc.moveDown(0.8);
        });

        if (prescription.notes) {
          doc.moveDown(0.5);
          doc
            .fontSize(12)
            .fillColor("#2c3e50")
            .text("Notas Adicionales:", { underline: true })
            .moveDown(0.3);

          doc.fontSize(10).fillColor("#34495e").text(prescription.notes);
          doc.moveDown(1);
        }

        if (prescription.validUntil) {
          doc
            .fontSize(10)
            .fillColor("#7f8c8d")
            .text(
              `Válida hasta: ${new Date(prescription.validUntil).toLocaleDateString("es-ES")}`,
            )
            .moveDown(1);
        }

        const footerY = doc.page.height - 120;
        if (doc.y < footerY) {
          doc.y = footerY;
        }

        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke("#bdc3c7")
          .moveDown(1);

        doc
          .fontSize(10)
          .fillColor("#7f8c8d")
          .text("_________________________", 50, doc.y, { align: "center" })
          .moveDown(0.3)
          .text("Firma y Sello del Médico", { align: "center" })
          .moveDown(1);

        doc
          .fontSize(8)
          .fillColor("#95a5a6")
          .text(
            "Este documento es una prescripción médica oficial. Consérvelo para su control médico.",
            { align: "center", italics: true },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async savePrescriptionPdf(prescription, patientInfo, doctorInfo, outputPath) {
    const pdfBuffer = await this.generatePrescriptionPdf(
      prescription,
      patientInfo,
      doctorInfo,
    );

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, pdfBuffer);
    return outputPath;
  }
}

module.exports = new PrescriptionPdfService();
