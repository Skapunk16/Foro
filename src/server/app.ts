import express, { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { getDb } from './db.js';
import authRoutes from './routes/auth.js';
import threadRoutes from './routes/threads.js';
import postRoutes from './routes/posts.js';
import uploadRoutes, { UPLOAD_DIR } from './routes/upload.js';
import linkRoutes from './routes/links.js';

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initApp(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await getDb();
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      initialized = true;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

const app: Express = express();

// Middlewares
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// CORS & JSON Content-Type headers for API
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Static uploads serving
app.use('/uploads', express.static(UPLOAD_DIR));

// Ensure DB is initialized before handling API requests
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Only intercept API calls and uploads
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    if (!initialized) {
      try {
        await initApp();
      } catch (err: any) {
        console.error('Critical database initialization error:', err);
        res.status(500).json({
          error: 'Error al inicializar la base de datos SQLite en el servidor.',
          details: err?.message || String(err),
        });
        return;
      }
    }
  }
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
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

// Fallback 404 for unmatched API routes in JSON
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Global Error Handler guaranteeing JSON responses
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno en el servidor',
  });
});

export default app;
