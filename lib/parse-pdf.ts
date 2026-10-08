import { PDFParse } from "pdf-parse";

export async function parsePdfFromBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  } finally {
    await parser.destroy();
  }
}
