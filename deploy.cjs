const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env if available
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      try {
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (err) {
        // Continue silently if unable to parse
      }
    }
  }
}
loadEnv();

const SSH_USER = process.env.DEPLOY_SSH_USER || 'deploy_user';
const SSH_HOST = process.env.DEPLOY_SSH_HOST || 'server-ip-or-hostname';
const REMOTE_BASE = process.env.DEPLOY_REMOTE_DIR || '/home/alacor/comercial';
const SSH_TARGET = `${SSH_USER}@${SSH_HOST}`;

console.log(`🚀 Iniciando proceso de despliegue seguro a ${SSH_HOST}...`);

try {
  // 1. Build
  console.log("📦 Construyendo aplicación...");
  execSync('npm run build', { stdio: 'inherit' });

  // 1.5 Inject Cache Busting Parameter
  console.log("🔄 Inyectando token de cache...");
  const htmlPath = 'dist/index.html';
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    let ts = Date.now();
    html = html.replace(/\.css"/g, '.css?v=' + ts + '"').replace(/\.js"/g, '.js?v=' + ts + '"');
    fs.writeFileSync(htmlPath, html);
  }

  // 2. Compress dist with tar.gz (POSIX forward slashes, cross-platform)
  console.log("🗜️ Comprimiendo archivos en tar.gz...");
  execSync('tar -czf dist.tar.gz -C dist .', { stdio: 'inherit' });

  // 3. Upload tar.gz
  console.log("📤 Subiendo archivos al servidor...");
  execSync(`scp dist.tar.gz ${SSH_TARGET}:${REMOTE_BASE}/`, { stdio: 'inherit' });

  // 3.5 Upload backend chat server files
  console.log("📤 Subiendo chat-server.cjs y catalogo_rag.json al servidor...");
  execSync(`scp chat-server.cjs catalogo_rag.json ${SSH_TARGET}:${REMOTE_BASE}/chat-server/`, { stdio: 'inherit' });

  // 4. Extract cleanly and set permissions on server
  console.log("⚙️ Instalando y aplicando reemplazo atómico limpio en el servidor...");
  const serverCommand = `cd ${REMOTE_BASE} && rm -rf dist_temp && mkdir -p dist_temp && tar -xzf dist.tar.gz -C dist_temp/ && rm -rf dist && mv dist_temp dist && rm -f dist.tar.gz dist.zip && chmod 755 dist && chmod -R 755 dist/assets && find dist -type f -exec chmod 644 {} + && pm2 restart alacor-chat-server || true`;
  execSync(`ssh ${SSH_TARGET} "${serverCommand}"`, { stdio: 'inherit' });

  console.log("✅ Despliegue completado con éxito! El frontend y el chat server están sincronizados.");
} catch (error) {
  console.error("❌ Error durante el despliegue:", error.message);
  process.exit(1);
}
