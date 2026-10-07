# AI-Powered Personalized Interview Platform: Frontend

React + Vite + Tailwind client. It talks to `../backend` over REST only.

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # http://localhost:5173
npm run build          # production bundle in dist/
```

Only public values go in `.env`. Secrets and AI keys live in the backend.

Implemented so far: register, login, protected routes, dashboard (profile completeness), profile editing with photo upload, light/dark theme, responsive sidebar layout.
