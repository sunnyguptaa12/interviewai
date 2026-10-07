import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

connectDB()
  .then(() => app.listen(env.port, () => console.log(`API running on port ${env.port}`)))
  .catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });
