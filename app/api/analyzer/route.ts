import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { parsePdfFromBuffer } from "@/lib/parse-pdf";

export async function POST(request: Request) {
  try {
    // Guard: ensure the API key is present before doing anything
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: GROQ_API_KEY is not set. Add it in Vercel -> Project -> Settings -> Environment Variables." },
        { status: 500 }
      );
    }

    // Instantiate inside the handler so a missing/bad key never crashes the module
    const groq = new Groq({ apiKey });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from the PDF
    const resumeText = await parsePdfFromBuffer(buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from the PDF. Please ensure it is a text-based PDF, not a scanned image." },
        { status: 422 }
      );
    }

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are an elite ATS (Applicant Tracking System) analyst and career coach with 15 years of experience at top recruiting firms. Your analysis is precise, actionable, and insightful.`,
        },
        {
          role: "user",
          content: `Analyze the following resume and return a JSON object with exactly these fields:
- "ats_score": integer 0-100 (ATS compatibility score)
- "strengths": string with 3-5 key strengths, each on a new line starting with "• "
- "suggestions": string with 3-5 prioritized improvements, each on a new line starting with "• "
- "summary": a compelling 2-sentence executive verdict
- "keywords_found": array of up to 8 strong keywords found in the resume
- "keywords_missing": array of up to 5 important keywords that are missing

Return ONLY valid JSON. No markdown, no code blocks, no explanation.

RESUME TEXT:
${resumeText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const raw = (response.choices[0]?.message?.content ?? "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Route error:", err);
    // Always return JSON — never let an HTML 500 page leak to the client
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
