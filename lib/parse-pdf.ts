export async function parsePdfFromBuffer(buffer: Buffer): Promise<string> {
  try {
    // Use require() instead of dynamic import() — pdf-parse v2 ships as ESM
    // with no .default export, so (await import(...)).default fails TypeScript.
    // require() pulls the CJS build reliably, and serverExternalPackages in
    // next.config.ts ensures Vercel leaves it unbundled at runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (
      dataBuffer: Buffer,
      options?: Record<string, unknown>
    ) => Promise<{ text: string; numpages: number }>;

    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}
