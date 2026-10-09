"use client";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  ats_score: number;
  strengths: string;
  suggestions: string;
  summary: string;
  keywords_found?: string[];
  keywords_missing?: string[];
}

// ─── Theme Hook ───────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("cv-analyzer-theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("cv-analyzer-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStroke = (s: number) => {
    if (s >= 80) return "var(--success)";
    if (s >= 60) return "var(--warning)";
    return "var(--error)";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return { text: "Excellent", color: "var(--success)" };
    if (s >= 60) return { text: "Good", color: "var(--warning)" };
    return { text: "Needs Work", color: "var(--error)" };
  };

  const label = getLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="7"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={getStroke(score)}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-progress"
            style={{ "--target-offset": offset } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            {score}
          </span>
          <span className="text-xs font-medium tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            / 100
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: label.color }}>
        {label.text}
      </span>
    </div>
  );
}

// ─── Bullet List ──────────────────────────────────────────────────────────────

function BulletList({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^•\s*/, "").trim())
    .filter(Boolean);
  return (
    <ul className="space-y-2.5">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
          <span
            className="mt-[7px] w-1 h-1 rounded-full shrink-0"
            style={{ background: "var(--muted-foreground)", opacity: 0.5 }}
          />
          {line}
        </li>
      ))}
    </ul>
  );
}

// ─── Sun Icon ─────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// ─── Moon Icon ────────────────────────────────────────────────────────────────

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { theme, toggle } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  async function analyzeResume() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyzer", { method: "POST", body: formData });
      const text = await response.text();
      if (!text) throw new Error("Empty response from server");
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while analyzing the resume.");
    } finally {
      setLoading(false);
    }
  }

  const reset = () => { setResult(null); setFile(null); setError(null); };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex flex-col min-h-screen">

        {/* ─── Nav ─── */}
        <nav
          className="flex items-center justify-between px-6 py-4 md:px-10"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {/* Logo */}
          <a href="/" className="flex items-center gap-1.5 no-underline">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--foreground)", fontFamily: "var(--font-mono), monospace", letterSpacing: "-0.03em" }}
            >
              CV
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--accent-blue)", fontFamily: "var(--font-mono), monospace" }}
            >
              Analyzer
            </span>
          </a>

          {/* Theme toggle */}
          <button
            id="theme-toggle"
            onClick={toggle}
            className="theme-toggle"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>

        {/* ─── Content ─── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {!result ? (
            <div className="w-full max-w-xl flex flex-col items-center gap-8">

              {/* Hero text */}
              <div className="text-center space-y-3">
                <h1
                  className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.06]"
                  style={{ color: "var(--foreground)" }}
                >
                  Score your resume<br />instantly.
                </h1>
                <p
                  className="text-base max-w-sm mx-auto leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Upload your PDF and get ATS scores, keyword gaps, and
                  actionable improvements — in seconds.
                </p>
              </div>

              {/* Drop zone */}
              <div
                {...getRootProps()}
                id="resume-dropzone"
                className={`drop-zone w-full rounded-xl cursor-pointer border-2 border-dashed${isDragActive ? " drag-active" : ""}`}
                style={{
                  borderColor: isDragActive
                    ? "var(--accent-blue)"
                    : file
                    ? "var(--success)"
                    : "var(--border)",
                  background: file ? "var(--success-muted)" : "var(--surface-1)",
                }}
              >
                <input {...getInputProps()} id="resume-file-input" />
                <div className="flex flex-col items-center justify-center py-11 px-8 text-center gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: file
                        ? "var(--success-muted)"
                        : isDragActive
                        ? "var(--accent-blue-muted)"
                        : "var(--surface-3)",
                      border: "1px solid",
                      borderColor: file
                        ? "var(--success-border)"
                        : isDragActive
                        ? "var(--accent-blue-border)"
                        : "var(--border)",
                    }}
                  >
                    {file ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                        <line x1="9" y1="12" x2="15" y2="12"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke={isDragActive ? "var(--accent-blue)" : "var(--muted-foreground)"}
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    )}
                  </div>

                  {/* Label */}
                  {file ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {file.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {(file.size / 1024).toFixed(1)} KB · PDF
                      </p>
                      <p className="text-xs font-medium" style={{ color: "var(--success)" }}>
                        Ready to analyze
                      </p>
                    </div>
                  ) : isDragActive ? (
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Drop it here</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Release to upload your resume</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        Drag &amp; drop your resume
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        or{" "}
                        <span style={{ color: "var(--accent-blue)" }} className="font-medium">
                          click to browse
                        </span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                        PDF only · Max 5 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="w-full rounded-xl px-5 py-4 text-sm"
                  style={{
                    background: "var(--error-muted)",
                    border: "1px solid var(--error-border)",
                    color: "var(--error)",
                  }}
                >
                  <span className="font-medium">Error — </span>{error}
                </div>
              )}

              {/* CTA Button */}
              <button
                id="analyze-btn"
                onClick={analyzeResume}
                disabled={!file || loading}
                className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    Analyze Resume
                  </>
                )}
              </button>

              {/* Feature labels */}
              <div className="flex flex-wrap gap-2 justify-center">
                {["ATS Score", "Keyword Gap", "Strengths", "Improvements"].map((f) => (
                  <span
                    key={f}
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* ─── Results Dashboard ─── */
            <div className="w-full max-w-5xl space-y-5">

              {/* Back */}
              <button
                id="back-btn"
                onClick={reset}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Analyze another resume
              </button>

              {/* Top row: Score + Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score card */}
                <div className="card rounded-xl p-8 flex flex-col items-center justify-center gap-4 animate-fade-slide-up">
                  <SectionLabel>ATS Score</SectionLabel>
                  <ScoreRing score={result.ats_score} />
                </div>

                {/* Summary card */}
                <div className="card rounded-xl p-6 md:col-span-2 animate-fade-slide-up animate-delay-100">
                  <SectionLabel>Executive Summary</SectionLabel>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Keywords row */}
              {(result.keywords_found?.length || result.keywords_missing?.length) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.keywords_found?.length ? (
                    <div className="card rounded-xl p-6 animate-fade-slide-up animate-delay-200">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                        <SectionLabel>Keywords Found</SectionLabel>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords_found.map((kw) => (
                          <span
                            key={kw}
                            className="keyword-pill"
                            style={{
                              background: "var(--success-muted)",
                              color: "var(--success)",
                              border: "1px solid var(--success-border)",
                            }}
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {result.keywords_missing?.length ? (
                    <div className="card rounded-xl p-6 animate-fade-slide-up animate-delay-300">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--warning)" }} />
                        <SectionLabel>Keywords Missing</SectionLabel>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords_missing.map((kw) => (
                          <span
                            key={kw}
                            className="keyword-pill"
                            style={{
                              background: "var(--warning-muted)",
                              color: "var(--warning)",
                              border: "1px solid var(--warning-border)",
                            }}
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Strengths + Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="card rounded-xl p-6 animate-fade-slide-up animate-delay-300">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                    <SectionLabel>Key Strengths</SectionLabel>
                  </div>
                  <BulletList text={result.strengths} />
                </div>

                {/* Suggestions */}
                <div className="card rounded-xl p-6 animate-fade-slide-up animate-delay-400">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-blue)" }} />
                    <SectionLabel>Areas to Improve</SectionLabel>
                  </div>
                  <BulletList text={result.suggestions} />
                </div>
              </div>

              {/* Start over */}
              <button
                id="reanalyze-btn"
                onClick={reset}
                className="btn-ghost w-full py-3 text-sm font-medium"
              >
                ↩ Start Over
              </button>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <footer
          className="py-5 text-center text-xs tracking-wide"
          style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", opacity: 0.7 }}
        >
          CV Analyzer — AI-powered resume analysis
        </footer>
      </div>
    </main>
  );
}
