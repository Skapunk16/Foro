import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();
const isVercel = Boolean(process.env.VERCEL);
export const UPLOAD_DIR = isVercel ? '/tmp/uploads' : path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage configuration with sanitized unique filename
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedOriginal);
    const base = path.basename(sanitizedOriginal, ext);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|txt|md|json|js|ts|tsx|jsx|py|html|css|sql|sh|zip|tar|gz|7z/i;
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    if (allowedExtensions.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido (.${ext}). Se aceptan imágenes, PDF, código y archivos ZIP.`));
    }
  },
});

router.post('/file', requireAuth, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se subió ningún archivo.' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    message: 'Archivo subido correctamente',
    file: {
      file_name: req.file.originalname,
      file_type: req.file.mimetype || 'application/octet-stream',
      file_size: req.file.size,
      file_url: fileUrl,
    },
  });
});

export default router;
