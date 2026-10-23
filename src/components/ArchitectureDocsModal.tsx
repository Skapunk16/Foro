import React, { useState } from 'react';
import { X, FolderTree, Terminal, ShieldCheck, Database, Copy, Check, Globe, GitBranch } from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'install' | 'vercel' | 'testing' | 'arch'>('tree');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const directoryTreeText = `comuniland-foro/
├── api/
│   └── index.ts              # Serverless Function de Vercel para la API Express
├── data/
│   └── forum.sqlite          # Base de datos SQLite binaria y portable
├── uploads/                  # Directorio local de archivos adjuntos subidos
├── src/
│   ├── assets/               # Avatares e imágenes generadas
│   ├── components/           # Componentes modulares React
│   │   ├── Header.tsx        # Top bar contract con marca y navegación
│   │   ├── CategorySidebar.tsx# Filtros, ordenamiento y buscador
│   │   ├── ThreadCard.tsx    # Tarjeta de hilo con disciplina anti-píldoras
│   │   ├── ThreadDetail.tsx  # Vista detallada, adjuntos, enlaces y comentarios
│   │   ├── NewThreadModal.tsx# Formulario de creación de hilos y subida
│   │   ├── AuthModal.tsx     # Registro, inicio de sesión de admin
│   │   ├── ChangePasswordModal.tsx # Cambio obligatorio de contraseña al primer inicio
│   │   ├── UserProfileModal.tsx # Gestión de perfil y biografía
│   │   └── ArchitectureDocsModal.tsx # Esta guía interactiva
│   ├── server/               # Lógica del backend Express + SQLite
│   │   ├── app.ts            # Configuración desacoplada de Express
│   │   ├── db.ts             # Conexión SQLite, esquemas, consultas y seeds
│   │   ├── auth.ts           # Hasheo con bcrypt, tokens JWT y middlewares
│   │   └── routes/
│   │       ├── auth.ts       # Endpoints /api/auth (login, register, change-password)
│   │       ├── threads.ts    # Endpoints /api/threads y categorías
│   │       ├── posts.ts      # Endpoints /api/threads/:id/posts (anidados)
│   │       ├── upload.ts     # Manejo de subida con Multer (/api/upload)
│   │       └── links.ts      # Extractor de metadatos OpenGraph (/api/links)
│   ├── services/
│   │   └── api.ts            # Cliente HTTP frontend tipado
│   ├── types/
│   │   └── forum.ts          # Tipos e interfaces TypeScript del dominio
│   ├── utils/
│   │   └── markdown.ts       # Parser seguro de Markdown y formateadores
│   ├── App.tsx               # Orquestador del estado y vistas
│   ├── main.tsx              # Punto de entrada React 19
│   └── index.css             # Estilos globales con Tailwind CSS v4
├── server.ts                 # Servidor Full-Stack Express con Vite dev middleware
├── vercel.json               # Configuración de rutas y funciones serverless para Vercel
├── package.json              # Dependencias y scripts de ejecución
├── tsconfig.json             # Configuración TypeScript
└── vite.config.ts            # Configuración de bundler y plugins`;

  const installCommands = `# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/comuniland-foro.git
cd comuniland-foro

# 2. Instalar dependencias
npm install

# 3. Iniciar desarrollo Full-Stack
npm run dev

# Acceso inmediato en: http://localhost:3000
# Usuario inicial: admin
# Contraseña inicial: admin (te solicitará cambiarla en el primer inicio)`;

  const vercelCommands = `# 1. Inicializar repositorio Git y subir a GitHub:
git init
git add .
git commit -m "feat: Foro Comunitario Comuniland con SQLite y autenticacion"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main

# 2. Despliegue en Vercel (Opción A: Desde el panel web):
# - Entra a https://vercel.com/new
# - Conecta tu cuenta de GitHub e importa el repositorio
# - Framework Preset: "Vite" (detectado automáticamente)
# - Build Command: npm run build
# - Output Directory: dist
# - Haz clic en "Deploy"

# 2. Despliegue en Vercel (Opción B: Mediante Vercel CLI):
npm i -g vercel
vercel`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Guía de Arquitectura, GitHub y Despliegue en Vercel
            </h2>
            <p className="text-xs text-stone-500">
              Documentación técnica completa para ejecutar localmente o desplegar online.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 text-xs font-semibold px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tree')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tree'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>1. Estructura</span>
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'install'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>2. Local</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'vercel'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3. GitHub & Vercel</span>
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'testing'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Pruebas & Admin</span>
          </button>
          <button
            onClick={() => setActiveTab('arch')}
            className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'arch'
                ? 'border-stone-900 text-stone-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>5. SQLite</span>
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-stone-800 space-y-4">
          {activeTab === 'tree' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Estructura Limpia del Proyecto Full-Stack
                </span>
                <button
                  onClick={() => handleCopy(directoryTreeText, 'tree')}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                >
                  {copiedKey === 'tree' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar árbol</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
                {directoryTreeText}
              </pre>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-base">
                Paso a Paso para Puesta en Marcha Local
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Sin configuraciones complejas de bases de datos externas. El motor SQLite se inicializa y crea automáticamente el archivo <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">/data/forum.sqlite</code> al arrancar.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Comandos de Terminal:</span>
                  <button
                    onClick={() => handleCopy(installCommands, 'cmds')}
                    className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                  >
                    {copiedKey === 'cmds' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar comandos</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
                  {installCommands}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-800" />
                <span>Despliegue Online en Vercel & Subida a GitHub</span>
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                El proyecto ya incluye el archivo <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">vercel.json</code> y el endpoint serverless en <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">api/index.ts</code> configurados para enrutar tanto la interfaz estática de Vite como la API Express sin errores.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Comandos Git y Vercel:</span>
                  <button
                    onClick={() => handleCopy(vercelCommands, 'vcmds')}
                    className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                  >
                    {copiedKey === 'vcmds' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar instrucciones</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
                  {vercelCommands}
                </pre>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-2 text-stone-700">
                <div className="font-semibold text-stone-900">¿Por qué funciona en Vercel sin errores?</div>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li><strong>Compatibilidad Serverless:</strong> En entornos Vercel, SQLite y las subidas se dirigen dinámicamente al directorio escribible <code className="font-mono">/tmp</code>.</li>
                  <li><strong>Sin compilador C++:</strong> <code className="font-mono">sql.js</code> corre en WebAssembly nativo, evitando los errores de compilación habituales de SQLite en Lambdas de Vercel.</li>
                  <li><strong>SPA Routing:</strong> Las rutas del cliente y los endpoints <code className="font-mono">/api/*</code> están separados limpiamente mediante rewrites en <code className="font-mono">vercel.json</code>.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-base">
                Pruebas de Cuenta de Administrador y Seguridad
              </h3>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2 text-amber-900">
                <div className="font-semibold text-amber-950">Acceso Inicial y Cambio Forzado de Contraseña:</div>
                <p>
                  1. Inicia sesión con el usuario <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300 font-bold">admin</code> y contraseña <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300 font-bold">admin</code>.
                </p>
                <p>
                  2. Inmediatamente se abrirá el modal de seguridad obligatorio solicitándote una nueva contraseña (mínimo 6 caracteres).
                </p>
                <p>
                  3. Una vez cambiada, la base de datos almacena el nuevo hash con 10 rondas de salt y la contraseña inicial <code className="font-mono">admin</code> queda inhabilitada permanentemente.
                </p>
              </div>

              <div className="p-3.5 border border-stone-200 rounded-lg bg-white space-y-1.5">
                <h4 className="font-semibold text-xs text-stone-900">
                  Prueba de Subida de Archivos y Enlaces
                </h4>
                <ul className="text-xs text-stone-600 space-y-1 list-disc list-inside">
                  <li>Haz clic en <strong>"Nuevo Hilo"</strong> o responde a un tema.</li>
                  <li>Haz clic en <strong>"Seleccionar archivo"</strong> para adjuntar imágenes, PDFs, scripts o archivos ZIP.</li>
                  <li>Pega un enlace como <code className="bg-stone-100 px-1">https://github.com</code> y presiona <em>Previsualizar</em> para verificar la tarjeta OpenGraph automática.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'arch' && (
            <div className="space-y-4">
              <h3 className="font-bold text-stone-900 text-base">
                Decisiones de Arquitectura y Tecnologías
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-1">
                  <div className="font-semibold text-stone-900">SQLite Portable (WASM/Native)</div>
                  <p className="text-stone-600 leading-relaxed">
                    Funciona de forma idéntica en local y en entornos serverless de Vercel gracias al runtime WebAssembly sin herramientas de compilación C++.
                  </p>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-1">
                  <div className="font-semibold text-stone-900">Seguridad Criptográfica</div>
                  <p className="text-stone-600 leading-relaxed">
                    Contraseñas procesadas con <strong>bcryptjs</strong> (10 salt rounds) y sesiones con tokens firmados JWT.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 flex justify-end bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
