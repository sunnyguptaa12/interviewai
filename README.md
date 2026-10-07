# AI-Powered Personalized Interview Platform

Upload a resume -> the AI detects your domain (any domain, not just software) -> personalized question folders -> practice with AI evaluation -> mock interviews -> analytics and a preparation plan.

- `backend/` - Express, MongoDB, AI service layer (see backend/README.md)
- `frontend/` - React, Vite, Tailwind, Recharts (see frontend/README.md)

Run locally: terminal 1 `cd backend && cp .env.example .env && npm install && npm run dev`; terminal 2 `cd frontend && cp .env.example .env && npm install && npm run dev`.

## Deploy for a public portfolio link

1. Push the project to a GitHub repository. Do not commit either `.env` file or any API key.
2. Create a MongoDB Atlas database and copy its connection URI. Configure network access for the hosting provider.
3. In Render, create a Blueprint from the repository and select `backend/render.yaml`. Set `MONGODB_URI`, `CLIENT_URL`, and `AI_API_KEY` in the backend service environment. The Blueprint defaults to Gemini (`gemini-3.5-flash-lite`); keep the API key server-side.
4. In Vercel, import the same repository with `frontend` as the root directory. Set `VITE_API_URL` to `https://<your-render-service>.onrender.com/api`, then deploy.
5. Once Render gives you the backend URL, set `CLIENT_URL` in Render to the Vercel site origin (for example, `https://<your-project>.vercel.app`) and redeploy/restart the backend.
6. Verify the Render health endpoint at `https://<your-render-service>.onrender.com/api/health`, then test registration, login, and one AI feature on the Vercel site.

Render and Vercel deployments require the repository to be available to those accounts. MongoDB Atlas and Gemini API free-tier quotas/availability may have limits. Resume files are stored on the backend's local disk; for a persistent public deployment, configure persistent storage or switch uploads to object storage before relying on uploaded files.
