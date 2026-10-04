# TECHNICAL HANDOVER REPORT (INFORME DE TRASPASO TÉCNICO)

**Fecha / Hora:** 2026-08-30 T08:10:00 -05:00  
**Proyecto:** ALACOR S.A.S. - Rediseño Web, E-commerce Industrial & COREPRICE Platform  
**Dominio de Pruebas Frontend:** https://testweb.alacor.net/  
**Dominio de Producción Web:** https://alacor.com.co/ (Paquete `01_alacor_sistema_core.zip` v1.7.0)  
**Dominio COREPRICE:** https://coreprice.alacor.net/  
**Servidor Remoto SSH:** [REDACTED_USER]@[REDACTED_IP]  
**Entorno Local OS:** Windows  
**Directorio de Backup de Sesión:** backup_session_20260829_210200/  

---

## 0. REALITY AUDIT (AUDITORÍA DE REALIDAD DE PUERTOS Y SERVICIOS)

### Puertos Activos Locales (Windows)
- **Port 5173 (TCP)**: Servidor de desarrollo Vite local (`npm run dev`).
- **Port 3000 (TCP)**: Servidor Node / Express de pruebas local.

### Puertos y Servicios Activos Remotos (Servidor SSH - Linux [REDACTED_IP])
- **Port 80 / 443 (TCP)**: Nginx Reverse Proxy (`https://testweb.alacor.net/` y `https://coreprice.alacor.net/`).
- **Port 3000 (TCP)**: Servidor de Chat / CRM Node.js PM2 (`alacor-chat-server` ID 11 & `coralis-crm` ID 14).
- **Port 8000 (TCP)**: Servicio CorePrice backend / API (`coreprice` ID 10).
- **PM2 Process Status (Servidor Remoto)**:
  - ID 10 | coreprice | online (Port 8000)
  - ID 11 | alacor-chat-server | online (Port 3000)
  - ID 14 | coralis-crm | online (Port 3000 /api/leads)
  - ID 15 | alacor-integrasst | online

---

## 1. STATE OF THE ART (LOGROS Y AVANCES DE LA SESIÓN)

1. **Módulo FAQ Industrial de Alto Valor & Retención de Tráfico (v1.7.0):**
   - 5 Preguntas estratégicas implementadas con datos oficiales verificados:
     * *Siniestralidad Laboral 2023:* 522.160 accidentes y 694 muertes (Fuente: CCS / Fasecolda).
     * *Trabajo en Alturas:* Novedades de la Resolución 4272 de 2021 (Fuente: Alcaldía Mayor de Bogotá / SISJUR).
     * *Verificación de EPP:* Protocolo de 3 documentos indispensables (Fuente: MinTrabajo SG-SST).
     * *Sanciones y Multas:* Graduación de hasta 500 SMMLV según Decreto 472 de 2015 (Fuente: Función Pública).
     * *Protección Respiratoria:* Comparativa normativa N95 vs FFP2 vs KN95 y número TC (Fuente: NIOSH / CDC).
   - **Mecanismo de Retención:** Citas configuradas en elementos `<span>` discretos con tooltip `title` nativo y `select-none`, impidiendo el abandono involuntario del sitio.
   - **Schema.org JSON-LD (@graph):** Sincronizado el bloque `FAQPage` en `index.html` con las 5 preguntas oficiales para Google Rich Snippets.
   - **Paquete Productivo Hostinger:** Generado `01_alacor_sistema_core.zip` (462 KB) con rutas POSIX estándar y bundle optimizado (`index-CDjvnoVd.js`).

2. **Depuración del Cotizador B2B:**
   - Precios monetarios 100% ocultos al cliente final en tarjetas y notas comerciales.
   - Tarjetas depuradas sin badges redundantes (`A COTIZAR (B2B)` eliminado).

3. **Arquitectura de Autenticación, SMTP y Recuperación en COREPRICE:**
   - **Normalización de Login:** Sanitización `LOWER(TRIM(email))` en backend y frontend para tolerar mayúsculas y espacios accidentales.
   - **Cuenta de Carolina:** Verificada y 100% funcional (`carolina.corredor@alacor.com.co` con clave `[REDACTED_PASSWORD]`).
   - **Subsistema SMTP por Usuario:** Creada tabla `user_smtp_configs`, módulo `services/email_service.py` con soporte SSL (465) / STARTTLS (587), formulario en `alacor_dashboard.html` y botón de prueba `/api/test_smtp`.
   - **Flujo de Recuperación por Autoservicio:** Tabla `password_resets` con tokens uniuso (30 min de vigencia), modal en `login.html`, página `reset_password.html` y endpoints `/api/request_password_reset` y `/api/reset_password`.

---

## 2. ARCHITECTURE MAP (MAPA DE ARCHIVOS CLAVE)

- **Página Web:**
  - `index.html`: Schema JSON-LD, geo-tags, OpenGraph y metadatos SEO.
  - `src/App.jsx`: SPA con SEO dinámico, módulo FAQ, cotizador B2B limpio y enrutamiento por hash.
  - `public/sitemap.xml`, `public/robots.txt`, `public/.htaccess`: Rastreo y caché.
  - `01_alacor_sistema_core.zip`: Paquete POSIX estándar listo para Hostinger (`public_html`).
- **COREPRICE (VPS `[REDACTED_IP]` en `/home/falarcon/mis_proyectos/coreprice/`):**
  - `services/email_service.py`: Servicio de despacho SMTP y verificación de conexión.
  - `controllers/auth_controller.py`: Control de acceso, login normalizado y recuperación de clave.
  - `routers/api_router.py`: Rutas de autenticación y SMTP.
  - `login.html`: Login con modal de recuperación.
  - `reset_password.html`: Interfaz de cambio seguro de clave.
  - `alacor_dashboard.html` & `dashboard_app.js`: Administración de usuarios con campos SMTP y test en vivo.

---

## 3. RESGUARDOS Y SEGURIDAD
- **Backup de Sesión:** `backup_session_20260829_210200/` generado y respaldos anteriores purgados.
- **Commits en Git:**
  - `73911d1`: feat(seo): optimizacion integral SEO, Schema.org JSON-LD, sitemap XML, meta tags dinamicos y modulo FAQ indexable.
  - `d4f4119`: feat(coreprice): subsistema SMTP corporativo, recuperacion de contrasenas y normalizacion de login.
