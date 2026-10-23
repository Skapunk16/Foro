import express, { Express } from 'express';
import fs from 'fs';
import { getDb } from './db.js';
import authRoutes from './routes/auth.js';
import threadRoutes from './routes/threads.js';
import postRoutes from './routes/posts.js';
import uploadRoutes, { UPLOAD_DIR } from './routes/upload.js';
import linkRoutes from './routes/links.js';

let initialized = false;

export async function initApp(): Promise<void> {
  if (initialized) return;
  await getDb();
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  initialized = true;
}

const app: Express = express();

// Middlewares
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads serving
app.use('/uploads', express.static(UPLOAD_DIR));

// Ensure DB is initialized before API requests
app.use(async (_req, _res, next) => {
  if (!initialized) {
    try {
      await initApp();
    } catch (err) {
      console.error('Failed to initialize database on request:', err);
    }
  }
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    engine: 'SQLite (sql.js) + Express',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Node Server',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', threadRoutes);
app.use('/api', postRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/links', linkRoutes);

export default app;
