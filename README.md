# Comuniland — Foro Comunitario Ligero y Portable

Comuniland es una plataforma completa de foro comunitario tipo **Full-Stack**, lista para ejecutarse localmente con SQLite o desplegarse online en **Vercel** y **GitHub** con cero configuración externa de bases de datos.

---

## 1. Estructura Completa del Proyecto

```text
comuniland-foro/
├── api/
│   └── index.ts              # Función Serverless para Vercel (Express API)
├── data/
│   └── forum.sqlite          # Base de datos SQLite binaria y portable
├── uploads/                  # Directorio local donde se almacenan archivos subidos
├── src/
│   ├── assets/images/        # Avatares de estudio y recursos visuales
│   ├── components/           # Componentes modulares React 19
│   │   ├── Header.tsx        # Top Bar Contract con marca y navegación
│   │   ├── CategorySidebar.tsx# Filtros por categoría, buscador en vivo y ordenamiento
│   │   ├── ThreadCard.tsx    # Tarjetas con metadatos limpios y tipografía tabular
│   │   ├── ThreadDetail.tsx  # Vista detallada, adjuntos y respuestas anidadas
│   │   ├── NewThreadModal.tsx# Formulario de hilos, Markdown, archivos y links
│   │   ├── AuthModal.tsx     # Inicio de sesión y registro de usuarios
│   │   ├── ChangePasswordModal.tsx # Cambio obligatorio de contraseña al primer inicio
│   │   ├── UserProfileModal.tsx # Edición de biografía y avatar
│   │   └── ArchitectureDocsModal.tsx # Guía interactiva integrada en la app
│   ├── server/               # Backend Express + SQLite
│   │   ├── app.ts            # Configuración desacoplada de la app Express
│   │   ├── db.ts             # Conexión SQLite (sql.js WASM), DDL y persistencia
│   │   ├── auth.ts           # Hasheo con bcryptjs (10 salts) y tokens JWT
│   │   └── routes/
│   │       ├── auth.ts       # /api/auth (login, register, change-password)
│   │       ├── threads.ts    # /api/threads y /api/categories
│   │       ├── posts.ts      # /api/threads/:id/posts (respuestas anidadas)
│   │       ├── upload.ts     # Manejador de subida con Multer (/api/upload)
│   │       └── links.ts      # Extractor OpenGraph de URLs (/api/links)
│   ├── services/api.ts       # Cliente HTTP tipado para el frontend
│   ├── types/forum.ts        # Modelos TypeScript (User, Thread, Post, etc.)
│   ├── utils/markdown.ts     # Parser seguro de Markdown y formateador
│   ├── App.tsx               # Orquestador principal de estado y vistas
│   ├── main.tsx              # Punto de entrada de React
│   └── index.css             # Tailwind CSS v4 y tipografía Plus Jakarta Sans
├── server.ts                 # Servidor Full-Stack Express con Vite dev middleware
├── vercel.json               # Configuración de despliegue para Vercel
├── package.json              # Dependencias y scripts de ejecución
├── tsconfig.json             # Configuración TypeScript
├── vite.config.ts            # Configuración de bundler Vite
└── README.md                 # Documentación técnica completa
```

---

## 2. Cuenta Inicial de Administrador y Seguridad

Por defecto, se han eliminado todos los usuarios de demostración. Al iniciar por primera vez, el sistema cuenta únicamente con la cuenta administradora:

- **Usuario:** `admin`
- **Contraseña inicial:** `admin`

### 🔒 Cambio Obligatorio de Contraseña:
En cuanto ingreses con estas credenciales, la plataforma detectará el primer inicio de sesión y desplegará un **modal de cambio obligatorio de contraseña**:
1. Debes indicar tu nueva contraseña (mínimo 6 caracteres).
2. El sistema rechaza volver a usar `admin`.
3. Una vez guardada, la contraseña queda hasheada con **bcrypt** (10 rondas de salt) y la contraseña temporal `admin` queda invalidada permanentemente.

---

## 3. Puesta en Marcha Local

### Requisitos:
- Node.js 18+ o Node.js 20+ LTS instalado.

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/comuniland-foro.git
cd comuniland-foro

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor Full-Stack
npm run dev
```

La aplicación se ejecutará de inmediato en: **`http://localhost:3000`**

---

## 4. Instrucciones para Subir a GitHub

Ejecuta en tu terminal dentro de la carpeta del proyecto:

```bash
# 1. Inicializar git si no está inicializado
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "feat: Foro Comunitario Comuniland listo para Vercel"

# 4. Cambiar a la rama principal
git branch -M main

# 5. Conectar con tu repositorio en GitHub
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 6. Subir los archivos
git push -u origin main
```

---

## 5. Instrucciones para Desplegar en Vercel Online

El repositorio ya contiene `vercel.json` y `api/index.ts` configurados para que el frontend Vite y el backend Express funcionen juntos en Vercel:

### Método A: Desde el panel web de Vercel (Recomendado)
1. Ve a [https://vercel.com/new](https://vercel.com/new) e inicia sesión.
2. Selecciona tu repositorio de GitHub recién creado.
3. Vercel detectará automáticamente el preset **Vite**.
4. Verifica los ajustes:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Haz clic en **Deploy**. ¡Tu foro estará online en pocos segundos!

### Método B: Mediante Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 6. Pruebas Funcionales

1. **Autenticación:**
   - Inicia sesión con `admin` / `admin`.
   - Completa el cambio forzado de contraseña.
   - Cierra sesión y verifica que tu nueva contraseña es la única válida.
2. **Creación de Hilos:**
   - Haz clic en **"Nuevo Hilo"**, selecciona una categoría y redacta contenido con Markdown.
3. **Subida de Archivos:**
   - Adjunta imágenes (`.png`, `.jpg`), documentos (`.pdf`) o archivos comprimidos (`.zip`).
   - Las imágenes se muestran en una galería con opción de descarga, y los demás archivos con su peso en KB/MB.
4. **Detección de Enlaces:**
   - Comparte un enlace web (ej. `https://github.com`) y el backend extraerá favicon, título y descripción automáticamente.
