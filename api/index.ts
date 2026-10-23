import app, { initApp } from '../src/server/app.js';

export default async function handler(req: any, res: any) {
  await initApp();
  return app(req, res);
}
