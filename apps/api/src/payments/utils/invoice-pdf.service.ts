import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

@Injectable()
export class InvoicePdfService {
  async generateInvoicePdf(input: {
    invoiceNumber: string;
    companyName: string;
    planName: string;
    total: number;
    currency: string;
    issuedAt: Date;
  }) {
    const document = new PDFDocument({ margin: 50 });
    const outputChunks: Buffer[] = [];

    document.on("data", (chunk) => outputChunks.push(chunk as Buffer));

    document.fontSize(24).text("AIDLABORAL S.A.S.", { align: "left" });
    document.moveDown(0.5);
    document.fontSize(18).text("Factura SaaS", { align: "left" });
    document.moveDown();
    document.fontSize(12).text(`Factura: ${input.invoiceNumber}`);
    document.text(`Empresa: ${input.companyName}`);
    document.text(`Plan: ${input.planName}`);
    document.text(`Fecha de emision: ${input.issuedAt.toISOString()}`);
    document.moveDown();
    document.fontSize(14).text(`Total: ${input.currency} ${input.total.toFixed(2)}`);
    document.moveDown(2);
    document.fontSize(10).fillColor("#6b7280").text(
      "Documento generado automaticamente por la capa de monetizacion de AIDLABORAL.",
    );
    document.end();

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      document.on("end", () => resolve(Buffer.concat(outputChunks)));
      document.on("error", reject);
    });

    const invoicesDirectory = path.resolve(process.cwd(), "apps", "api", "storage", "invoices");
    await mkdir(invoicesDirectory, { recursive: true });
    const filePath = path.join(invoicesDirectory, `${input.invoiceNumber}.pdf`);
    await writeFile(filePath, buffer);
    return filePath;
  }
}
