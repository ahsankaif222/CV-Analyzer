export async function parsePdfFromBuffer(buffer: Buffer): Promise<string> {
  try {
    // Dynamic named import — uses the correct pdf-parse v2 class API.
    // Importing inside the function (not at module level) prevents any
    // cold-start side effects from crashing the serverless function.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text ?? "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}
