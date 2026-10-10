export async function parsePdfFromBuffer(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import avoids pdf-parse running its filesystem test-file check
    // at module load time, which crashes Vercel serverless cold starts.
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}
