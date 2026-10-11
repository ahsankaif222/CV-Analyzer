import { extractText, getDocumentProxy } from "unpdf";

export async function parsePdfFromBuffer(buffer: Buffer): Promise<string> {
  try {
    // unpdf wraps pdfjs-dist with proper serverless/edge configuration.
    // Works on Vercel Lambda without needing Web Workers or filesystem access.
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text ?? "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}
