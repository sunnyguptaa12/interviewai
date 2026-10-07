# AI-Powered Personalized Interview Platform - Backend

Express + MongoDB REST API with a provider-agnostic AI layer.

## Setup
```
cp .env.example .env     # set MONGODB_URI, JWT_SECRET, AI_API_KEY, AI_MODEL
npm install
npm run dev              # http://localhost:5000
npm test                 # unit tests (no database or AI key needed)
npm run make-admin -- you@example.com
```

## Environment variables
| Variable | Purpose |
|---|---|
| MONGODB_URI, JWT_SECRET | required |
| DNS_SERVERS | optional comma-separated DNS resolvers, only needed when Node.js cannot resolve Atlas SRV records |
| CLIENT_URL | allowed CORS origin (the frontend URL) |
| AI_PROVIDER | `anthropic` (default), `openai`, or `gemini` |
| AI_API_KEY, AI_MODEL | provider key and model id (server-side only) |
| AI_TIMEOUT_MS, MAX_UPLOAD_MB | optional (90000 / 5) |

For a free-tier Gemini setup, create a key in [Google AI Studio](https://aistudio.google.com/apikey), then set `AI_PROVIDER=gemini`, `AI_API_KEY` to that key, and `AI_MODEL=gemini-3.5-flash-lite` in `.env`. Free-tier model availability and quotas can change; check [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing). Keep the key private and restart the backend after changing `.env`.

## Architecture
`routes -> controllers (thin) -> services -> models`. AI code lives in `services/ai/`:
`client.js` (HTTP, timeout, retries, JSON parse + zod validation), `prompts.js` (one template per task), `schemas.js` (response validation), `aiService.js` (public functions). To add a provider, add one adapter in `client.js`.

Pipeline: upload -> text extraction (pdfjs / mammoth, signature check) -> PII redaction -> parallel resume analysis + domain detection -> question categories built from the candidate's own domain areas and skills -> generation in parallel batches -> practice -> evaluation -> analytics.

## API (all under /api, JSON `{success, message, data}`)
Auth: `POST /auth/register|login|logout`, `GET /auth/me` | Profile: `GET|PUT /users/profile`
Resumes: `POST /resumes/upload` (multipart, field `resume`), `GET /resumes`, `GET /resumes/:id`, `GET /resumes/:id/analysis`, `GET /resumes/:id/file`, `GET /resumes/:id/download`, `DELETE /resumes/:id`
AI: `POST /ai/analyze-resume | resume-improvement | generate-questions | evaluate-answer | mock-interview | job-match | learning-plan | recommendations`
Questions: `GET /questions` (filters: resumeId, category, skill, domain, difficulty, search, status=attempted|unattempted, minScore, maxScore, page, limit), `GET /questions/categories`, `GET /questions/:id`, `POST /questions/:id/report`
Answers: `POST /answers`, `GET /answers/history`
Interviews: `GET /interviews`, `GET /interviews/:id`, `POST /interviews/:id/answer`, `POST /interviews/:id/finish`
Jobs: `GET /job-descriptions`, `GET|DELETE /job-descriptions/:id`
Plans: `GET /learning-plans`, `PATCH /learning-plans/:id/topic`, `DELETE /learning-plans/:id`
Other: `GET /analytics`, `GET /progress`, `GET /notifications`, `PATCH /notifications/read-all|:id/read`
Admin: `GET /admin/statistics|users|questions`, `PATCH|DELETE /admin/users/:id`, `DELETE /admin/questions/:id`, `PATCH /admin/questions/:id/dismiss-report`

## Collections
users, resumes, resumeanalyses, jobdescriptions, questions, answers (denormalized for analytics), mockinterviews (turns + result), learningplans, notifications. Question categories are derived from `questions.category`; progress is computed from answers/questions.

## Deploy
Render: use `render.yaml` (set MONGODB_URI, CLIENT_URL, AI_* in the dashboard). Database: MongoDB Atlas (allow the host IP). Uploaded resumes are stored on local disk; use a persistent disk or move to S3-style storage for production.
