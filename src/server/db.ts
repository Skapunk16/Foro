import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import bcrypt from 'bcryptjs';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'forum.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Error reading existing SQLite database, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initializeSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database to disk:', err);
  }
}

export function query<T = any>(sql: string, params: SqlValue[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function get<T = any>(sql: string, params: SqlValue[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: SqlValue[] = []): { lastInsertRowid: number; changes: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  stmt.step();
  stmt.free();

  const idRes = dbInstance.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
  const lastInsertRowid = (idRes[0]?.values[0]?.[0] as number) || 0;
  const changes = (idRes[0]?.values[0]?.[1] as number) || 0;

  saveDb();
  return { lastInsertRowid, changes };
}

function initializeSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      role TEXT DEFAULT 'member',
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      views_count INTEGER DEFAULT 0,
      pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER,
      post_id INTEGER,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS link_previews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER,
      post_id INTEGER,
      original_url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      domain TEXT NOT NULL,
      favicon_url TEXT,
      image_url TEXT,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // Safe migration check for must_change_password column
  try {
    db.run('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0');
  } catch {
    // Column already exists
  }

  // Seed default categories if table is empty
  const catCountRes = db.exec('SELECT COUNT(*) AS count FROM categories');
  const catCount = (catCountRes[0]?.values[0]?.[0] as number) || 0;

  if (catCount === 0) {
    db.run(`
      INSERT INTO categories (name, slug, description, color, icon) VALUES
      ('Desarrollo & Código', 'desarrollo', 'Discusiones técnicas sobre Node.js, React, APIs, patrones y frontend moderno.', '#0284c7', 'Code2'),
      ('Arquitectura & Bases de Datos', 'arquitectura', 'Modelado de datos, SQLite, PostgreSQL, caching y rendimiento.', '#7c3aed', 'Database'),
      ('Recursos & Tutoriales', 'recursos', 'Guías paso a paso, librerías recomendadas, libros y documentación.', '#0d9488', 'BookOpen'),
      ('Proyectos & Feedback', 'proyectos', 'Presenta tus aplicaciones comunitarias, solicita revisión y comparte avances.', '#d97706', 'Rocket'),
      ('General & Comunidad', 'general', 'Charlas informales, presentaciones de nuevos miembros y preguntas abiertas.', '#4b5563', 'MessageSquare');
    `);
  }

  // Seed ONLY admin user with password 'admin' and must_change_password = 1
  const userCountRes = db.exec('SELECT COUNT(*) AS count FROM users');
  const userCount = (userCountRes[0]?.values[0]?.[0] as number) || 0;

  if (userCount === 0) {
    const adminPassHash = bcrypt.hashSync('admin', 10);

    db.run(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'admin',
        'admin@comuniland.local',
        adminPassHash,
        '/src/assets/images/avatar_admin_lead_1792778636917.jpg',
        'Administrador de la plataforma Comuniland.',
        'admin',
        1,
      ]
    );

    // Initial welcoming thread authored by admin
    db.run(
      `INSERT INTO threads (category_id, user_id, title, content, views_count, pinned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-1 hours'))`,
      [
        1,
        1,
        '¡Bienvenidos a Comuniland! Guía de inicio y arquitectura de la plataforma',
        'Hola a toda la comunidad 👋\n\nEste foro ha sido construido desde cero como una solución ligera, portátil y autosuficiente. Está pensado para comunidades técnicas, equipos de desarrollo o foros locales que requieran:\n\n- Cero dependencias externas pesadas: Todo el almacenamiento corre sobre un archivo local SQLite mediante WebAssembly/Node, asegurando portabilidad inmediata.\n- Autenticación nativa segura: Contraseñas hasheadas con bcrypt (salt rounds: 10) y tokens de sesión.\n- Soporte enriquecido para Markdown: Bloques de código con sintaxis limpia, listas, citas y enlaces.\n- Detección inteligente de URLs: Extracción automática de metadatos (título, descripción, favicon).\n- Subida de adjuntos multipropósito: Imágenes, documentos PDF, scripts de código y archivos comprimidos.\n\nSientanse libres de participar en los comentarios o crear su propio hilo de discusión.',
        1,
        1,
      ]
    );

    // Seed link previews
    db.run(`
      INSERT INTO link_previews (thread_id, original_url, title, description, domain, favicon_url)
      VALUES
      (1, 'https://www.sqlite.org/docs.html', 'SQLite Documentation', 'Official documentation for SQLite, the most widely deployed database engine.', 'sqlite.org', 'https://www.sqlite.org/favicon.ico'),
      (1, 'https://developer.mozilla.org/', 'MDN Web Docs', 'Resources for developers, by developers. Documenting web standards including HTML, CSS, JavaScript.', 'developer.mozilla.org', 'https://developer.mozilla.org/favicon.ico');
    `);
  }
}
