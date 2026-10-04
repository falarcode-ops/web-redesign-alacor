/**
 * ALACOR S.A.S. - Standalone Chat Gateway Server
 * Integrates website chat widget (SSE) with Telegram Bot API (getUpdates polling).
 * Written in pure Node.js (no external npm dependencies required).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mlEngine = require('./ml-engine.cjs');

// Auto-load local environment if available
(function loadEnv() {
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
      } catch (err) {}
    }
  }
})();

const PORT = process.env.PORT || 8002;
const CONFIG_FILE = path.join(__dirname, 'chat_config.json');
const AI_CONFIG_FILE = path.join(__dirname, 'ai-config.json');
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

let subscribers = [];
function loadSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
      if (Array.isArray(data)) subscribers = data;
    } else {
      subscribers = [];
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (e) {
    console.error('Error loading subscribers:', e);
    subscribers = [];
  }
}
function saveSubscribers() {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving subscribers:', e);
  }
}
loadSubscribers();

// ── Static File Serving (serves /dist for production) ──────────────────────
const DIST_DIR = path.join(__dirname, 'dist');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.txt':  'text/plain',
  '.pdf':  'application/pdf',
};

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (e) {
    // File not found — serve index.html for SPA client-side routing
    try {
      const indexPath = path.join(DIST_DIR, 'index.html');
      const html = fs.readFileSync(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e2) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
}

// ── Rate Limiting & IP Quarantine ───────────────────────────────────────────
const clientRateLimits = {};
const bannedClients = {}; // ip -> { bannedUntil: timestamp, reason: string }

function isClientBanned(clientIp) {
  if (!bannedClients[clientIp]) return false;
  if (Date.now() > bannedClients[clientIp].bannedUntil) {
    delete bannedClients[clientIp];
    return false;
  }
  return true;
}

function banClient(clientIp, reason = 'abuse', durationMs = 15 * 60 * 1000) {
  // Never ban local development loopback IPs
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === 'localhost') {
    console.log(`[BAN IGNORED] Localhost developer IP ${clientIp} spared from quarantine.`);
    return;
  }
  bannedClients[clientIp] = {
    bannedUntil: Date.now() + durationMs,
    reason: reason
  };
  console.warn(`[BAN ENFORCED] IP ${clientIp} quarantined for ${durationMs / 60000} mins due to ${reason}.`);
}

function checkClientRateLimit(identifier, maxRequests = 25, windowMs = 30000) {
  const now = Date.now();
  if (!clientRateLimits[identifier] || now > clientRateLimits[identifier].resetAt) {
    clientRateLimits[identifier] = { count: 1, resetAt: now + windowMs };
    return { allowed: true };
  }
  clientRateLimits[identifier].count += 1;
  if (clientRateLimits[identifier].count > maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((clientRateLimits[identifier].resetAt - now) / 1000)
    };
  }
  return { allowed: true };
}

// Prune expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(clientRateLimits).forEach(id => {
    if (now > clientRateLimits[id].resetAt) delete clientRateLimits[id];
  });
}, 5 * 60 * 1000);

// Helper to sanitize & detect security violations (SQLi, XSS, Command Injections, Prompt Injections, Abuse)
function detectSecurityViolationOrOffTopic(text) {
  const input = String(text || '').trim();

  // 1. HACKING & CODE INJECTION PATTERNS
  const hackingRegex = /(select\s+.*from|union\s+select|insert\s+into|drop\s+table|delete\s+from|' OR 1=1|--|\/\*|\*\/|<script|javascript:|onerror\s*=|eval\(|exec\(|document\.cookie|\/etc\/passwd|cat\s+\/|system\(|chmod\s+|curl\s+|wget\s+|sudo\s+|powershell|cmd\.exe|base64_decode)/i;

  if (hackingRegex.test(input)) {
    return {
      violation: true,
      type: 'hacking',
      reply: '⚠️ [ALERTA DE SEGURIDAD] Se ha detectado un comando no autorizado o intento de inyección de código. Por motivos de ciberseguridad, esta sesión ha sido terminada inmediatamente.'
    };
  }

  // 2. PROMPT INJECTION & JAILBREAK PATTERNS
  const promptInjectionRegex = /(ignore\s+all\s+previous\s+instructions|olvida\s+tus\s+instrucciones|system\s+prompt|api_key|root\s+password|dan\s+mode|act[uú]a\s+como\s+(un|una)\s+terminal|dame\s+las\s+claves|mu[eé]strame\s+las\s+instrucciones|reveal\s+your\s+prompt|bypass\s+filter)/i;

  if (promptInjectionRegex.test(input)) {
    return {
      violation: true,
      type: 'jailbreak',
      reply: '⚠️ [ALERTA DE SEGURIDAD] Se ha detectado una instrucción no permitida que vulnera las políticas del asistente. La sesión ha sido finalizada.'
    };
  }

  // 3. SEVERE PROFANITY / AGGRESSION PATTERNS
  const profanityRegex = /\b(hijo\s+de\s+puta|hijueputa|malparido|gonorrea|maric[oó]n|carechimba|pendejo|est[uú]pido|idiota|mierda|perra|bastardo|imb[eé]cil|careverga|sapo\s+hp)\b/i;

  if (profanityRegex.test(input)) {
    return {
      violation: true,
      type: 'abuse',
      reply: 'Por favor mantengamos una conversación basada en el respeto. Debido al uso de lenguaje inapropiado, daremos por finalizada esta sesión de chat. ¡Que tengas un buen día!'
    };
  }

  // 4. DISCRIMINATION, RACISM & HATE SPEECH PATTERNS
  const hateSpeechRegex = /\b(negro\s+de\s+mierda|jud[ií]o\s+de\s+mierda|indio\s+hijueputa|odio\s+a\s+los\s+(venezolanos|gays|negros|indios)|muerte\s+a\s+los|raza\s+inferior)\b/i;

  if (hateSpeechRegex.test(input)) {
    return {
      violation: true,
      type: 'hate_speech',
      reply: '⚠️ [POLÍTICA DE RESPETO Y NO DISCRIMINACIÓN] En ALACOR promovemos espacios de respeto e inclusión. No toleramos expresiones discriminatorias ni discursos de odio. Esta sesión ha sido finalizada.'
    };
  }

  return { violation: false };
}

// Memory State
let config = {
  botToken: "",
  chatId: "",
  enabled: false,
  welcomeMessage: "¡Hola! Bienvenido al chat de soporte técnico de ALACOR. ¿En qué podemos ayudarte hoy?",
  accounts: []
};

let aiConfig = {
  activeModel: "fallback_chain",
  providers: []
};

// Load AI Config
function loadAiConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const data = fs.readFileSync(AI_CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(data);
      aiConfig = { ...aiConfig, ...parsed };
      if (!Array.isArray(aiConfig.providers)) {
        aiConfig.providers = [];
      }
      console.log(`[LLM GATEWAY] Loaded ${aiConfig.providers.length} LLM providers.`);
    }
  } catch (e) {
    console.error('Error loading AI config:', e);
  }
}

// ── Catalog RAG Context Builder ─────────────────────────────────────────────
function getCatalogRAGContext() {
  return `CATÁLOGO OFICIAL Y EXCLUSIVO DE PRODUCTOS ALACOR S.A.S. (REFERENCIAS REALES ACTIVAS EN EL PORTAFOLIO WEB):

1. 🧗 **TRABAJO SEGURO EN ALTURAS:**
   - **Frenos y Conectores:** **Freno Cuerda + Mosquetón Doble Seguro (Steelpro)** (freno de seguridad para cuerda 13-16mm con mosquetón de doble seguro integrado de acero forjado), **Bloque Auto-Retráctil (Steelpro)** (anticaídas retráctil con guaya de acero y mosquetón giratorio), **Tie-Off/Adaptador Anclaje Portátil 1 Argolla (Steelpro)**.
   - **Arneses Certificados:** **Arnés Dieléctrico en X con Faja Lumbar (Steelpro)** (herrajes dieléctricos recubiertos aislantes), **Arnés Cuerpo Completo Eco en H - 4 Argollas (Steelpro)**, **Arnés Rescate Industrial Expert - 7 Argollas (Steelpro)**.
   - **Eslingas y Líneas de Vida:** **Eslinga de Detención con Absorbedor de Impacto (Steelpro / Armadura)**, **Eslinga de Posicionamiento Graduable (Steelpro / Insafe)**, **Línea de Vida Vertical 16mm / 30m / 50m (Steelpro)**, **Línea de Vida Horizontal en Cinta / Cable (Orbit)**.

2. ⛑️ **PROTECCIÓN A LA CABEZA / CASCOS (ANSI Z89.1 Clase E - Dieléctrico 20.000 V):**
   - **Cascos Mineros y con Portalámparas (Minería, Túneles, Obra Subterránea y Espacios Oscuros):**
     * **CASCO TIPO I MINERO LUMINER CAPITÁN (STEELPRO)**: Casco Tipo I Clase E dieléctrico (hasta 20.000 V) con portalámparas frontal integrado para linterna o lámpara minera y soporte para cable, suspensión de alta absorción de impacto tipo cremallera/ratchet.
     * **CASCO MINERO ALA ENTERIZA CON PORTALÁMPARA (STEELPRO)** / **CASCO LUMINER ALA ENTERIZA ABS/RATCHET (STEELPRO)**: Casco Tipo I Clase E de ala ancha enteriza 360° con portalámparas frontal integrado para linterna o lámpara minera, brindando máxima protección periférica contra caídas de objetos y rayos solares/líquidos.
   - **Cascos para Trabajo en Alturas y Rescate:**
     * **CASCO MOUNTAIN ABS CON BARBUQUEJO (STEELPRO)**: Casco Tipo II Clase E dieléctrico (20.000 V) sin visera para amplio campo visual superior, barbuquejo de 4 puntos con mentonera y ajuste ratchet.
   - **Cascos para Obra Civil e Industria General:**
     * **CASCO ECO RATCHET (STEELPRO)**: Casco Tipo I Clase E con ajuste tipo ratchet.
     * **CASCO ECO CREMALLERA (STEELPRO)**: Casco Tipo I Clase E con suspensión ajustable por cremallera.
   - **Accesorios y Repuestos para Cascos:**
     * **BARBUQUEJO PARA CASCO TIPO I (STEELPRO)**, **TAFILETE RATCHET (CASCO ECO RATCHET) (STEELPRO)**, **TAFILETE PARA CASCO ECO CON CREMALLERA (STEELPRO)**, **LINTERNA SENSOR X LED (STEELPRO)**.

3. 🥾 **CALZADO INDUSTRIAL Y DIELÉCTRICO (ASTM F2413 / NTC 2257):**
   - **Dieléctricas Composite:** **Bota Cobalt Dieléctrica Composite (Steelpro)** (18.000 V, cuero graso hidrofugado), **Bota Silver Dieléctrica Composite (Steelpro)** (nobuck café), **Bota Mundial Negra Dieléctrica (Kondor)**, **Bota Quimera Dieléctrica Composite (Steelpro)**, **Bota Dieléctrica Nazca XR-09 (Steelpro)**, **Bota Bronze Café con Plantilla Kevlar (Steelpro)**.
   - **Soldador / Altas Temperaturas:** **Bota Alta Soldador Titan (Kondor)** (descalce rápido sin cordones contra chispas), **Bota Soldador Extrema (Kondor)**.
   - **PVC / Impermeables:** **Bota Cerro Seguridad PVC Amarilla (Alacor)**, **Bota Cerro Seguridad PVC Negra (Alacor)**.
   - **Seguridad General:** **Bota Master (Kondor)**, **Bota Sport Nobuck (Kondor)**, **Bota Force (Bata)**, **Bota Jumbo (Kondor)**, **Zapato Steffi (Kondor)**.

4. 🧤 **PROTECCIÓN MANUAL (GUANTES INDUSTRIALES Y SOLDADURA):**
   - **Guantes de Soldador Certificados (Steelpro):**
     * **GUANTE SOLDADOR AMARILLO - CERTIFICADO (STEELPRO)**: Cuero vacuno amarillo de alta resistencia térmica, forro interior aislante y costuras reforzadas para soldadura pesada.
     * **GUANTE SOLDADOR AZUL / NARANJA - CERTIFICADO (STEELPRO)**: Carnaza azul con refuerzo naranja en palma y puño largo de protección para antebrazo.
     * **GUANTE SOLDADOR CARNAZA NARANJA SIN REFUERZO (STEELPRO)**: Cuero carnaza suave de excelente flexibilidad y confort para soldadura general.
     * **GUANTE SOLDADOR 15" NARANJA NEGRO KEVLAR REFORZADO PALMA (STEELPRO)**: Caña extendida de 15 pulgadas, refuerzo en palma negra y costuras en hilo Kevlar ignífugo para soldadura MIG/TIG y electrodo.
   - **Guantes de Cuero y Trabajo Pesado (Nacional):**
     * **GUANTE CARNAZA REFORZADO LARGO 12CM (NACIONAL)**: Doble refuerzo en palma para abrasión severa y metalmecánica.
     * **GUANTE CARNAZA SENCILLO LARGO 12CM (NACIONAL)**: Protección estándar para desbaste y corte.
     * **GUANTE VAQUETA TIPO INGENIERO REFORZADO (NACIONAL)**: Cuero vaqueta con refuerzo en palma para obra y herramientas.
     * **GUANTE VAQUETA SUPERVISOR SENCILLO (NACIONAL)**: Gran destreza y tacto para supervisión.
   - **Guantes Sintéticos / Precisión (Steelpro):**
     * **Guante Multiflex Látex (Steelpro)**, **Guante Multiflex Nitrilo (Steelpro)**, **Guante Multiflex PU (Steelpro)**.

5. 🥽 **PROTECCIÓN VISUAL Y FACIAL (ANSI Z87.1):**
   - **Lentes de Seguridad y Variantes de Tono:**
     * **LENTE SPY FLEX (STEELPRO)** / **LENTE SPY FLEX AF (STEELPRO)**: Lente ultraligero con patillas flexibles y filtro UV400. Disponible en tonalidad **IN-OUT (Indoor/Outdoor)** especialmente diseñada para trabajadores que transitan entre interiores y exteriores (luz solar y sombra), ofreciendo una visión balanceada y descanso visual sin oscurecer en interiores ni encandilar afuera.
     * **LENTE NITRO ANTIEMPAÑANTE (STEELPRO)**: Lente ergonómico con recubrimiento antiempañante (AF) y antirrayas, alta resistencia a impactos de partículas.
     * **LENTE EVEREST (STEELPRO)**: Lente de alta cobertura envolvente con protección lateral y filtro UV.
     * **LENTE AERO AF (STEELPRO)**, **LENTE RIGEL CLARO AF (STEELPRO)**, **LENTE TOP GUN (STEELPRO)**, **LENTE WOLF HYDROFILIC PLUS (STEELPRO)**, **LENTE X5 DUAL ESPEJADO DORADO (STEELPRO)**.
   - **Caretas:** **Careta Apollo Soldador con Visor Levantable (Steelpro)**, **Careta de Esmerilar Ratchet Visor Sin Ribete Completa (Steelpro)**, **Careta Guadaña Visor Malla Ajuste Ratchet (Steelpro)**, **Careta con Visor y Ribete de Aluminio (Steelpro)**.

6. 🎧 **PROTECCIÓN AUDITIVA Y RESPIRATORIA:**
   - **Auditiva:** **Fono CM 501 (Steelpro)**, **Fono CM 502 (Steelpro)**, **Fono Zen7 HV Diadema NRR24dB (Steelpro)**, **Fono Zen7 HV para Casco NRR23dB (Steelpro)**, **Tapa Oídos Samurai / Gladiator (Steelpro)**.
   - **Respiratoria:** **Respirador M9910 con Válvula Plegable N95 (Steelpro)**.

7. 🔒 **BLOQUEO Y ETIQUETADO (LOTO & SEGURIDAD):**
   - **Bloqueadores de Breakers Eléctricos:**
     * **BLOQUEADOR BREAKER TABLERO HASTA 7MM ESPESOR (STEELPRO)**: Para tableros domiciliarios e industriales con breakers de hasta 7mm sin tornillo.
     * **BLOQUEADOR BREAKER CIRCUITO HASTA 7MM ESPESOR CON TORNILLO (STEELPRO)**: Fijación rápida con tornillo manual para breakers unipolares/multipolares de hasta 7mm.
     * **BLOQUEADOR BREAKER CIRCUITO LATERAL HASTA 20MM ESPESOR CON TORNILLO (STEELPRO)**: Para breakers de mayor dimensión hasta 20mm de espesor.
     * **BLOQUEADOR PARA BREAKER TIPO UNIÓN CON TORNILLO (STEELPRO)**: Bloqueo de breakers tipo unión o dobles.
     * **BLOQUEO DE BREAKER ELÉCTRICO >12MM (STEELPRO)**: Para breakers de gran capacidad.
     * **BLOQUEO ENCHUFE ELÉCTRICO 89X51X51MM (STEELPRO)** / **BLOQUEO PARA ENCHUFE ELÉCTRICO 178X83X83MM (STEELPRO)**.
   - **Candados, Pinzas y Accesorios LOTO:**
     * **CANDADO LOCK OUT (STEELPRO)** / **CANDADO GRILLETE CORTO ACERO (STEELPRO)** / **CANDADO GRILLETE NYLON (STEELPRO)**.
     * **PINZA LOCK OUT (STEELPRO)** (Pinza de bloqueo múltiple para hasta 6 candados).
     * **KIT TARJETA BILINGÜE NO OPERAR LOTO (STEELPRO)** / **KIT TARJETA BILINGÜE AMARILLA NO OPERAR LOTO (STEELPRO)**.
     * **CANGURO KIT LOTO ELECTRICISTA (STEELPRO)** / **KIT BLOQUEO Y ETIQUETADO, ELECTRICISTA (STEELPRO)**.
   - **Bloqueadores de Válvulas:**
     * **BLOQUEADOR DE VÁLVULA DE 25MM-165MM (STEELPRO)** / **BLOQUEADOR DE VÁLVULA DE 165MM-254MM (STEELPRO)** / **BLOQUEADOR EN ACERO PARA VÁLVULA DE BOLA (STEELPRO)** / **BLOQUEO VÁLVULA CIERRE MARIPOSA (STEELPRO)**.

8. 👕 **DOTACIÓN EMPRESARIAL ESTÁNDAR (SIN MARCACIÓN):**
   - **Camisa en Jean 7 Onzas Dama/Caballero (Nacional)**, **Chaqueta Jean Dama/Caballero (Nacional)**, **Impermeable con Cierre de Broche / Cremallera (Nacional)**, **Capuchón en Dril (Nacional)**.

9. 💡 **ILUMINACIÓN Y LINTERNAS INDUSTRIALES:**
   - **Linternas para Casco / Manos Libres:**
     * **LINTERNA SENSOR X LED (STEELPRO)**: Linterna frontal LED de alta potencia con sensor de proximidad/movimiento para encendido y apagado sin contacto. Diseñada para acoplarse directamente a los cascos mineros con portalámparas (**CASCO TIPO I MINERO LUMINER CAPITÁN** y **CASCO MINERO ALA ENTERIZA CON PORTALÁMPARA**) o montarse sobre cualquier casco de seguridad mediante banda elástica ajustable.

10. 📋 **SERVICIOS DE ASESORÍA E IMPLEMENTACIÓN SG-SST (RESOLUCIÓN 0312 DE 2019):**
    - **Módulo de Autodiagnóstico 0312:** Herramienta interactiva disponible en nuestra plataforma web (sección **Servicios SG-SST** / botón **Realizar Diagnóstico 0312**) que evalúa en 4 pasos el nivel de cumplimiento de los Estándares Mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo según la Resolución 0312 de 2019 (Grupo A: 7 estándares, Grupo B: 21 estándares, Grupo C: 60 estándares).
    - **Acompañamiento Profesional e Implementación:** Asesoría personalizada por especialistas en SST para diseñar, estructurar, auditar y mantener el SG-SST en micro, pequeñas y medianas empresas, con acceso al **Portal Clientes SG-SST**.`;
}
loadAiConfig();

// Save AI Config
function saveAiConfig() {
  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(aiConfig, null, 2), 'utf8');
    console.log('AI Configuration saved.');
  } catch (e) {
    console.error('Error saving AI config:', e);
  }
}

// ── Resilient LLM Gateway Execution Engine ─────────────────────────────────────
function executeLlmsWithFallback(systemPrompt, messagesOrPrompt) {
  return new Promise(async (resolve, reject) => {
    const activeProviders = (aiConfig.providers || [])
      .filter(p => p.enabled && p.apiKey)
      .sort((a, b) => (Number(a.priority) || 1) - (Number(b.priority) || 1));

    if (activeProviders.length === 0) {
      return reject(new Error('No active LLM providers configured.'));
    }

    let lastError = null;

    for (const provider of activeProviders) {
      try {
        console.log(`[LLM GATEWAY] Attempting Provider: ${provider.name} (${provider.provider} - ${provider.model}) Priority #${provider.priority}`);
        const responseText = await callSingleLlmProvider(provider, systemPrompt, messagesOrPrompt);
        
        provider.lastUsed = new Date().toISOString();
        provider.status = 'LISTO';
        
        return resolve({ text: responseText, providerUsed: provider.name });
      } catch (err) {
        lastError = err;
        provider.errorCount = (provider.errorCount || 0) + 1;
        const errCode = err.statusCode || (err.message.includes('429') ? 429 : 500);
        const errDetail = errCode === 429 ? '429 | SIN SALDO / LIMITE CUOTA' : (err.message || 'Error de conexión');
        provider.status = `⚠️ ${provider.errorCount} ERR (${errDetail})`;
        provider.lastError = err.message;
        console.error(`[LLM GATEWAY] Provider ${provider.name} failed: ${err.message}. Failing over to next provider...`);
      }
    }

    reject(new Error(`All ${activeProviders.length} LLM providers failed. Last error: ${lastError ? lastError.message : 'Unknown'}`));
  });
}

function callSingleLlmProvider(prov, systemPrompt, messagesOrPrompt) {
  return new Promise((resolve, reject) => {
    const type = (prov.provider || 'OPENAI').toUpperCase();
    let rawModel = prov.model || (type === 'GEMINI' ? 'gemini-2.0-flash' : 'gpt-4o-mini');
    if (type === 'GEMINI' && (rawModel.includes('2.5') || rawModel === 'gemini-2.5-flash')) {
      rawModel = 'gemini-2.0-flash';
    }
    const model = rawModel;
    const temp = Number(prov.temperature) || 0.5;

    // Normalize messages array
    let formattedMessages = [];
    if (Array.isArray(messagesOrPrompt)) {
      formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messagesOrPrompt
      ];
    } else {
      formattedMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: String(messagesOrPrompt) }
      ];
    }
    const plainUserText = Array.isArray(messagesOrPrompt)
      ? messagesOrPrompt.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n\n')
      : String(messagesOrPrompt);

    if (type === 'GEMINI') {
      const payload = JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nConsulta del usuario:\n${userPrompt}` }] }
        ],
        generationConfig: { temperature: temp, maxOutputTokens: 800 }
      });
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${prov.apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      };
      const req = https.request(options, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
              resolve(data.candidates[0].content.parts[0].text.trim());
            } else {
              const err = new Error(data.error?.message || `HTTP ${res.statusCode}: ${body.slice(0, 150)}`);
              err.statusCode = res.statusCode;
              reject(err);
            }
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Gemini API request timeout (8s)'));
      });
      req.write(payload);
      req.end();
    } else if (type === 'CLAUDE') {
      const payload = JSON.stringify({
        model: model || 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      const options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': prov.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      const req = https.request(options, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && data.content && data.content[0]?.text) {
              resolve(data.content[0].text.trim());
            } else {
              const err = new Error(data.error?.message || `HTTP ${res.statusCode}: ${body.slice(0, 150)}`);
              err.statusCode = res.statusCode;
              reject(err);
            }
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Claude API request timeout (8s)'));
      });
      req.write(payload);
      req.end();
    } else {
      // OPENAI or GITHUB or GROQ (detected by gsk_ key prefix) or CUSTOM OpenAI-compatible endpoint
      let hostname = 'api.openai.com';
      let path = '/v1/chat/completions';
      
      if (type === 'GITHUB') {
        hostname = 'models.inference.ai.azure.com';
        path = '/chat/completions';
      } else if (prov.apiKey.startsWith('gsk_')) {
        hostname = 'api.groq.com';
        path = '/openai/v1/chat/completions';
      }

      const payload = JSON.stringify({
        model: model,
        temperature: temp,
        messages: formattedMessages
      });
      const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${prov.apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'ALACOR-Chat-Gateway/1.4'
        }
      };
      const req = https.request(options, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && data.choices && data.choices[0]?.message?.content) {
              const cleanedContent = data.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              resolve(cleanedContent);
            } else {
              const err = new Error(data.error?.message || `HTTP ${res.statusCode}: ${body.slice(0, 150)}`);
              err.statusCode = res.statusCode;
              reject(err);
            }
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('LLM Gateway request timeout (8s)'));
      });
      req.write(payload);
      req.end();
    }
  });
}

const CRM_DB_FILE = process.env.CRM_DB_PATH || (
  process.platform === 'win32'
    ? 'C:\\Users\\Acer\\Documents\\Mis Documetos\\Developer\\AI\\CRM_AlaCor\\crm_interactions.jsonl'
    : path.join(__dirname, 'CRM_AlaCor', 'crm_interactions.jsonl')
);

function logToCrm(eventType, sessionId, payload) {
  // Requirement 3: Only persist leads/interactions, avoid empty passive session_start entries
  if (eventType === 'session_start') {
    return;
  }
  try {
    const dir = path.dirname(CRM_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const entry = {
      timestamp: new Date().toISOString(),
      eventType,
      sessionId,
      payload
    };
    fs.appendFileSync(CRM_DB_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    console.error('Error logging to CRM database:', e);
  }
}

// Mappings
const clients = {}; // sessionId -> HTTP Response Object (SSE stream)
const messageMappings = {}; // telegramMessageId -> sessionId
const sessions = {}; // sessionId -> { humanTransferred: boolean, userName: string, history: Array, createdAt, lastActivity, hasUserMessages }
let lastUpdateId = 0;

// Helper to purge completely stale sessions silently (24h idle)
function purgeSession(sessionId, reason = 'manual') {
  if (sessions[sessionId]) {
    const clientRes = clients[sessionId];
    if (clientRes) {
      try { clientRes.end(); } catch (e) {}
      delete clients[sessionId];
    }
    delete sessions[sessionId];
    console.log(`[SESSION PURGE] Session ${sessionId} purged (${reason}). Memory released.`);
    return true;
  }
  return false;
}

// Background cleanup for abandoned sessions after 24 hours of inactivity (Silent)
setInterval(() => {
  const now = Date.now();
  const INACTIVITY_TIMEOUT_24H = 24 * 60 * 60 * 1000;

  Object.keys(sessions).forEach((sId) => {
    const s = sessions[sId];
    if (s) {
      const isStale = (now - (s.lastActivity || s.createdAt || now)) > INACTIVITY_TIMEOUT_24H;
      if (isStale) {
        purgeSession(sId, 'stale_24h_cleanup');
      }
    }
  });
}, 60 * 60 * 1000); // Check once an hour

// ── Coralis CRM Transfer Ingestion HTTP Dispatcher ──────────────────────────
const CORALIS_CRM_HOST = process.env.CORALIS_CRM_HOST || '127.0.0.1';
const CORALIS_CRM_PORT = process.env.CORALIS_CRM_PORT ? parseInt(process.env.CORALIS_CRM_PORT, 10) : 8008;

function sendTransferToCoralisCrm(sessionId, reason = 'Solicitud de Asesor Humano', extraInfo = {}) {
  try {
    const session = sessions[sessionId] || {};
    const rawHistory = session.history || [];
    
    const historyFormatted = rawHistory.map(h => ({
      sender_name: h.sender === 'user' ? (session.userName || extraInfo.name || 'Visitante') : (h.sender === 'agent' || h.sender === 'advisor' ? (h.agentName || extraInfo.advisorName || 'Asesor ALACOR') : 'Bot ALACOR'),
      message_text: h.text || '',
      sent_at: new Date(h.timestamp || Date.now()).toISOString()
    }));

    const payload = JSON.stringify({
      sessionId: sessionId || 'anon',
      visitorName: session.userName || extraInfo.name || 'Visitante',
      visitorEmail: extraInfo.email || session.userEmail || '',
      visitorPhone: extraInfo.phone || extraInfo.contact || session.userPhone || '',
      reason: reason || 'Solicitud de Asesor Humano',
      history: historyFormatted
    });

    const options = {
      hostname: CORALIS_CRM_HOST,
      port: CORALIS_CRM_PORT,
      path: '/api/bot-sessions/transfer-to-human',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[CORALIS CRM INGESTION] Session ${sessionId} synced with Coralis CRM (${CORALIS_CRM_HOST}:${CORALIS_CRM_PORT}). Code: ${res.statusCode}`);
      });
    });

    req.on('error', (err) => {
      console.error(`[CORALIS CRM INGESTION] Error posting to http://${CORALIS_CRM_HOST}:${CORALIS_CRM_PORT}/api/bot-sessions/transfer-to-human:`, err.message);
    });

    req.write(payload);
    req.end();
  } catch (e) {
    console.error('[CORALIS CRM INGESTION] Exception during transfer dispatch:', e.message);
  }
}

// ── Lead Identity and Validation Helpers ─────────────────────────────────────
function isDummyEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  const dummyPrefixes = [
    'micorreo', 'micuenta', 'correo', 'email', 'test', 'prueba', 'ejemplo', 'fake', 
    'asdf', 'qwerty', '123456', 'anonimo', 'algo', 'user', 'admin', 'sinemail', 
    'noemail', 'noreply', 'dummy', 'null', 'none', 'abc', 'xxx', 'usuario', 'mail', 'contacto'
  ];
  const dummyDomains = [
    'ejemplo.com', 'example.com', 'test.com', 'prueba.com', 'correo.com', 
    'email.com', 'fake.com', 'asdf.com', 'temp.com', '123.com', 'mail.com'
  ];
  
  const parts = lower.split('@');
  if (parts.length !== 2) return true;
  const [user, domain] = parts;
  if (!user || !domain) return true;
  
  if (dummyPrefixes.some(p => user === p || user.startsWith(p + '.') || user.startsWith(p + '_') || user.startsWith(p + '-'))) {
    return true;
  }
  if (dummyDomains.includes(domain)) {
    return true;
  }
  return false;
}

function isDummyPhone(phone) {
  if (!phone || typeof phone !== 'string') return true;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return true;
  if (/^(\d)\1+$/.test(digits)) return true; // 1111111111, 0000000000
  if (digits === '1234567890' || digits === '0123456789' || digits === '1234567' || digits === '9876543210') return true;
  return false;
}

const INVALID_NAME_WORDS = new Set([
  'hola', 'buenos', 'dias', 'tardes', 'noches', 'cordial', 'saludo', 'saludos',
  'necesito', 'busco', 'requiero', 'quiero', 'quisiera', 'cotizar', 'cotizacion', 'comprar', 'precio', 'costo', 'cuanto', 'vale',
  'saber', 'venden', 'tienen', 'disponen', 'favor', 'ayuda', 'informacion', 'info', 'catalogo', 'consulta', 'asesor', 'humano',
  'kit', 'derrame', 'derrames', 'litros', 'galones', 'guante', 'guantes', 'casco', 'cascos', 'bota', 'botas', 'arnes', 'eslingas',
  'lente', 'lentes', 'respirador', 'mascarilla', 'filtro', 'cartucho', 'calzado', 'overol', 'chaleco', 'cono', 'cintas', 'cinta',
  'punto', 'puntos', 'caneca', 'canecas', 'extintor', 'extintores', 'camilla', 'camillas', 'dielectrico', 'seguridad', 'industrial',
  'epp', 'proteccion', 'dotacion', 'talla', 'ficha', 'tecnica', 'persona', 'natural', 'empresa', 'gracias', 'si', 'no', 'bien', 'bueno',
  'mi', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'este', 'esta', 'es', 'son', 'de', 'del', 'para', 'con', 'por', 'en',
  'telefono', 'tel', 'celular', 'cel', 'numero', 'num', 'whatsapp', 'correo', 'email', 'mail', 'contacto'
]);

function isValidPersonName(str) {
  if (!str) return false;
  const clean = str.trim().replace(/^[.,;:\-]+|[.,;:\-]+$/g, '').trim();
  if (clean.length < 2 || clean.length > 45) return false;

  const words = clean.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-záéíóúñ]/gi, ''));
  if (words.length === 0 || words.length > 5) return false;

  // If ANY word in the candidate is a common query/product/greeting/preposition/contact word, it's NOT a person's name
  for (const w of words) {
    if (INVALID_NAME_WORDS.has(w)) {
      return false;
    }
  }

  // Must only contain letters, spaces, hyphens, and periods
  if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s.\-]+$/.test(clean)) return false;

  return true;
}

function cleanCompany(str) {
  if (!str) return null;
  let clean = str.trim()
    .replace(/(?:mi\s+)?(?:tel[eé]fono|celular|cel|whatsapp|n[uú]mero|num|correo|email|mail|contacto)\s*(?:es|:)?\s*$/i, '')
    .replace(/^[.,;:\-]+|[.,;:\-]+$/g, '')
    .trim();
  return clean.length >= 2 ? clean : null;
}

function parseLeadIdentity(text) {
  let name = null;
  let company = null;
  let email = null;
  let phone = null;
  let clientType = 'NATURAL';
  let hasDummyContact = false;

  // 1. Extract email
  const emailMatch = text.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch) {
    const rawEmail = emailMatch[1].trim();
    if (isDummyEmail(rawEmail)) {
      hasDummyContact = true;
    } else {
      email = rawEmail;
    }
  }

  // 2. Extract phone (Colombia 10-digit mobile starting with 3 or landline with area code)
  const phoneMatch = text.match(/(?:\+?57\s*)?(?:3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b3\d{9}\b)/);
  if (phoneMatch) {
    const rawPhone = phoneMatch[0].trim();
    if (isDummyPhone(rawPhone)) {
      hasDummyContact = true;
    } else {
      phone = rawPhone;
    }
  }

  // Clean email and phone from text to isolate name & company
  let textClean = text;
  if (emailMatch) textClean = textClean.replace(emailMatch[0], '');
  if (phoneMatch) textClean = textClean.replace(phoneMatch[0], '');

  // Strip contact intro labels (e.g. "mi telefono es", "cel:", "correo:")
  textClean = textClean.replace(/(?:(?:mi\s+)?(?:tel[eé]fono|celular|cel|whatsapp|n[uú]mero|num|correo|email|mail|contacto)\s*(?:es|:)?)/gi, ' ');

  // Check labeled fields first (e.g. "Nombre: Alejandro Martinez", "Empresa: Lacteos del Sur")
  const labeledName = textClean.match(/(?:nombre|contacto|cliente)\s*:\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s.\-]+?)(?=[,\n;]|empresa|tel|cel|correo|$)/i);
  if (labeledName && isValidPersonName(labeledName[1])) {
    name = labeledName[1].trim();
  }

  const labeledCompany = textClean.match(/(?:empresa|compania|compañía|razon social|razón social)\s*:\s*([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s.\-&]+?)(?=[,\n;]|tel|cel|correo|$)/i);
  if (labeledCompany) {
    const c = cleanCompany(labeledCompany[1]);
    if (c) {
      company = c;
      clientType = 'JURIDICA';
    }
  }

  // Explicit introductions: "Soy Carlos Gomez", "Mi nombre es Alejandro Martinez de Lacteos del Sur"
  if (!name) {
    const introMatch = textClean.match(/(?:mi nombre es|me llamo|soy|aqu[ií] habla|de parte de)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s.\-]+?)(?:\s+(?:de|trabajo en|para la empresa|de la empresa|desde|con)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s.\-&]+))?(?:[,\n;]|$)/i);
    if (introMatch) {
      const candName = introMatch[1].trim();
      if (isValidPersonName(candName)) {
        name = candName;
        if (introMatch[2]) {
          const c = cleanCompany(introMatch[2]);
          if (c) {
            company = c;
            clientType = 'JURIDICA';
          }
        }
      }
    }
  }

  // Structured name + company pattern when contact info (phone/email) is provided
  // e.g. "Alejandro Martinez de Lacteos del Sur Ltda"
  if (!name && (phone || email)) {
    const deCompanyMatch = textClean.trim().match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ\s.\-]+?)\s+(?:de|de la empresa|trabajo en|para)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s.\-&]+)$/i);
    if (deCompanyMatch && isValidPersonName(deCompanyMatch[1])) {
      name = deCompanyMatch[1].trim();
      const c = cleanCompany(deCompanyMatch[2]);
      if (c) {
        company = c;
        clientType = 'JURIDICA';
      }
    } else {
      // Tokens separated by comma or newline: "Alejandro Martinez, Lacteos del Sur"
      const tokens = textClean.split(/[\n,;]+/).map(t => t.trim()).filter(t => t.length >= 2);
      if (tokens.length >= 1 && isValidPersonName(tokens[0])) {
        name = tokens[0].trim();
        if (tokens.length >= 2) {
          const candComp = cleanCompany(tokens[1].replace(/^(?:de|empresa|de la empresa|trabajo en|para)\s+/i, ''));
          if (candComp && !INVALID_NAME_WORDS.has(candComp.toLowerCase())) {
            company = candComp;
            clientType = 'JURIDICA';
          }
        }
      }
    }
  }

  // If company has legal/corporate indicators
  if (company && /(?:sas|s\.a\.s|ltda|s\.a|inc|corp|ingenieria|constructora|empresa|industria|servicios|inversiones)/i.test(company)) {
    clientType = 'JURIDICA';
  }

  return { name, company, email, phone, clientType, hasDummyContact };
}

// ── Close / Call / Keep Waiting Request Helpers ──────────────────────────────
function isCloseChatRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[.,;!?¡¿\-]/g, ' ');
  const patterns = [
    /\bno\s+(?:deseo|quiero|voy\s+a)\s+continuar\b/,
    /\b(?:finalizar|cerrar|terminar|cancelar)\s+(?:la\s+)?(?:consulta|chat|conversaci[oó]n|sesi[oó]n|atenci[oó]n)\b/,
    /\bno\s+(?:deseo|quiero|necesito)\s+(?:m[aá]s)?\s*(?:ayuda|asesor[ií]a|informaci[oó]n|atenci[oó]n)\b/,
    /\b(?:ya\s+no|no\s+m[aá]s)\b/,
    /\bno\s+gracias\b/,
    /\bdejar\s+as[ií]\b/,
    /\bme\s+tengo\s+que\s+ir\b/,
    /\b(?:hasta\s+luego|chao|adi[oó]s)\b/
  ];
  return patterns.some(p => p.test(clean));
}

function isCallRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[.,;!?¡¿\-]/g, ' ');
  const patterns = [
    /\b(?:deseo|solicitar|prefiero|quiero|favor|pueden)?\s*(?:que\s+me\s+)?(?:llamen|llamada|llamar|contacto\s+telef[oó]nico)\b/,
    /\bprefiero\s+(?:llamada|tel[eé]fono|que\s+me\s+llamen)\b/,
    /\bll[aá]menme\b/,
    /\bcomun[ií]quense\s+por\s+tel[eé]fono\b/
  ];
  return patterns.some(p => p.test(clean));
}

function isKeepWaitingRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.toLowerCase().trim().replace(/[.,;!?¡¿\-]/g, ' ');
  const patterns = [
    /\b(?:deseo|prefiero|voy\s+a|quiero)?\s*(?:seguir|continuar)?\s*esperando\b/,
    /\besperar\s+en\s+el\s+chat\b/,
    /\bespero\s+aqu[ií]\b/,
    /\bsigo\s+esperando\b/
  ];
  return patterns.some(p => p.test(clean));
}

function escapeTelegramHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Execute Centralized Human Transfer (Telegram + Coralis CRM) ──────────────
function executeHumanTransfer(sessionId, userName, reason = 'Solicitud de Asesor Humano') {
  if (!sessionId) return;
  const session = sessions[sessionId] || { history: [] };
  session.humanTransferred = true;
  session.transferTime = Date.now();
  session.advisorAnswered = false;
  session.lastAdvisorResponseTime = null;
  session.queueStage = 0;
  session.queueClosed = false;
  if (userName) session.userName = userName;

  console.log(`[HUMAN TRANSFER] Executing transfer for session ${sessionId} (${session.userName || 'Visitante'}) - Reason: ${reason}`);

  // 1. Ingest transfer to Coralis CRM (Port 8008)
  sendTransferToCoralisCrm(sessionId, reason, {
    name: session.contactName || session.userName,
    company: session.companyName,
    email: session.userEmail,
    phone: session.userPhone
  });

  // 2. Dispatch to Telegram
  const hasAccounts = config.accounts && config.accounts.some(acc => acc.enabled && acc.chatId);
  if (config.enabled && config.botToken && (config.chatId || hasAccounts)) {
    const rawHistory = session.history || [];
    let historyHtml = '';
    if (rawHistory.length > 0) {
      const filtered = rawHistory.filter(h => {
        const text = h.text || '';
        return !(h.sender !== 'user' && (text.includes('Bienvenido') || text.includes('portal de atención')));
      });
      historyHtml = filtered.map(h => {
        const senderLabel = h.sender === 'user' ? `👤 <b>${escapeTelegramHtml(session.userName || 'Cliente')}</b>` : `🤖 <b>Bot</b>`;
        const cleanRaw = (h.text || '')
          .replace(/\[SET_PROFILE:[^\]]+\]/g, '')
          .replace(/\[IR_DIAGNOSTICO_0312\]/g, '')
          .replace(/\[TRANSFERIR_ASESOR\]/g, '')
          .trim();
        return `${senderLabel}:\n${escapeTelegramHtml(cleanRaw)}`;
      }).join('\n\n');
    } else {
      historyHtml = '<i>(Sin historial previo)</i>';
    }

    let targetChatId = session.chatId;
    let targetAccountName = session.accountName || '';
    if (!targetChatId) {
      const activeAccounts = (config.accounts || []).filter(a => a.enabled && a.chatId);
      if (activeAccounts.length > 0) {
        activeAccounts.sort((a, b) => Number(a.priority) - Number(b.priority));
        targetChatId = activeAccounts[0].chatId;
        targetAccountName = activeAccounts[0].name;
        session.chatId = targetChatId;
        session.accountName = targetAccountName;
      } else if (config.chatId && config.enabled) {
        targetChatId = config.chatId;
      }
    }

    if (targetChatId) {
      logToCrm('chat_transfer', sessionId, { userName: session.userName || 'Visitante', targetAccountName, targetChatId });
      const clientDetails = [
        session.contactName ? `👤 <b>Contacto:</b> ${escapeTelegramHtml(session.contactName)}` : '',
        session.companyName ? `🏢 <b>Empresa:</b> ${escapeTelegramHtml(session.companyName)}` : '',
        session.userEmail ? `📧 <b>Correo:</b> ${escapeTelegramHtml(session.userEmail)}` : '',
        session.userPhone ? `📱 <b>Teléfono:</b> ${escapeTelegramHtml(session.userPhone)}` : ''
      ].filter(Boolean).join('\n');

      const alertHtml = `🔄 <b>[TRASPASO DE CHAT - ASESOR REQUERIDO]</b>\n` +
                        (targetAccountName ? `Canal: <b>${escapeTelegramHtml(targetAccountName)}</b>\n` : '') +
                        `Cliente: <b>${escapeTelegramHtml(session.userName || 'Visitante')}</b> (<code>${escapeTelegramHtml(sessionId)}</code>)\n` +
                        (clientDetails ? `${clientDetails}\n\n` : '\n') +
                        `<b>Historial de la conversación:</b>\n${historyHtml}\n\n` +
                        `💬 <i>Responda directamente a este mensaje en Telegram para hablar con el cliente en la web.</i>`;

      makeTelegramRequest('sendMessage', {
        chat_id: targetChatId,
        text: alertHtml,
        parse_mode: 'HTML'
      })
      .then(tgMsg => {
        if (tgMsg && tgMsg.message_id) {
          messageMappings[tgMsg.message_id] = sessionId;
        }
        console.log(`[TELEGRAM TRANSFER] Alert sent to Telegram. MessageId: ${tgMsg ? tgMsg.message_id : 'N/A'} to ChatId: ${targetChatId}`);
      })
      .catch(err => {
        console.error('[TELEGRAM TRANSFER] HTML format rejected, retrying with plain text:', err.message);
        const plainAlert = `[TRASPASO DE CHAT - ASESOR REQUERIDO]\n` +
                           `Cliente: ${session.userName || 'Visitante'} (${sessionId})\n` +
                           `Contacto: ${session.contactName || ''}\nEmpresa: ${session.companyName || ''}\nTel: ${session.userPhone || ''}\nCorreo: ${session.userEmail || ''}\n\n` +
                           `Historial:\n` + rawHistory.map(h => `${h.sender === 'user' ? 'Cliente' : 'Bot'}: ${h.text}`).join('\n') + `\n\nResponda para hablar con el cliente.`;
        makeTelegramRequest('sendMessage', {
          chat_id: targetChatId,
          text: plainAlert
        })
        .then(tgMsg => {
          if (tgMsg && tgMsg.message_id) {
            messageMappings[tgMsg.message_id] = sessionId;
          }
          console.log(`[TELEGRAM TRANSFER] Plain text fallback alert sent to Telegram. MessageId: ${tgMsg ? tgMsg.message_id : 'N/A'}`);
        })
        .catch(plainErr => console.error('[TELEGRAM TRANSFER] Critical error sending alert:', plainErr.message));
      });
    }
  }
}

function pushAndBroadcastQueueMessage(sessionId, text) {
  const session = sessions[sessionId];
  if (!session) return;

  const msgPayload = {
    sender: 'bot',
    text: text,
    timestamp: Date.now(),
    systemEvent: 'queue_update'
  };

  session.history.push(msgPayload);
  session.lastActivity = Date.now();

  const clientRes = clients[sessionId];
  if (clientRes) {
    console.log(`[QUEUE WATCHDOG -> WEB] (${sessionId}) Broadcasted feedback: ${text}`);
    clientRes.write(`data: ${JSON.stringify(msgPayload)}\n\n`);
  } else {
    console.log(`[QUEUE WATCHDOG] Client ${sessionId} offline, feedback buffered in history.`);
  }

  logToCrm('queue_feedback', sessionId, { text, stage: session.queueStage });
}

// Advisor Response Queue Watchdog (runs every 5 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of Object.entries(sessions)) {
    if (!session.humanTransferred || session.advisorAnswered || session.queueClosed || !session.transferTime) {
      continue;
    }

    const elapsedMs = now - session.transferTime;
    const elapsedMinutes = elapsedMs / 60000;

    // Stage 1: 3 Minutes elapsed (180s) without advisor response
    if (elapsedMinutes >= 3 && (!session.queueStage || session.queueStage === 0)) {
      session.queueStage = 1;
      const queueMsg = "Nuestros asesores se encuentran atendiendo a otros clientes en este momento. Por favor espera un momento en línea, te atenderemos en breve.";
      pushAndBroadcastQueueMessage(sessionId, queueMsg);
    }
    // Stage 2: 6 Minutes elapsed (360s = 3 min after Stage 1) without advisor response
    else if (elapsedMinutes >= 6 && session.queueStage === 1) {
      session.queueStage = 2;
      const queueMsg = "Nuestros asesores continúan ocupados con otras consultas. Agradecemos tu paciencia, en breve responderemos a tu solicitud.";
      pushAndBroadcastQueueMessage(sessionId, queueMsg);
    }
    // Stage 3: 9 Minutes elapsed (540s = 3 min after Stage 2) without advisor response
    else if (elapsedMinutes >= 9 && session.queueStage === 2) {
      session.queueStage = 3;
      const phoneStr = session.userPhone ? ` al número ${session.userPhone}` : '';
      const queueMsg = `Nuestros asesores continúan ocupados en este momento. Hemos registrado todos tus datos y tu solicitud.\n\nPor favor indícanos cómo prefieres continuar:\n\n[OPCIONES_COLA_FINAL]`;
      pushAndBroadcastQueueMessage(sessionId, queueMsg);
    }
  }
}, 5000);

// Pruning interval for memory mapping (every 12 hours)
setInterval(() => {
  const keys = Object.keys(messageMappings);
  if (keys.length > 5000) {
    keys.slice(0, keys.length - 2500).forEach(k => delete messageMappings[k]);
  }
}, 12 * 60 * 60 * 1000);

// Load Config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(data);
      config = { ...config, ...parsed };
      
      // Migrate legacy config if accounts array doesn't exist
      if (!config.accounts || config.accounts.length === 0) {
        if (config.chatId) {
          config.accounts = [{
            id: 'legacy-default',
            name: 'Canal Principal',
            chatId: config.chatId,
            priority: 1,
            enabled: true
          }];
        } else {
          config.accounts = [];
        }
      }
      console.log('Configuration loaded successfully.');
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
}
loadConfig();

// Save Config
function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('Configuration saved.');
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

// JSON Parser Helper
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB limit to prevent buffer exhaustion
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > MAX_PAYLOAD_BYTES) {
        req.destroy();
        return reject(new Error('Payload Too Large: Maximum allowed request size is 64KB.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Telegram HTTPS Helper
function makeTelegramRequest(method, payload) {
  return new Promise((resolve, reject) => {
    if (!config.botToken) {
      return reject(new Error('Telegram Bot Token not configured'));
    }

    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${config.botToken}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.ok) {
            resolve(json.result);
          } else {
            reject(new Error(json.description || 'Telegram API Error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', err => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Telegram request timeout'));
    });

    req.write(data);
    req.end();
  });
}

// Telegram Polling Loop (getUpdates)
function pollTelegram() {
  const hasAccounts = config.accounts && config.accounts.some(acc => acc.enabled && acc.chatId);
  if (!config.enabled || !config.botToken || (!config.chatId && !hasAccounts)) {
    setTimeout(pollTelegram, 3000);
    return;
  }

  const payload = {
    offset: lastUpdateId + 1,
    limit: 5,
    timeout: 1,
    allowed_updates: ['message']
  };

  makeTelegramRequest('getUpdates', payload)
    .then(updates => {
      if (updates && updates.length > 0) {
        for (const update of updates) {
          lastUpdateId = update.update_id;

          const msg = update.message;
          if (!msg) continue;

          // Check if message is in our configured chat/group
          const chatIdStr = String(msg.chat.id);
          const legacyChatIdStr = config.chatId ? String(config.chatId) : '';
          
          let isConfiguredChat = false;
          if (legacyChatIdStr && (chatIdStr === legacyChatIdStr || chatIdStr.endsWith(legacyChatIdStr) || legacyChatIdStr.endsWith(chatIdStr))) {
            isConfiguredChat = true;
          } else {
            const matchedAccount = (config.accounts || []).find(acc => {
              if (!acc.enabled || !acc.chatId) return false;
              const targetChatIdStr = String(acc.chatId);
              return chatIdStr === targetChatIdStr || chatIdStr.endsWith(targetChatIdStr) || targetChatIdStr.endsWith(chatIdStr);
            });
            if (matchedAccount) {
              isConfiguredChat = true;
            }
          }

          if (!isConfiguredChat) {
            continue; // Not for any of our groups
          }

          // Resolve target sessionId for this Telegram message
          let targetSessionId = null;

          // 1. Direct reply to a specific Telegram message
          if (msg.reply_to_message) {
            const repliedMsgId = msg.reply_to_message.message_id;
            targetSessionId = messageMappings[repliedMsgId];
          }

          // 2. If not a reply, find the most recently active session assigned to this chat or humanTransferred
          if (!targetSessionId) {
            const sessionList = Object.entries(sessions)
              .filter(([sId, s]) => s.humanTransferred || s.chatId === chatIdStr)
              .sort((a, b) => (b[1].lastActivity || 0) - (a[1].lastActivity || 0));

            if (sessionList.length > 0) {
              targetSessionId = sessionList[0][0];
            } else {
              // Fallback to most active session overall
              const allSessions = Object.entries(sessions)
                .sort((a, b) => (b[1].lastActivity || 0) - (a[1].lastActivity || 0));
              if (allSessions.length > 0) {
                targetSessionId = allSessions[0][0];
              }
            }
          }

          if (targetSessionId) {
            const replyText = msg.text || msg.caption || "[Mensaje multimedia/archivo]";
            const agentName = msg.from ? `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() : 'Asesor Comercial';
            
            // Send message to active SSE client connection
            const clientRes = clients[targetSessionId];
            const msgPayload = { sender: 'agent', text: replyText, agentName, timestamp: Date.now() };

            // Persist message in session history
            if (sessions[targetSessionId]) {
              sessions[targetSessionId].history.push(msgPayload);
              sessions[targetSessionId].lastActivity = Date.now();
              sessions[targetSessionId].lastAdvisorResponseTime = Date.now();
              sessions[targetSessionId].advisorAnswered = true;
            }
            
            logToCrm('agent_message', targetSessionId, { text: replyText, agentName, chatId: msg.chat.id });
            sendTransferToCoralisCrm(targetSessionId, 'Respuesta de Asesor Telegram', { advisorName: agentName });

            if (clientRes) {
              console.log(`[TELEGRAM -> WEB] Forwarding reply to client ${targetSessionId}: ${replyText}`);
              clientRes.write(`data: ${JSON.stringify(msgPayload)}\n\n`);
            } else {
              console.log(`[TELEGRAM -> WEB] Client ${targetSessionId} is offline. Reply buffered in history.`);
            }

            // Map this telegram message id back to sessionId as well
            if (msg.message_id) {
              messageMappings[msg.message_id] = targetSessionId;
            }
          }
        }
      }
      setTimeout(pollTelegram, 1500);
    })
    .catch(err => {
      console.error('Error polling Telegram updates:', err.message);
      setTimeout(pollTelegram, 5000); // Wait longer on error
    });
}

// Initialize Polling Loop
setTimeout(pollTelegram, 2000);

// HTTP Server Router
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  // Security Hardening Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE Stream: GET /api/chat/stream?sessionId=...
  if (pathname === '/api/chat/stream' && req.method === 'GET') {
    const sessionId = parsedUrl.searchParams.get('sessionId');
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || sessionId;

    if (isClientBanned(clientIp)) {
      const remainingMin = Math.max(1, Math.ceil((bannedClients[clientIp].bannedUntil - Date.now()) / 60000));
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: `Acceso temporalmente suspendido por infracción de normas. Podrás reconectarte en ${remainingMin} minutos.`,
        banned: true,
        remainingMin
      }));
    }
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing sessionId query parameter.' }));
      return;
    }

    // Initialize session if not exists
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        humanTransferred: false,
        userName: 'Visitante',
        history: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
        hasUserMessages: false
      };
    }

    // Set headers for SSE stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Prevent proxy buffering
    });

    // Send connection established comment
    res.write(': sse connection open\n\n');

    // Store active connection
    clients[sessionId] = res;
    console.log(`Client SSE connected: ${sessionId}`);

    // Set up keep-alive to prevent proxy timeout
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    // If client reconnects, send buffered agent messages or history
    if (sessions[sessionId].history.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'history', history: sessions[sessionId].history })}\n\n`);
    }

    req.on('close', () => {
      clearInterval(keepAlive);
      console.log(`Client SSE disconnected: ${sessionId}`);
      delete clients[sessionId];
    });
    return;
  }

  // 2. Send Message: POST /api/chat/send
  if (pathname === '/api/chat/send' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { sessionId, text, userName, cartItems } = body;

      if (!sessionId || !text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing sessionId or text.' }));
        return;
      }

      console.log(`\n[LIVE CHAT] [${sessionId}] ${userName || 'Visitor'}: ${text}`);

      // Rate Limit Check per Session / IP
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || sessionId;
      const rateCheck = checkClientRateLimit(clientIp);
      if (!rateCheck.allowed) {
        console.warn(`[RATE LIMIT] Rate limit exceeded for ${clientIp} (session: ${sessionId})`);
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: `Has alcanzado el límite de mensajes. Por favor espera ${rateCheck.retryAfterSec} segundos antes de enviar otro mensaje.`
        }));
      }

      // Initialize or reset session if new or previously closed
      if (!sessions[sessionId] || sessions[sessionId].isClosed) {
        sessions[sessionId] = {
          humanTransferred: false,
          userName: userName || 'Visitante',
          cartItems: Array.isArray(cartItems) ? cartItems : [],
          history: [],
          createdAt: Date.now(),
          lastActivity: Date.now(),
          hasUserMessages: true,
          isClosed: false
        };
      } else {
        if (Array.isArray(cartItems)) {
          sessions[sessionId].cartItems = cartItems;
        }
        sessions[sessionId].lastActivity = Date.now();
        sessions[sessionId].hasUserMessages = true;
      }

      // Dynamic customer name/company/contact extractor
      let detectedName = null;
      let detectedCompany = null;
      let detectedType = 'NATURAL';

      const parsedLead = parseLeadIdentity(text);
      if (parsedLead.name) {
        detectedName = parsedLead.name;
        if (parsedLead.company) {
          detectedCompany = parsedLead.company;
          detectedType = 'JURIDICA';
          sessions[sessionId].userName = `${detectedName} (${detectedCompany})`;
          sessions[sessionId].clientTypeConfirmed = true;
        } else {
          sessions[sessionId].userName = detectedName;
          detectedType = parsedLead.clientType;
        }
        sessions[sessionId].contactName = detectedName;
        sessions[sessionId].companyName = detectedCompany || (detectedType === 'NATURAL' && sessions[sessionId].clientTypeConfirmed ? 'Persona Natural' : '');
        sessions[sessionId].clientType = detectedType;
        console.log(`[CHAT INTAKE] Extracted customer identity: ${sessions[sessionId].userName}`);
      } else if (/^(?:a nombre de una empresa|empresa|jur[ií]dica|compa[ñn][ií]a)/i.test(text.trim())) {
        detectedType = 'JURIDICA';
        sessions[sessionId].clientType = 'JURIDICA';
        sessions[sessionId].clientTypeConfirmed = true;
      } else if (/^(?:como particular|particular|persona natural|propio|personal|independiente|freelance)/i.test(text.trim())) {
        detectedType = 'NATURAL';
        sessions[sessionId].clientType = 'NATURAL';
        sessions[sessionId].clientTypeConfirmed = true;
        sessions[sessionId].companyName = 'Persona Natural';
      }

      if (parsedLead.email) {
        sessions[sessionId].userEmail = parsedLead.email;
      }
      if (parsedLead.phone) {
        sessions[sessionId].userPhone = parsedLead.phone;
      }

      // Check if user entered dummy/invalid contact info (e.g. micorreo@yahoo.com) without real contact
      if (parsedLead.hasDummyContact && !sessions[sessionId].userPhone && !sessions[sessionId].userEmail) {
        const dummyReply = `¡Hola${detectedName ? ' ' + detectedName : ''}! Hemos registrado tus datos${detectedCompany ? ' de ' + detectedCompany : ''}, pero para poder transferirte con un asesor comercial humano necesitamos un **número de teléfono / WhatsApp o correo corporativo válido** (ej. 310 123 4567 o contacto@empresa.com).\n\n¿Nos indicas un número o correo directo para comunicarnos contigo?` +
          `\n\n[SET_PROFILE:name=${detectedName || ''}|company=${detectedCompany || ''}|type=${detectedType}]`;

        sessions[sessionId].history.push({ sender: 'user', text, timestamp: Date.now() });
        sessions[sessionId].history.push({ sender: 'bot', text: dummyReply, timestamp: Date.now() });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          humanTransferred: false,
          reply: dummyReply,
          updatedUserName: sessions[sessionId].userName
        }));
      }

      // Log to history
      sessions[sessionId].history.push({ sender: 'user', text, timestamp: Date.now() });
      logToCrm('user_message', sessionId, { text, userName: userName || 'Visitante' });

      // ── Handling active human transferred session ──────────────────────────────
      if (sessions[sessionId].humanTransferred) {
        // Case 1: Client wants to close inquiry / do not want to continue
        if (isCloseChatRequest(text)) {
          const contactName = sessions[sessionId].contactName || sessions[sessionId].userName || 'estimado cliente';
          const reply = `¡Gracias por tu tiempo y paciencia, ${contactName}! Damos por finalizada tu consulta. Estaremos atentos cuando desees comunicarte nuevamente con ALACOR S.A.S. ¡Que tengas un excelente día!\n\n[RESTART_CHAT]`;

          sessions[sessionId].humanTransferred = false;
          sessions[sessionId].queueClosed = true;
          sessions[sessionId].intakeStage = 'closed';
          sessions[sessionId].isClosed = true;
          sessions[sessionId].history.push({ sender: 'assistant', text: reply, timestamp: Date.now() });

          sendTransferToCoralisCrm(sessionId, 'Consulta Finalizada por el Cliente');

          if (config.enabled) {
            let targetChatId = sessions[sessionId].chatId || config.chatId;
            if (targetChatId) {
              makeTelegramRequest('sendMessage', {
                chat_id: targetChatId,
                text: `ℹ️ [CONSULTA FINALIZADA] El cliente ${userName || contactName} (${sessionId}) ha dado por terminada su consulta.`
              }).catch(err => console.error('Failed to notify Telegram of chat closure:', err.message));
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            humanTransferred: false,
            sessionEnded: true,
            restartChat: true,
            reply,
            updatedUserName: sessions[sessionId].userName
          }));
        }

        // Case 2: Client wants a phone call instead of waiting
        if (isCallRequest(text)) {
          const contactName = sessions[sessionId].contactName || sessions[sessionId].userName || 'estimado cliente';
          const phoneStr = sessions[sessionId].userPhone ? ` al número ${sessions[sessionId].userPhone}` : '';
          const reply = `¡Perfecto, ${contactName}! Hemos registrado tu solicitud de contacto telefónico. Un asesor comercial de ALACOR S.A.S. se comunicará contigo${phoneStr} tan pronto como se desocupe.\n\n¡Gracias por tu paciencia y por comunicarte con ALACOR S.A.S.!\n\n[RESTART_CHAT]`;

          sessions[sessionId].humanTransferred = false;
          sessions[sessionId].queueClosed = true;
          sessions[sessionId].callRequested = true;
          sessions[sessionId].intakeStage = 'closed';
          sessions[sessionId].isClosed = true;
          sessions[sessionId].history.push({ sender: 'assistant', text: reply, timestamp: Date.now() });

          sendTransferToCoralisCrm(sessionId, 'Cliente Solicitó Llamada Telefónica');

          if (config.enabled) {
            let targetChatId = sessions[sessionId].chatId || config.chatId;
            if (targetChatId) {
              makeTelegramRequest('sendMessage', {
                chat_id: targetChatId,
                text: `📞🚨 [SOLICITUD DE LLAMADA] El cliente ${userName || contactName} (${sessions[sessionId].userPhone || 'Sin tel'}) solicita contacto telefónico para su consulta (${sessionId}).`
              }).catch(err => console.error('Failed to notify Telegram of call request:', err.message));
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            humanTransferred: false,
            sessionEnded: true,
            callRequested: true,
            restartChat: true,
            reply,
            updatedUserName: sessions[sessionId].userName
          }));
        }

        // Case 3: Client wants to keep waiting in the chat
        if (isKeepWaitingRequest(text)) {
          const contactName = sessions[sessionId].contactName || sessions[sessionId].userName || 'estimado cliente';
          const reply = `¡Entendido, ${contactName}! Sigues en la cola de atención prioritaria. Un asesor comercial te responderá directamente aquí en el chat en cuanto se libere. Agradecemos mucho tu paciencia.`;

          sessions[sessionId].queueClosed = false;
          sessions[sessionId].transferTime = Date.now(); // Reset waiting timer
          sessions[sessionId].queueStage = 0;
          sessions[sessionId].history.push({ sender: 'assistant', text: reply, timestamp: Date.now() });

          sendTransferToCoralisCrm(sessionId, 'Cliente Continúa Esperando en Chat');

          if (config.enabled) {
            let targetChatId = sessions[sessionId].chatId || config.chatId;
            if (targetChatId) {
              makeTelegramRequest('sendMessage', {
                chat_id: targetChatId,
                text: `⏳ [ESPERA EN CHAT] El cliente ${userName || contactName} (${sessionId}) continúa esperando en línea.`
              }).catch(err => console.error('Failed to notify Telegram of waiting state:', err.message));
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            humanTransferred: true,
            keepWaiting: true,
            reply,
            updatedUserName: sessions[sessionId].userName
          }));
        }

        // Case 4: General post-transfer message -> forward to Telegram and sync Coralis CRM
        sendTransferToCoralisCrm(sessionId, 'Mensaje del Cliente');

        if (config.enabled) {
          const formattedMsg = `💬 [Cliente: ${userName || 'Visitante'}] (${sessionId})\n\n${text}`;
          let targetChatId = sessions[sessionId].chatId;
          if (!targetChatId) {
            const activeAccounts = (config.accounts || []).filter(a => a.enabled && a.chatId);
            if (activeAccounts.length > 0) {
              activeAccounts.sort((a, b) => Number(a.priority) - Number(b.priority));
              targetChatId = activeAccounts[0].chatId;
              sessions[sessionId].chatId = targetChatId;
              sessions[sessionId].accountName = activeAccounts[0].name;
            } else {
              targetChatId = config.chatId;
            }
          }

          if (targetChatId) {
            makeTelegramRequest('sendMessage', { chat_id: targetChatId, text: formattedMsg })
              .then(tgMsg => { messageMappings[tgMsg.message_id] = sessionId; })
              .catch(err => console.error('Failed to forward user message to Telegram:', err.message));
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          humanTransferred: true,
          updatedUserName: sessions[sessionId].userName
        }));
      }

      // Check if client is already quarantined
      if (isClientBanned(clientIp)) {
        const remainingMin = Math.max(1, Math.ceil((bannedClients[clientIp].bannedUntil - Date.now()) / 60000));
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: `Acceso temporalmente suspendido. Podrás enviar mensajes en ${remainingMin} minutos.`,
          systemEvent: 'session_ended',
          banned: true,
          remainingMin
        }));
      }

      // Execute Cybersecurity & Content Moderation Inspection
      const secCheck = detectSecurityViolationOrOffTopic(text);
      if (secCheck.violation) {
        console.warn(`[SECURITY MODERATION] Violation detected in session ${sessionId} (${secCheck.type}): "${text}"`);
        banClient(clientIp, secCheck.type, 15 * 60 * 1000); // 15-minute IP Quarantine
        sessions[sessionId].history.push({ sender: 'bot', text: secCheck.reply, systemEvent: 'session_ended', timestamp: Date.now() });

        if (clients[sessionId]) {
          clients[sessionId].write(`data: ${JSON.stringify({ sender: 'bot', text: secCheck.reply, systemEvent: 'session_ended' })}\n\n`);
          clients[sessionId].end();
          delete clients[sessionId];
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          systemEvent: 'session_ended',
          reply: secCheck.reply
        }));
      }

      // ----------------------------------------------------
      // MOTOR DE CAPTURA CONVERSACIONAL PROGRESIVA POR ETAPAS
      // ----------------------------------------------------
      const specialOrderOrHumanTrigger = /quiero hablar con un humano|comun[ií]came con un asesor|asesor humano|persona real|licitaci[oó]n|compra mayorista|no responde|hablar con alguien|ejecutivo|comercial humano|pero ustedes me vendieron|la vez pasada|ya les he comprado|ya compr[eé]|pedido especial|sobre pedido|kit de derrame|derrames|puntos ecol[oó]gicos|punto ecol[oó]gico|canecas de reciclaje|estaci[oó]n de reciclaje/i.test(text);

      if (sessions[sessionId].intakeStage || specialOrderOrHumanTrigger) {
        let directReply = '';
        let triggerTransfer = false;

        if (sessions[sessionId].intakeStage === 'ask_name') {
          if (parsedLead.name || isValidPersonName(text)) {
            sessions[sessionId].contactName = parsedLead.name || text.trim();
            sessions[sessionId].userName = sessions[sessionId].contactName;
            if (parsedLead.company) {
              sessions[sessionId].companyName = parsedLead.company;
              sessions[sessionId].clientType = 'JURIDICA';
              sessions[sessionId].clientTypeConfirmed = true;
              sessions[sessionId].userName = `${sessions[sessionId].contactName} (${sessions[sessionId].companyName})`;
            }
            if (parsedLead.phone) sessions[sessionId].userPhone = parsedLead.phone;
            if (parsedLead.email) sessions[sessionId].userEmail = parsedLead.email;

            // Decidir siguiente etapa
            if (!sessions[sessionId].clientTypeConfirmed && !sessions[sessionId].companyName) {
              sessions[sessionId].intakeStage = 'ask_type';
              const firstName = sessions[sessionId].contactName.split(' ')[0];
              directReply = `¡Mucho gusto, ${firstName}! ¿Nos escribes a nombre de una empresa o como particular?\n\n[OPCIONES_CLIENTE_TIPO]`;
            } else if (sessions[sessionId].clientType === 'JURIDICA' && !sessions[sessionId].companyName) {
              sessions[sessionId].intakeStage = 'ask_company';
              directReply = `¿Cuál es el nombre o razón social de tu empresa?`;
            } else if (!sessions[sessionId].userPhone && !sessions[sessionId].userEmail) {
              sessions[sessionId].intakeStage = 'ask_contact';
              directReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
            } else {
              sessions[sessionId].intakeStage = null;
              triggerTransfer = true;
              sessions[sessionId].humanTransferred = true;
              const firstName = sessions[sessionId].contactName.split(' ')[0];
              directReply = `¡Listo, ${firstName}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;
              executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
            }
          } else {
            directReply = `Para gestionar tu solicitud, por favor indícame tu nombre.`;
          }
        } else if (sessions[sessionId].intakeStage === 'ask_type') {
          if (/empresa|jur[ií]dica|compa[ñn][ií]a|negocio|organizaci[oó]n|a nombre de una empresa/i.test(text)) {
            sessions[sessionId].clientType = 'JURIDICA';
            sessions[sessionId].clientTypeConfirmed = true;
            sessions[sessionId].companyName = null;
            sessions[sessionId].intakeStage = 'ask_company';
            directReply = `¿Cuál es el nombre o razón social de tu empresa?`;
          } else if (/particular|persona natural|propio|personal|natural|independiente|como particular/i.test(text)) {
            sessions[sessionId].clientType = 'NATURAL';
            sessions[sessionId].clientTypeConfirmed = true;
            sessions[sessionId].companyName = 'Persona Natural';
            if (!sessions[sessionId].userPhone && !sessions[sessionId].userEmail) {
              sessions[sessionId].intakeStage = 'ask_contact';
              directReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
            } else {
              sessions[sessionId].intakeStage = null;
              triggerTransfer = true;
              sessions[sessionId].humanTransferred = true;
              const firstName = sessions[sessionId].contactName ? sessions[sessionId].contactName.split(' ')[0] : '';
              directReply = `¡Listo${firstName ? ', ' + firstName : ''}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;
              executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
            }
          } else if (parsedLead.company) {
            sessions[sessionId].companyName = parsedLead.company;
            sessions[sessionId].clientType = 'JURIDICA';
            sessions[sessionId].clientTypeConfirmed = true;
            sessions[sessionId].userName = `${sessions[sessionId].contactName} (${sessions[sessionId].companyName})`;
            if (!sessions[sessionId].userPhone && !sessions[sessionId].userEmail) {
              sessions[sessionId].intakeStage = 'ask_contact';
              directReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
            } else {
              sessions[sessionId].intakeStage = null;
              triggerTransfer = true;
              sessions[sessionId].humanTransferred = true;
              const firstName = sessions[sessionId].contactName ? sessions[sessionId].contactName.split(' ')[0] : '';
              directReply = `¡Listo${firstName ? ', ' + firstName : ''}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;
              executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
            }
          } else {
            directReply = `¿Nos escribes a nombre de una empresa o como particular?\n\n[OPCIONES_CLIENTE_TIPO]`;
          }
        } else if (sessions[sessionId].intakeStage === 'ask_company') {
          const comp = cleanCompany(text) || text.trim();
          if (comp && !INVALID_NAME_WORDS.has(comp.toLowerCase())) {
            sessions[sessionId].companyName = comp;
            sessions[sessionId].clientType = 'JURIDICA';
            sessions[sessionId].clientTypeConfirmed = true;
            if (sessions[sessionId].contactName) {
              sessions[sessionId].userName = `${sessions[sessionId].contactName} (${sessions[sessionId].companyName})`;
            }
            if (parsedLead.phone) sessions[sessionId].userPhone = parsedLead.phone;
            if (parsedLead.email) sessions[sessionId].userEmail = parsedLead.email;

            if (!sessions[sessionId].userPhone && !sessions[sessionId].userEmail) {
              sessions[sessionId].intakeStage = 'ask_contact';
              directReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
            } else {
              sessions[sessionId].intakeStage = null;
              triggerTransfer = true;
              sessions[sessionId].humanTransferred = true;
              const firstName = sessions[sessionId].contactName ? sessions[sessionId].contactName.split(' ')[0] : '';
              directReply = `¡Listo${firstName ? ', ' + firstName : ''}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;
              executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
            }
          } else {
            directReply = `¿Cuál es el nombre o razón social de tu empresa?`;
          }
        } else if (sessions[sessionId].intakeStage === 'ask_contact') {
          if (parsedLead.phone) sessions[sessionId].userPhone = parsedLead.phone;
          if (parsedLead.email) sessions[sessionId].userEmail = parsedLead.email;

          if (sessions[sessionId].userPhone || sessions[sessionId].userEmail) {
            sessions[sessionId].intakeStage = null;
            triggerTransfer = true;
            sessions[sessionId].humanTransferred = true;
            const firstName = sessions[sessionId].contactName ? sessions[sessionId].contactName.split(' ')[0] : (sessions[sessionId].userName && sessions[sessionId].userName !== 'Visitante' ? sessions[sessionId].userName.split('(')[0].trim() : '');
            directReply = `¡Listo${firstName ? ', ' + firstName : ''}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;
            executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
          } else {
            directReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
          }
        } else if (specialOrderOrHumanTrigger) {
          // Inicio de captura por requerimiento especial / transferencia
          if (!sessions[sessionId].contactName) {
            sessions[sessionId].intakeStage = 'ask_name';
            directReply = `¡Con gusto! Para gestionar tu solicitud, por favor indícame tu nombre.`;
          } else if (!sessions[sessionId].clientTypeConfirmed && !sessions[sessionId].companyName) {
            sessions[sessionId].intakeStage = 'ask_type';
            const firstName = sessions[sessionId].contactName.split(' ')[0];
            directReply = `¡Mucho gusto, ${firstName}! ¿Nos escribes a nombre de una empresa o como particular?\n\n[OPCIONES_CLIENTE_TIPO]`;
          } else if (sessions[sessionId].clientType === 'JURIDICA' && !sessions[sessionId].companyName) {
            sessions[sessionId].intakeStage = 'ask_company';
            directReply = `¿Cuál es el nombre o razón social de tu empresa?`;
          } else if (!sessions[sessionId].userPhone && !sessions[sessionId].userEmail) {
            sessions[sessionId].intakeStage = 'ask_contact';
            directReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
          } else {
            sessions[sessionId].intakeStage = null;
            triggerTransfer = true;
            sessions[sessionId].humanTransferred = true;
            const firstName = sessions[sessionId].contactName ? sessions[sessionId].contactName.split(' ')[0] : (sessions[sessionId].userName && sessions[sessionId].userName !== 'Visitante' ? sessions[sessionId].userName.split('(')[0].trim() : '');
            directReply = `¡Listo${firstName ? ', ' + firstName : ''}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;
            executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
          }
        }

        if (directReply) {
          directReply += `\n\n[SET_PROFILE:name=${sessions[sessionId].contactName || ''}|company=${sessions[sessionId].companyName || ''}|type=${sessions[sessionId].clientType || 'NATURAL'}|email=${sessions[sessionId].userEmail || ''}|phone=${sessions[sessionId].userPhone || ''}]`;

          sessions[sessionId].history.push({ sender: 'bot', text: directReply, timestamp: Date.now() });

          if (clients[sessionId]) {
            clients[sessionId].write(`data: ${JSON.stringify({ sender: 'bot', text: directReply, triggerTransfer })}\n\n`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            humanTransferred: triggerTransfer,
            triggerTransfer,
            reply: directReply,
            updatedUserName: sessions[sessionId].userName
          }));
        }
      }

      // Execute LLM RAG Pipeline (Multi-provider Redundancy)
      const catalogContext = getCatalogRAGContext();
      const activeCart = sessions[sessionId].cartItems || [];
      const cartSummary = activeCart.length > 0
        ? activeCart.map(item => `${item.qty || 1}x ${item.name}`).join(', ')
        : '';

      const systemPrompt = `Eres el Asesor Técnico y Comercial de ALACOR S.A.S. (Colombia), distribuidores de Seguridad Industrial, Equipos de Protección Personal (EPP) certificados y Servicios de Asesoría e Implementación del SG-SST (Resolución 0312 de 2019).

REGLAS OBLIGATORIAS Y DIRECTIVAS COMERCIALES:
1. MISIÓN Y ALCANCE DEL ASISTENTE:
   - ALACOR S.A.S. comercializa EPP, dotación estándar y servicios de asesoría e implementación del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST).
   - ESTÁ TERMINANTEMENTE PROHIBIDO hacer cuestionarios o indagar sobre "tipo de uso", "talla y género", "confección especial" o "requerimientos especiales".
   - Tu labor es DIRECTA Y CONCISA: Presentar de inmediato las opciones disponibles en el portafolio que responden a la necesidad del cliente.
   - Si el cliente solicita pedidos especiales fuera del portafolio, confección personalizada, cotización formal mayorista o solicita hablar con un asesor humano:
     * Si NO conoces sus datos (nombre, empresa o contacto): Pídelos de manera conversacional, cordial y directa en el texto del chat.
     * Si YA conoces sus datos (nombre y empresa): Confirma que un asesor humano tomará la conversación e incluye la etiqueta [TRANSFERIR_ASESOR].

2. PROTOCOLO DE CONVERSACIÓN PROGRESIVA Y CAPTURA INICIAL DE DATOS:
   - REGLA DE CAPTURA SEGÚN EL TIPO DE SERVICIO:
     * Si la consulta es sobre ASESORÍA / IMPLEMENTACIÓN SG-SST (Resolución 0312 de 2019):
       - Dado que el SG-SST aplica EXCLUSIVAMENTE a empresas / empleadores, pide directamente el nombre y la empresa (NO preguntes si es particular):
         "¡Hola! Sí, en ALACOR S.A.S. somos consultores especialistas en SG-SST (Resolución 0312 de 2019) para micro y pequeñas empresas. Para orientarte de forma personalizada y preparar tu autodiagnóstico: ¿cuál es tu nombre y de qué empresa nos escribes?"
     * Si la consulta es sobre PRODUCTOS EPP O SEGURIDAD INDUSTRIAL:
       - Dado que los productos pueden ser comprados por empresas (dotación) o particulares (uso propio), si no se ha presentado pregunta:
         "Para orientarte de forma personalizada: ¿cuál es tu nombre y nos escribes como particular o a nombre de una empresa?"
   - Cuando el cliente indique su nombre y/o empresa:
     * Salúdalo con calidez por su nombre.
     * Si su consulta es sobre Asesoría o Implementación SG-SST (Resolución 0312 de 2019):
       - Explica que el diagnóstico está diseñado en 4 sencillos pasos para evaluar los Estándares Mínimos de su micro o pequeña empresa.
       - Incluye OBLIGATORIAMENTE la etiqueta [IR_DIAGNOSTICO_0312] en una línea separada para generar el botón directo al formulario.
       - Incluye al final la etiqueta de perfil [SET_PROFILE:name=Nombre|company=Empresa|type=JURIDICA].
     * Si su consulta es sobre Productos EPP o Seguridad Industrial:
       - Presenta de inmediato las opciones disponibles en viñetas limpias con su **Nombre Exacto** en negrita y resumen técnico.
       - Incluye al final la etiqueta de perfil [SET_PROFILE:name=Nombre|company=Empresa|type=Tipo].
   - Si el cliente solicita armar un kit técnico integral / rescate / espacios confinados o manifiesta requerir asesoría personalizada:
     * Si ya tienes sus datos, transfiere de inmediato con [TRANSFERIR_ASESOR]. Si no los tienes, pídelos cordialmente en el chat.

3. 🚨 REGLA ESTRICTA DE NEGRITAS (**...**) Y NOMBRES REALES:
   - Las negritas generan enlaces interactivos automáticos al catálogo.
   - ESTÁ ESTRICTAMENTE PROHIBIDO usar negrita (**...**) en conceptos de SG-SST, títulos de pasos, preguntas, secciones, conceptos genéricos o encabezados (❌ PROHIBIDO: **Módulo de Autodiagnóstico 0312**, **Servicios SG-SST**, **consultoría...**, **Análisis de resultados**, **Acompañamiento técnico**, **Nombre**, **Empresa**, **Teléfono**, **Tipo de uso**, etc.).
   - La negrita (**...**) está reservada EXCLUSIVAMENTE para nombres exactos de productos físicos de catálogo (ej. **CASCO MOUNTAIN...**, **LENTE SPY FLEX...**).

4. CRITERIOS TÉCNICOS CRÍTICOS:
   - Asesoría e Implementación SG-SST / Resolución 0312 de 2019: Cuando el cliente consulte por asesoría, diagnóstico o implementación del SG-SST (Sistema de Gestión de Seguridad y Salud en el Trabajo) o cumplimiento de Estándares Mínimos:
     * Explica cordialmente que en ALACOR S.A.S. somos consultores especialistas en Seguridad y Salud en el Trabajo (SST), enfocados en brindar asesoría, implementación y administración del SG-SST a la medida de clientes finales, micro y pequeñas empresas.
     * Si no se ha presentado, pídele su nombre y si nos contacta como particular/independiente o empresa.
     * Si ya se presentó, dale la bienvenida por su nombre, invítalo a completar el autodiagnóstico de 4 pasos e incluye [IR_DIAGNOSTICO_0312].
     * ESTÁ TERMINANTEMENTE PROHIBIDO transferir a un asesor comercial para este requerimiento; el usuario ingresa sus datos directamente en el formulario de autodiagnóstico.
     * NO uses negrita (**...**) en los textos de SG-SST para no generar botones interactivos de productos erróneos.
     * PROHIBIDO responder que no disponemos de servicios para SG-SST.
   - Cascos con Portalámparas / Minería / Túneles: Cuando el cliente consulte por cascos con portalámparas, cascos para minería o cascos Luminer, presenta de inmediato las referencias especializadas de **Steelpro**:
     1. **CASCO TIPO I MINERO LUMINER CAPITÁN (STEELPRO)**: Casco Tipo I Clase E dieléctrico (20.000 V) con portalámparas frontal integrado y soporte para cable de lámpara minera.
     2. **CASCO MINERO ALA ENTERIZA CON PORTALÁMPARA (STEELPRO)** / **CASCO LUMINER ALA ENTERIZA ABS/RATCHET (STEELPRO)**: Casco Tipo I Clase E con ala ancha 360° y portalámparas frontal para linterna o lámpara minera.
     PROHIBIDO responder que no disponemos de cascos con portalámparas; sí están activos en nuestro portafolio.
   - Linternas e Iluminación para Casco / Manos Libres: Cuando el cliente consulte por linternas, lámparas de casco, linterna frontal o iluminación acoplable al casco, presenta de inmediato la **LINTERNA SENSOR X LED (STEELPRO)**, explicando que cuenta con sensor de movimiento inteligente para encendido sin contacto y es compatible tanto para montaje en portalámparas como sobre cualquier casco con su banda de ajuste elástica. PROHIBIDO responder que no disponemos de linternas.
   - Lentes para Interiores y Exteriores / Luz Cambiante: Cuando el cliente consulte por lentes de seguridad que sirvan tanto para interiores como exteriores, o para ambientes de luz variable / transición de sombra a sol, destaca de inmediato la referencia **LENTE SPY FLEX (STEELPRO)** en su variante de tonalidad **IN-OUT (Indoor/Outdoor)**, explicando que su suave tratamiento espejado reduce el deslumbramiento solar en exteriores sin restar claridad visual en espacios cerrados o bodegas.
   - Guantes para Soldadura: Cuando el cliente consulte por guantes para soldar o soldadura, presenta de inmediato las 4 referencias especializadas de **Guantes de Soldador (Steelpro)**: **GUANTE SOLDADOR AMARILLO - CERTIFICADO (STEELPRO)**, **GUANTE SOLDADOR AZUL / NARANJA - CERTIFICADO (STEELPRO)**, **GUANTE SOLDADOR CARNAZA NARANJA SIN REFUERZO (STEELPRO)** y **GUANTE SOLDADOR 15" NARANJA NEGRO KEVLAR REFORZADO PALMA (STEELPRO)**. PROHIBIDO recomendar guantes convencionales de vaqueta/carnaza para labores de soldadura.
   - Arneses Estándar vs. Dieléctricos / Trabajo en Alturas: Cuando el cliente consulte por un arnés no dieléctrico o arnés convencional en acero/poliéster para alturas, NUNCA digas que no contamos con el producto. Presenta de inmediato las referencias estándar de alta resistencia certificadas ANSI/ISO disponibles en nuestro portafolio:
      1. **ARNES CUERPO COMPLETO ECO EN H - ROJO 4 ARGOLLAS (STEELPRO)**: Arnés en H con herrajes de acero de alta resistencia para detención de caídas y posicionamiento.
      2. **ARNES CUERPO COMPLETO ECO EN X - ROJO 4 ARGOLLAS (STEELPRO)**: Arnés tipo X con 4 argollas en acero y reatas de poliéster de alta tenacidad.
      3. **ARNES MULTIPROPOSITO 4 ARGOLLAS (ARMADURA)**: Arnés multipropósito certificado para trabajos generales en alturas y rescate.
      * Además, recuérdale que puede explorar la línea completa de Alturas en nuestro portafolio web o solicitar el acompañamiento de un asesor técnico comercial.
   - Botas de Caucho / Calzado Impermeable / Botas PVC: Cuando el cliente consulte por botas de caucho o calzado impermeable, presenta las referencias oficiales **BOTA CERRO SEGURIDAD PVC AMARILLA (ALACOR)** y **BOTA CERRO SEGURIDAD PVC NEGRA (ALACOR)**. Siempre deja abierta la invitación a explorar las demás opciones de calzado de trabajo o consultar con un asesor comercial para alternativas específicas.
   - Labores Eléctricas / Alta y Media Tensión: Todos los equipos DEBEN ser dieléctricos Clase E / Composite: **Casco Mountain ABS con Barbuquejo (Steelpro)**, **Arnés Dieléctrico en X con Faja Lumbar (Steelpro)**, **Bota Cobalt Dieléctrica Composite (Steelpro)** o **Bota Silver Dieléctrica Composite (Steelpro)**.
   - REGLA DE ORO COMERCIAL (CERO RESPUESTAS NEGATIVAS):
     * ESTÁ PROHIBIDO responder de forma tajante o negativa afirmando "no contamos con el producto" o "no tenemos esa opción".
     * Siempre ofrece las alternativas homologadas más cercanas de nuestro portafolio, sugiere navegar por la subcategoría web correspondiente o solicita amablemente los datos de contacto para que un asesor comercial le brinde una asesoría técnica a su medida.
   - Aplicaciones totalmente ajenas al ámbito laboral (ej. motociclismo deportivo / cosplay / uso recreativo doméstico / mascotas): Responde con amabilidad aclarando que nuestros productos están certificados exclusivamente para protección industrial y laboral, y pregunta cordialmente si hay algún elemento de EPP o seguridad en el trabajo en el que podamos apoyarle. (NOTA: Los puntos ecológicos, canecas de reciclaje, kits de derrame, extintores y camillas NO son aplicaciones ajenas, son insumos de seguridad industrial y SST gestionados bajo pedido especial).
   - Dotación estándar: No realizamos marcación, estampado ni bordado con logos.

5. 🚨 PORTAFOLIO OFICIAL Y REFERENCIAS REALES AUTORIZADAS DE ALACOR S.A.S.:
   - **ESTÁ TERMINANTEMENTE PROHIBIDO** citar o inventar marcas externas no autorizadas (❌ PROHIBIDO 3M, Petzl, MSA, Vertex, Hard Hat, Ranger, etc.).
   - Inventario oficial activo en el portafolio web:

${catalogContext}

   - **CUANDO EL CLIENTE CONSULTE POR PRODUCTOS QUE NO ESTÁN EN EL CATÁLOGO DIGITAL WEB (ej. puntos ecológicos, canecas de reciclaje, kits de derrame, extintores, camillas, insumos complementarios de seguridad y SST) O MENCIONE COMPRAS ANTERIORES / PEDIDOS ESPECIALES / INVENTARIO SOBRE PEDIDO (ej. "Pero ustedes me vendieron uno la vez pasada", "Ya les compré antes", "Necesito cotizar sobre pedido"):**
     * En ALACOR S.A.S. gestionamos estos requerimientos e insumos de seguridad industrial y dotación bajo pedido especial con nuestros distribuidores y fabricantes aliados.
     * Si el cliente pregunta por un producto no listado o indica que ya compró antes con nosotros:
       DEBES INICIAR EL PROTOCOLO DE TRANSFERENCIA A ASESOR COMERCIAL HUMANO:
       1. Si el cliente aún no ha dado sus datos de contacto (teléfono/WhatsApp o correo), infórmale con amabilidad que gestionamos estos insumos bajo pedido especial y pídele su nombre, empresa (si aplica) y número de teléfono/WhatsApp o correo para que un asesor comercial humano le contacte y cotice formalmente.
       2. Si ya contamos con sus datos de contacto (teléfono o correo), incluye [TRANSFERIR_ASESOR] para transferir la conversación de inmediato.

   - **CUANDO EL CLIENTE CONSULTE POR PRODUCTOS TOTALMENTE AJENOS A SEGURIDAD INDUSTRIAL Y TRABAJO (ej. repuestos de vehículos o motos particulares, juguetes, cosplay):**
     * Explica cordialmente que en ALACOR S.A.S. nos enfocamos exclusivamente en dotación, seguridad industrial y salud ocupacional laboral, y pregunta con calidez en qué elemento de EPP o seguridad laboral podemos apoyarle.

6. PAUTAS DE ESTILO Y FLUIDEZ CONVERSACIONAL:
   - **PROHIBIDO dar respuestas robóticas o repetir la misma frase en turnos consecutivos.**
   - Si el cliente insiste o menciona compras anteriores, acoge su inquietud con empatía y ofrece la gestión directa de un asesor comercial humano.
   - Respuestas directas, profesionales y concisas sin cuestionarios superfluos ni rodeos.
   - Toda la atención es por este canal web.${cartSummary ? `\n\n7. 🛒 **COMPORTAMIENTO DE COMPRA Y ARTÍCULOS EN EL CARRITO DEL CLIENTE:**\n   - Artículos actuales en su cotización/carrito: [${cartSummary}].\n   - **REGLA DE VENTA CONSULTIVA Y COMPLEMENTARIA:** Aprovecha que el cliente ya tiene estos artículos para ofrecerle de manera natural y especializada productos complementarios que completen su esquema de seguridad (por ejemplo: si ya agregó bloqueadores de breaker, ofrece candados LOTO, pinzas de bloqueo múltiple para 6 candados o kits de tarjetas 'No Operar'; si agregó cascos, ofrece barbuquejos o protección visual/auditiva; si agregó arnés, ofrece eslingas con absorbedor o líneas de vida).` : ''}`;


      try {
        console.log(`[RAG ENGINE] Processing request for session ${sessionId}...`);
        
        // Build recent conversation history context (last 6 messages)
        const recentHistory = (sessions[sessionId].history || []).slice(-6);
        const conversationMessages = recentHistory.map(h => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.text.replace(/^\[Bot\]:\s*/, '').replace(/^\[Asesor\]:\s*/, '')
        }));

        const aiResult = await executeLlmsWithFallback(systemPrompt, conversationMessages);
        let botReply = aiResult.text;
        let shouldTransfer = false;

        if (botReply.includes('[MODERACION_FINALIZAR]')) {
          botReply = botReply.replace(/\[MODERACION_FINALIZAR\]/g, '').trim();
          sessions[sessionId].history.push({ sender: 'bot', text: botReply, systemEvent: 'session_ended', timestamp: Date.now() });

          if (clients[sessionId]) {
            clients[sessionId].write(`data: ${JSON.stringify({ sender: 'bot', text: botReply, systemEvent: 'session_ended' })}\n\n`);
            clients[sessionId].end();
            delete clients[sessionId];
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            systemEvent: 'session_ended',
            reply: botReply
          }));
        }

        const previousBotMsg = (recentHistory.filter(h => h.role === 'assistant').slice(-1)[0]?.content || '').toLowerCase();
        const wasAskedForContact = previousBotMsg.includes('asesor') || previousBotMsg.includes('teléfono') || previousBotMsg.includes('correo') || previousBotMsg.includes('contacto') || previousBotMsg.includes('cotización especial') || previousBotMsg.includes('derivar');

        const isTransferTrigger = botReply.includes('[TRANSFERIR_ASESOR]') ||
                                  /quiero hablar con un humano|comun[ií]came con un asesor|asesor humano|persona real|licitaci[oó]n|compra mayorista|no responde|hablar con alguien|ejecutivo|comercial humano|pero ustedes me vendieron|la vez pasada|ya les he comprado|ya compr[eé]|pedido especial|sobre pedido|kit de derrame|derrames|puntos ecol[oó]gicos|punto ecol[oó]gico|canecas de reciclaje/i.test(text) ||
                                  /(?:un|el) asesor (?:humano|comercial)|notificado a nuestro equipo|atenci[oó]n personalizada|tomar[aá] la conversaci[oó]n|equipo comercial.*gestiona/i.test(botReply) ||
                                  Boolean(sessions[sessionId].intakeStage) ||
                                  (wasAskedForContact && (sessions[sessionId].userPhone || sessions[sessionId].userEmail));

        if (isTransferTrigger) {
          // If active intake stage in progress, process the current stage input:
          if (sessions[sessionId].intakeStage === 'ask_name') {
            if (parsedLead.name || isValidPersonName(text)) {
              sessions[sessionId].contactName = parsedLead.name || text.trim();
              sessions[sessionId].userName = sessions[sessionId].contactName;
              if (parsedLead.company) {
                sessions[sessionId].companyName = parsedLead.company;
                sessions[sessionId].clientType = 'JURIDICA';
                sessions[sessionId].clientTypeConfirmed = true;
                sessions[sessionId].userName = `${sessions[sessionId].contactName} (${sessions[sessionId].companyName})`;
              }
              if (parsedLead.phone) sessions[sessionId].userPhone = parsedLead.phone;
              if (parsedLead.email) sessions[sessionId].userEmail = parsedLead.email;
            }
          } else if (sessions[sessionId].intakeStage === 'ask_type') {
            if (/empresa|jur[ií]dica|compa[ñn][ií]a|negocio|organizaci[oó]n|a nombre de una empresa/i.test(text)) {
              sessions[sessionId].clientType = 'JURIDICA';
              sessions[sessionId].clientTypeConfirmed = true;
              sessions[sessionId].companyName = null;
            } else if (/particular|persona natural|propio|personal|natural|independiente|como particular/i.test(text)) {
              sessions[sessionId].clientType = 'NATURAL';
              sessions[sessionId].clientTypeConfirmed = true;
              sessions[sessionId].companyName = 'Persona Natural';
            } else if (parsedLead.company) {
              sessions[sessionId].companyName = parsedLead.company;
              sessions[sessionId].clientType = 'JURIDICA';
              sessions[sessionId].clientTypeConfirmed = true;
            }
          } else if (sessions[sessionId].intakeStage === 'ask_company') {
            const comp = cleanCompany(text) || text.trim();
            if (comp && !INVALID_NAME_WORDS.has(comp.toLowerCase())) {
              sessions[sessionId].companyName = comp;
              sessions[sessionId].clientType = 'JURIDICA';
              sessions[sessionId].clientTypeConfirmed = true;
              if (sessions[sessionId].contactName) {
                sessions[sessionId].userName = `${sessions[sessionId].contactName} (${sessions[sessionId].companyName})`;
              }
            }
          }

          const hasContact = Boolean(sessions[sessionId].userPhone || sessions[sessionId].userEmail);
          const hasName = Boolean(sessions[sessionId].contactName);
          const isTypeConfirmed = Boolean(sessions[sessionId].clientTypeConfirmed || sessions[sessionId].companyName);

          if (!hasName) {
            // Stage 1: Concise ask for name
            sessions[sessionId].intakeStage = 'ask_name';
            shouldTransfer = false;
            botReply = `¡Con gusto! Para gestionar tu solicitud, por favor indícame tu nombre.`;
          } else if (!isTypeConfirmed) {
            // Stage 2: Concise ask for client type with interactive option buttons
            sessions[sessionId].intakeStage = 'ask_type';
            shouldTransfer = false;
            const firstName = sessions[sessionId].contactName.split(' ')[0];
            botReply = `¡Mucho gusto, ${firstName}! ¿Nos escribes a nombre de una empresa o como particular?\n\n[OPCIONES_CLIENTE_TIPO]`;
          } else if (sessions[sessionId].clientType === 'JURIDICA' && !sessions[sessionId].companyName) {
            // Stage 3: Ask for company name if corporate
            sessions[sessionId].intakeStage = 'ask_company';
            shouldTransfer = false;
            botReply = `¿Cuál es el nombre o razón social de tu empresa?`;
          } else if (!hasContact) {
            // Stage 4: Concise ask for contact channel
            sessions[sessionId].intakeStage = 'ask_contact';
            shouldTransfer = false;
            botReply = `Por favor compártenos tu número de teléfono / WhatsApp o correo electrónico para conectar tu atención.`;
          } else {
            // Stage 5: All required data captured -> Transfer immediately to online live advisor!
            sessions[sessionId].intakeStage = null;
            shouldTransfer = true;
            sessions[sessionId].humanTransferred = true;
            const firstName = sessions[sessionId].contactName ? sessions[sessionId].contactName.split(' ')[0] : (sessions[sessionId].userName && sessions[sessionId].userName !== 'Visitante' ? sessions[sessionId].userName.split('(')[0].trim() : '');
            botReply = `¡Listo${firstName ? ', ' + firstName : ''}! Te estoy conectando con un asesor comercial aquí en línea para atender tu solicitud. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.`;

            // Execute transfer to Telegram and Coralis CRM!
            executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Transferencia a Asesor Humano');
          }

          botReply += `\n\n[SET_PROFILE:name=${sessions[sessionId].contactName || ''}|company=${sessions[sessionId].companyName || ''}|type=${sessions[sessionId].clientType || 'NATURAL'}|email=${sessions[sessionId].userEmail || ''}|phone=${sessions[sessionId].userPhone || ''}]`;
        }

        sessions[sessionId].history.push({ sender: 'bot', text: botReply, timestamp: Date.now() });

        if (clients[sessionId]) {
          clients[sessionId].write(`data: ${JSON.stringify({ sender: 'bot', text: botReply, providerUsed: aiResult.providerUsed, triggerTransfer: shouldTransfer })}\n\n`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          humanTransferred: shouldTransfer,
          triggerTransfer: shouldTransfer,
          reply: botReply,
          providerUsed: aiResult.providerUsed,
          updatedUserName: sessions[sessionId].userName
        }));
      } catch (llmErr) {
        console.error('[RAG ENGINE] All LLM providers failed. Executing fallback to Human Transfer:', llmErr.message);

        // Fallback: Transfer to Human Operator per user preference
        sessions[sessionId].humanTransferred = true;
        const fallbackMsg = "Te estoy conectando con uno de nuestros asesores comerciales humanos de ALACOR S.A.S. La conexión tomará entre 2 y 3 minutos, por favor permanece en línea.";

        sessions[sessionId].history.push({ sender: 'bot', text: fallbackMsg, timestamp: Date.now() });

        if (clients[sessionId]) {
          clients[sessionId].write(`data: ${JSON.stringify({ sender: 'bot', text: fallbackMsg, transferred: true })}\n\n`);
        }

        executeHumanTransfer(sessionId, sessions[sessionId].userName || userName || 'Visitante', 'Fallo de IA / Escalado Humano');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          humanTransferred: true,
          reply: fallbackMsg,
          updatedUserName: sessions[sessionId].userName
        }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 3. Silent Handover/Transfer: POST /api/chat/transfer
  if (pathname === '/api/chat/transfer' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { sessionId, userName, history } = body;

      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing sessionId.' }));
      }

      if (!sessions[sessionId]) {
        sessions[sessionId] = { humanTransferred: true, userName: userName || 'Visitante', history: [] };
      } else {
        sessions[sessionId].humanTransferred = true;
        if (userName) sessions[sessionId].userName = userName;
      }

      if (history && Array.isArray(history)) {
        sessions[sessionId].history = history;
      }

      console.log(`Activating Silent Human Handover for Session ${sessionId}`);
      executeHumanTransfer(sessionId, sessions[sessionId].userName, 'Solicitud de Asesor Humano');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 3B. Agent Reply from Coralis CRM or external API: POST /api/chat/agent-reply
  if (pathname === '/api/chat/agent-reply' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { sessionId, text, agentName } = body;

      if (!sessionId || !text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing sessionId or text.' }));
        return;
      }

      const displayAgentName = agentName || 'Asesor Comercial ALACOR';

      if (!sessions[sessionId]) {
        sessions[sessionId] = { humanTransferred: true, userName: 'Visitante', history: [], lastAdvisorResponseTime: Date.now(), advisorAnswered: true };
      } else {
        sessions[sessionId].humanTransferred = true;
        sessions[sessionId].lastAdvisorResponseTime = Date.now();
        sessions[sessionId].advisorAnswered = true;
      }

      const msgPayload = {
        sender: 'assistant',
        text: `${displayAgentName}: ${text}`,
        agentName: displayAgentName,
        source: 'coralis',
        timestamp: Date.now()
      };

      sessions[sessionId].history.push(msgPayload);
      logToCrm('agent_message', sessionId, { text, agentName: displayAgentName, source: 'coralis' });

      // 1. Forward directly to client via SSE stream
      const clientRes = clients[sessionId];
      if (clientRes) {
        console.log(`[CORALIS CRM] Forwarding agent reply to web client ${sessionId}: ${text}`);
        clientRes.write(`data: ${JSON.stringify(msgPayload)}\n\n`);
      }

      // 2. Also forward a sync copy to Telegram so operators on Telegram stay 100% in sync
      if (config.enabled) {
        let targetChatId = sessions[sessionId].chatId;
        if (!targetChatId) {
          const activeAccounts = (config.accounts || []).filter(a => a.enabled && a.chatId);
          if (activeAccounts.length > 0) {
            targetChatId = activeAccounts[0].chatId;
          } else {
            targetChatId = config.chatId;
          }
        }
        if (targetChatId) {
          makeTelegramRequest('sendMessage', {
            chat_id: targetChatId,
            text: `👔 [Asesor Coralis CRM: ${displayAgentName}] (${sessionId}):\n\n${text}`
          }).catch(err => console.error('Failed to notify Telegram of CRM reply:', err.message));
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deliveredToClient: !!clientRes }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Requirement 1: Sincronización de Borrado de Coralis CRM (POST /api/chat/purge-session o DELETE /api/chat/session)
  if ((pathname === '/api/chat/purge-session' && req.method === 'POST') ||
      (pathname === '/api/chat/session' && req.method === 'DELETE')) {
    try {
      const body = req.method === 'POST' ? await parseJsonBody(req) : {};
      const sessionId = body.sessionId || parsedUrl.searchParams.get('sessionId');

      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing sessionId parameter.' }));
        return;
      }

      const purged = purgeSession(sessionId, 'coralis_crm_delete');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, purged, sessionId }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 4. Config Endpoint: GET & POST /api/chat/config
  if (pathname === '/api/chat/config') {
    // Check password header for security
    const password = req.headers['x-admin-password'] || parsedUrl.searchParams.get('password');
    const isAdmin = password === 'alacor2026';

    if (req.method === 'GET') {
      // Return public settings, mask token and chatId if not authenticated admin
      const publicConfig = {
        enabled: config.enabled,
        welcomeMessage: config.welcomeMessage,
        botToken: isAdmin ? config.botToken : (config.botToken ? `${config.botToken.substring(0, 8)}...` : ''),
        chatId: isAdmin ? config.chatId : (config.chatId ? `${config.chatId.substring(0, 4)}...` : ''),
        accounts: (config.accounts || []).map(acc => ({
          id: acc.id,
          name: acc.name,
          priority: acc.priority,
          enabled: acc.enabled,
          chatId: isAdmin ? acc.chatId : (acc.chatId ? `${acc.chatId.substring(0, 4)}...` : '')
        }))
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(publicConfig));
      return;
    }

    if (req.method === 'POST') {
      if (!isAdmin) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized. Invalid admin password.' }));
        return;
      }

      try {
        const body = await parseJsonBody(req);
        const { botToken, chatId, enabled, welcomeMessage, accounts } = body;

        // Save fields (make sure we don't save masked values)
        if (botToken !== undefined && !botToken.includes('...')) {
          config.botToken = botToken.trim();
        }
        if (chatId !== undefined && !chatId.includes('...')) {
          config.chatId = chatId.trim();
        }
        if (enabled !== undefined) {
          config.enabled = !!enabled;
        }
        if (welcomeMessage !== undefined) {
          config.welcomeMessage = welcomeMessage.trim();
        }
        if (accounts !== undefined && Array.isArray(accounts)) {
          const updatedAccounts = [];
          for (const acc of accounts) {
            const existing = (config.accounts || []).find(a => a.id === acc.id);
            let newChatId = acc.chatId;
            if (newChatId && newChatId.includes('...')) {
              newChatId = existing ? existing.chatId : '';
            }
            updatedAccounts.push({
              id: acc.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              name: acc.name || 'Soporte',
              chatId: (newChatId || '').trim(),
              priority: Number(acc.priority) || 1,
              enabled: acc.enabled !== undefined ? !!acc.enabled : true
            });
          }
          config.accounts = updatedAccounts;
        }

        saveConfig();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // 5. Config Endpoint: GET & POST /api/config/ai & /api/config/ai/providers
  if (pathname === '/api/config/ai' || pathname === '/api/config/ai/providers') {
    const password = req.headers['x-admin-password'] || parsedUrl.searchParams.get('password');
    const isAdmin = password === 'alacor2026';

    if (req.method === 'GET') {
      const publicProviders = (aiConfig.providers || []).map(p => ({
        ...p,
        apiKey: isAdmin ? p.apiKey : (p.apiKey ? `${p.apiKey.substring(0, 6)}...${p.apiKey.slice(-4)}` : '')
      })).sort((a, b) => (Number(a.priority) || 1) - (Number(b.priority) || 1));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        activeModel: aiConfig.activeModel || 'fallback_chain',
        providers: publicProviders
      }));
      return;
    }

    if (req.method === 'POST') {
      if (!isAdmin) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized. Invalid admin password.' }));
        return;
      }

      try {
        const body = await parseJsonBody(req);
        if (Array.isArray(body.providers)) {
          const updated = [];
          for (const rawP of body.providers) {
            const existing = (aiConfig.providers || []).find(p => p.id === rawP.id);
            let finalKey = rawP.apiKey;
            if (finalKey && finalKey.includes('...')) {
              finalKey = existing ? existing.apiKey : '';
            }
            updated.push({
              id: rawP.id || `prov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              name: rawP.name || 'Proveedor LLM',
              provider: (rawP.provider || 'GEMINI').toUpperCase(),
              model: rawP.model || 'gemini-2.5-flash',
              temperature: Number(rawP.temperature) || 0.8,
              apiKey: (finalKey || '').trim(),
              priority: Number(rawP.priority) || 1,
              enabled: rawP.enabled !== undefined ? !!rawP.enabled : true,
              status: rawP.status || 'LISTO',
              errorCount: rawP.errorCount || 0,
              lastError: rawP.lastError || null,
              lastUsed: rawP.lastUsed || null
            });
          }
          aiConfig.providers = updated;
        }
        if (body.activeModel) aiConfig.activeModel = body.activeModel;

        saveAiConfig();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, providers: aiConfig.providers }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // 5B. Test LLM Provider Endpoint: POST /api/config/ai/test-provider
  if (req.method === 'POST' && pathname === '/api/config/ai/test-provider') {
    const password = req.headers['x-admin-password'] || parsedUrl.searchParams.get('password');
    const isAdmin = password === 'alacor2026';
    if (!isAdmin) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized. Invalid admin password.' }));
    }

    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const { providerId, providerData } = JSON.parse(body || '{}');
        let prov = (aiConfig.providers || []).find(p => p.id === providerId);
        if (!prov && providerData) {
          prov = providerData;
        }
        if (!prov || !prov.apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Provider configuration or API key missing.' }));
        }

        console.log(`[LLM GATEWAY] Testing provider connection for ${prov.name}...`);
        const testRes = await callSingleLlmProvider(
          prov,
          'Responde brevemente con la palabra "OK".',
          'Hola, prueba de conectividad.'
        );

        prov.status = 'LISTO';
        prov.errorCount = 0;
        prov.lastError = null;
        prov.lastUsed = new Date().toISOString();
        saveAiConfig();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, response: testRes, status: 'LISTO' }));
      } catch (e) {
        const errCode = e.statusCode || (e.message.includes('429') ? 429 : 500);
        const errDetail = errCode === 429 ? '429 | SIN SALDO / LIMITE CUOTA' : (e.message || 'Error de conexión');
        const targetProv = (aiConfig.providers || []).find(p => p.id === JSON.parse(body || '{}').providerId);
        if (targetProv) {
          targetProv.errorCount = (targetProv.errorCount || 0) + 1;
          targetProv.status = `⚠️ ${targetProv.errorCount} ERR (${errDetail})`;
          targetProv.lastError = e.message;
          saveAiConfig();
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message, status: `⚠️ 1 ERR (${errDetail})` }));
      }
    });
    return;
  }

  // ── ML: Classify a query (with Resilient LLM Fallback) ─────────────────────
  if (req.method === 'POST' && pathname === '/api/chat/classify') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const { query, sessionId } = JSON.parse(body || '{}');
        if (!query) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'query required' }));
        }
        const result = mlEngine.classify(query);
        if (result.matched) {
          logToCrm('bot_classification', sessionId || 'anon', { query, match: true, category: result.category, score: result.score, answer: result.answer || result.text });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(result));
        }

        // ML match failed; attempt Resilient LLM Fallback Chain if providers are configured
        const hasActiveLlm = (aiConfig.providers || []).some(p => p.enabled && p.apiKey);
        if (hasActiveLlm) {
          try {
            console.log(`[ML FALLBACK] Query "${query}" unmatched in local ML. Executing Resilient LLM Gateway...`);
            const sysPrompt = 'Eres el asistente virtual comercial y técnico de ALACOR S.A.S., experto en EPP (Elementos de Protección Personal), Calzado Dieléctrico/Composite, Trabajo en Alturas y SG-SST en Colombia. Responde de forma amable, precisa, profesional y concisa (máximo 3 párrafos).';
            const llmRes = await executeLlmsWithFallback(sysPrompt, query);
            
            logToCrm('bot_classification_llm', sessionId || 'anon', { query, match: true, category: 'llm_fallback', providerUsed: llmRes.providerUsed, answer: llmRes.text });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              matched: true,
              score: 95,
              answer: llmRes.text,
              text: llmRes.text,
              category: 'llm_fallback',
              exampleId: `llm_${Date.now()}`
            }));
          } catch (llmErr) {
            console.error('[ML FALLBACK] LLM Gateway fallback failed:', llmErr.message);
          }
        }

        // Complete fallback if both ML and LLMs fail
        logToCrm('bot_classification', sessionId || 'anon', { query, match: false, category: null, score: result.score, answer: null });
        mlEngine.saveUnmatchedQuery(query, sessionId || 'anon', result.score);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Lead capture: receive and forward to Telegram ─────────────────────────
  if (req.method === 'POST' && pathname === '/api/chat/lead') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { lead, productContext, summary, sessionId, userName } = JSON.parse(body || '{}');
        if (!lead) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'lead required' }));
        }

        logToCrm('lead_captured', sessionId || 'anon', { lead, productContext, summary });

        // Send to all enabled Telegram accounts
        const activeAccounts = (config.accounts || []).filter(a => a.enabled && a.chatId);
        const msg = summary || (
          `🎯 NUEVO LEAD — ALACOR S.A.S.\n` +
          `👤 ${lead.name || 'Sin nombre'}\n` +
          `🏢 ${lead.company || 'Persona natural'}\n` +
          `📱 ${lead.contact || 'Sin contacto'}\n` +
          `📊 ${lead.customerType || '?'}\n` +
          `🛋️ ${productContext || 'Precios / cotización'}\n` +
          `🔗 Sesión: ${sessionId || 'anon'}`
        );

        if (activeAccounts.length > 0 && config.botToken) {
          activeAccounts.forEach(acc => {
            makeTelegramRequest('sendMessage', {
              chat_id: acc.chatId,
              text: msg,
              parse_mode: 'HTML'
            }).catch(() => {});
          });
        }

        // Ingest transfer/lead to Coralis CRM (Port 8008)
        sendTransferToCoralisCrm(sessionId, 'Captura de Lead / Cotización', {
          name: lead.name,
          contact: lead.contact,
          phone: lead.contact
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── ML: Get all approved training examples (admin) ────────────────────────
  if (req.method === 'GET' && (pathname === '/api/chat/training-examples' || pathname === '/api/chat/examples')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mlEngine.getTrainingExamples ? mlEngine.getTrainingExamples() : []));
    return;
  }

  // ── ML: Get unmatched queries (admin) ─────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/chat/unmatched') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mlEngine.getUnmatchedQueries()));
    return;
  }

  // ── ML: Add new training example (admin) ──────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/chat/train') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { input, answer, category, unmatchedId } = JSON.parse(body || '{}');
        if (!input || !answer) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'input and answer are required' }));
        }
        const id = mlEngine.addExample(input, answer, category || 'general');
        if (unmatchedId) mlEngine.resolveUnmatched(unmatchedId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id, stats: mlEngine.getStats() }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── ML: Resolve/dismiss an unmatched query (admin) ────────────────────────
  if (req.method === 'POST' && pathname === '/api/chat/feedback') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { unmatchedId } = JSON.parse(body || '{}');
        if (unmatchedId) mlEngine.resolveUnmatched(unmatchedId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, stats: mlEngine.getStats() }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── ML: Stats endpoint ────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/chat/ml-stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mlEngine.getStats()));
    return;
  }

  // ── Full Context Human Handover Endpoint: POST /api/chat/transfer-with-context ────
  if (pathname === '/api/chat/transfer-with-context' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { sessionId, leadData, history, notes } = body;

      if (!sessionId || !leadData) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing sessionId or leadData' }));
      }

      // Update session state
      if (!sessions[sessionId]) {
        sessions[sessionId] = { humanTransferred: true, userName: leadData.name || 'Visitante', history: [] };
      } else {
        sessions[sessionId].humanTransferred = true;
        if (leadData.name) sessions[sessionId].userName = leadData.name;
      }
      sessions[sessionId].leadData = leadData;

      if (Array.isArray(history)) {
        sessions[sessionId].history = history;
      }

      console.log(`[HUMAN HANDOVER] Session ${sessionId} transferred with full context for client: ${leadData.name} (${leadData.phone || leadData.email})`);

      // 1. Format clean conversation history for Telegram
      let historyStr = '';
      if (Array.isArray(history) && history.length > 0) {
        const filteredHistory = history.filter(h => {
          const text = h.text || '';
          return !text.includes('Bienvenido al canal') && !text.includes('SOLICITAR_DATOS_TRANSFERENCIA');
        });

        historyStr = filteredHistory
          .map(h => {
            const senderTag = h.sender === 'user' ? `👤 ${leadData.name || 'Cliente'}` : `🤖 Bot ALACOR`;
            return `${senderTag}: ${(h.text || '').replace(/\n/g, ' ')}`;
          })
          .join('\n');
      } else {
        historyStr = 'Sin historial previo.';
      }

      // 2. Build Rich Handover Alert Message
      const alertMsg = 
        `🔔 <b>[TRASPASO DE CLIENTE CON CONTEXTO COMPLETO]</b>\n\n` +
        `👤 <b>Cliente:</b> ${leadData.name || 'No indicado'}\n` +
        `🏢 <b>Empresa:</b> ${leadData.company || 'Persona Natural'}\n` +
        `📱 <b>Teléfono/Celular:</b> ${leadData.phone || 'No indicado'}\n` +
        `✉️ <b>Correo:</b> ${leadData.email || 'No indicado'}\n` +
        `📍 <b>Ciudad:</b> ${leadData.city || 'No indicada'}\n` +
        (notes ? `📝 <b>Notas adicionales:</b> ${notes}\n` : '') +
        `\n📋 <b>RESUMEN / HISTORIAL DE LA CONSULTA:</b>\n` +
        `<i>${historyStr.slice(-1500)}</i>\n\n` +
        `💬 <i>Responda directamente a este mensaje para hablar en vivo con el cliente en la web.</i>`;

      // 3. Send to Telegram accounts
      const activeAccounts = (config.accounts || []).filter(a => a.enabled && a.chatId);
      if (activeAccounts.length > 0 && config.botToken) {
        activeAccounts.forEach(acc => {
          makeTelegramRequest('sendMessage', {
            chat_id: acc.chatId,
            text: alertMsg,
            parse_mode: 'HTML'
          }).then(tgMsg => {
            if (tgMsg && tgMsg.message_id) {
              messageMappings[tgMsg.message_id] = sessionId;
            }
          }).catch(err => console.error('Failed to notify Telegram account:', err.message));
        });
      }

      // 4. Ingest to Coralis CRM (Port 8008)
      sendTransferToCoralisCrm(sessionId, 'Traspaso de Asesor con Contexto', {
        name: leadData.name,
        company: leadData.company,
        phone: leadData.phone,
        email: leadData.email,
        city: leadData.city,
        notes: notes
      });

      logToCrm('human_handover_with_context', sessionId, { leadData, notes });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Traspaso registrado con contexto completo.'
      }));
    } catch (e) {
      console.error('[HUMAN HANDOVER ERROR]', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ── Chat Unban / Reset Endpoint ─────────────────────────────────────────
  if (pathname === '/api/chat/unban' && req.method === 'POST') {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const cleanIp = String(clientIp).split(',')[0].trim();
    delete bannedClients[cleanIp];
    delete bannedClients['127.0.0.1'];
    delete bannedClients['::1'];
    delete bannedClients['::ffff:127.0.0.1'];
    delete bannedClients['localhost'];
    console.log(`[SECURITY UNBAN] Quarantine cleared for IP: ${cleanIp}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Sesión y dirección IP desbloqueadas exitosamente.' }));
  }

  // ── Newsletter & Habeas Data Endpoints (Ley 1581 de 2012) ────────────────
  if (pathname === '/api/newsletter/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { email, acceptedPolicy } = JSON.parse(body || '{}');
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Dirección de correo electrónico inválida.' }));
        }

        if (!acceptedPolicy) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Debe aceptar la Política de Tratamiento de Datos Personales (Ley 1581).' }));
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const existingIdx = subscribers.findIndex(s => s.email.toLowerCase() === cleanEmail);

        if (existingIdx >= 0) {
          subscribers[existingIdx].status = 'ACTIVO';
          subscribers[existingIdx].updatedAt = new Date().toISOString();
          subscribers[existingIdx].acceptedPolicy = true;
          subscribers[existingIdx].policyVersion = '1.0';
        } else {
          subscribers.push({
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            email: cleanEmail,
            status: 'ACTIVO',
            subscribedAt: new Date().toISOString(),
            acceptedPolicy: true,
            policyVersion: '1.0',
            ipAddress: String(clientIp).split(',')[0].trim()
          });
        }

        saveSubscribers();
        console.log(`[NEWSLETTER] New subscriber registered: ${cleanEmail}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          message: '¡Gracias por suscribirte! Recibirás nuestras novedades técnicas y de seguridad.'
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/newsletter/manage-privacy' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const { email, action, reason } = JSON.parse(body || '{}');
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (!cleanEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'El correo electrónico es requerido.' }));
        }

        const existingIdx = subscribers.findIndex(s => s.email.toLowerCase() === cleanEmail);

        if (action === 'DELETE_DATA') {
          // Derecho de Supresión Definitiva (Ley 1581)
          if (existingIdx >= 0) {
            subscribers.splice(existingIdx, 1);
            saveSubscribers();
            console.log(`[HABEAS DATA] Subscriber data permanently deleted: ${cleanEmail}`);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            action: 'DELETE_DATA',
            message: 'Tus datos personales han sido eliminados definitivamente de nuestra base de datos conforme a la Ley 1581 de 2012.'
          }));
        } else {
          // Desuscripción de mensajes (Opt-out)
          if (existingIdx >= 0) {
            subscribers[existingIdx].status = 'DESUSCRITO';
            subscribers[existingIdx].unsubscribedAt = new Date().toISOString();
            subscribers[existingIdx].unsubscribeReason = reason || 'Solicitud de usuario';
            saveSubscribers();
            console.log(`[HABEAS DATA] Subscriber opt-out: ${cleanEmail}`);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            action: 'UNSUBSCRIBE',
            message: 'Has sido dado de baja exitosamente. No recibirás más boletines informativos de ALACOR.'
          }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/newsletter/subscribers' && req.method === 'GET') {
    const password = req.headers['x-admin-password'] || parsedUrl.searchParams.get('password');
    if (password !== 'alacor2026') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized. Invalid admin password.' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      total: subscribers.length,
      active: subscribers.filter(s => s.status === 'ACTIVO').length,
      unsubscribed: subscribers.filter(s => s.status === 'DESUSCRITO').length,
      subscribers: subscribers
    }));
  }

  if (pathname.startsWith('/api/newsletter/subscriber/') && req.method === 'DELETE') {
    const password = req.headers['x-admin-password'] || parsedUrl.searchParams.get('password');
    if (password !== 'alacor2026') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized.' }));
    }

    const subId = pathname.replace('/api/newsletter/subscriber/', '');
    subscribers = subscribers.filter(s => s.id !== subId && s.email !== subId);
    saveSubscribers();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, subscribers }));
  }

  // ── CorePrice Catalog Proxy (CORS-free for browser) ──────────────────────────
  if ((pathname === '/api/v1/catalog' || pathname === '/api/coreprice/catalog') && req.method === 'GET') {
    try {
      const limit = parsedUrl.searchParams.get('limit') || '3000';
      const targetUrl = `https://coreprice.alacor.net/api/v1/catalog?limit=${limit}`;

      const cpRes = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': 'cp-web-2026-integracion-alacor'
        },
        cache: 'no-cache'
      });

      if (!cpRes.ok) {
        console.warn(`[COREPRICE PROXY] Upstream returned status ${cpRes.status}`);
        res.writeHead(cpRes.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Upstream error' }));
      }

      const data = await cpRes.json();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify(data));
    } catch (err) {
      console.error('[COREPRICE PROXY] Error proxying catalog:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // ── Static File / SPA Catch-All ──────────────────────────────────────────
  // Serve files from /dist for all non-API GET requests
  if (req.method === 'GET') {
    // Strip query string from pathname
    const cleanPath = pathname.split('?')[0];
    const filePath = path.join(DIST_DIR, cleanPath);
    // Security: prevent path traversal outside DIST_DIR
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    return serveStaticFile(res, filePath);
  }

  // Fallback 404 for non-GET non-API requests
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found.' }));
});

server.listen(PORT, () => {
  console.log(`ALACOR Chat Server running on http://localhost:${PORT}`);
});
