import app, { initApp } from '../src/server/app.js';

export default async function handler(req: any, res: any) {
  try {
    await initApp();
  } catch (err) {
    console.error('Serverless database init error:', err);
  }

  return new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    app(req, res);
  });
}
