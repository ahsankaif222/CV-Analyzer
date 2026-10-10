# CV Analyzer

> An AI-powered resume analyzer that scores your CV against ATS systems and provides strengths, keyword gaps, and actionable improvements — in seconds.

<p>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Groq-AI-F55036?style=flat-square&logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Features

- PDF upload with drag & drop
- ATS compatibility score (0-100)
- Keyword gap analysis (found vs. missing)
- Key strengths breakdown
- Prioritized improvement suggestions
- Dark / Light mode with localStorage persistence

---

## Tech Stack

| Layer | Technology |
|---|---|
| ![Next.js](https://img.shields.io/badge/-Next.js-black?style=flat-square&logo=next.js&logoColor=white) Framework | Next.js 16 (App Router) |
| ![Groq](https://img.shields.io/badge/-Groq-F55036?style=flat-square&logo=groq&logoColor=white) AI | Groq API (`openai/gpt-oss-120b`) |
| ![Node.js](https://img.shields.io/badge/-pdf--parse-339933?style=flat-square&logo=node.js&logoColor=white) PDF Parsing | `pdf-parse` |
| ![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) Styling | Tailwind CSS v4 |
| ![Google Fonts](https://img.shields.io/badge/-Space_Grotesk-4285F4?style=flat-square&logo=google-fonts&logoColor=white) Font | Space Grotesk (via `next/font`) |
| ![React](https://img.shields.io/badge/-react--dropzone-61DAFB?style=flat-square&logo=react&logoColor=black) File Upload | `react-dropzone` |

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/your-username/cv-analyzer.git
cd cv-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com) — API Keys

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy on Vercel (Web UI)

No CLI needed — deploy entirely through the Vercel dashboard.

### Step 1 — Push to GitHub

Make sure your code is pushed to a GitHub repository. Verify that `.env.local` is in `.gitignore` (it is by default).

### Step 2 — Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Add GitHub Account** if not already connected
3. Find your repository and click **Import**

### Step 3 — Configure the project

On the import screen:
- **Framework Preset** — Next.js (auto-detected)
- **Root Directory** — leave as `./`
- **Build Command** — leave default (`next build`)
- **Output Directory** — leave default (`.next`)

### Step 4 — Add Environment Variables

Still on the import screen, scroll to **Environment Variables** and add:

| Name | Value |
|---|---|
| `GROQ_API_KEY` | `gsk_...` (your real Groq key) |

> You can also add/edit these later via Project -> Settings -> Environment Variables

### Step 5 — Deploy

Click **Deploy**. Vercel will build and publish your app. You will get a live URL like:

```
https://cv-analyzer-xyz.vercel.app
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for AI inference |

See [`.env.example`](.env.example) for the full template.

---

## Project Structure

```
cv-analyzer/
├── app/
│   ├── api/
│   │   └── analyzer/
│   │       └── route.ts      # POST /api/analyzer — PDF -> Groq -> JSON
│   ├── globals.css           # Design system tokens & component styles
│   ├── layout.tsx            # Root layout, font, metadata
│   └── page.tsx              # Landing page + results dashboard
├── lib/
│   └── parse-pdf.ts          # PDF text extraction helper
├── .env.example              # Environment variable template
└── next.config.ts            # Next.js config (serverExternalPackages)
```
