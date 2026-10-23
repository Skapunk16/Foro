import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import app, { initApp } from './src/server/app.js';

dotenv.config();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize SQLite database and uploads directory
  await initApp();
  console.log('📦 SQLite database initialized successfully at /data/forum.sqlite');

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Comuniland Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
