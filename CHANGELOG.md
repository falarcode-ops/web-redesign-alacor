# Changelog

## [1.7.0] - 2026-08-30
### Added
- **Módulo FAQ Industrial de Alto Valor & Retención de Tráfico:**
  - Sustitución de preguntas genéricas por 5 temáticas críticas para Jefes de SST y Coordinadores de Compras (Siniestralidad laboral 2023 CCS/Fasecolda, Requisitos de la Res. 4272 de 2021 en alturas, Verificación de EPP legal en Colombia, Multas del Decreto 472 de 2015 y Diferencias normativas N95 vs FFP2 vs KN95).
  - Mecanismo de citación discreta mediante `span` con `title` tooltip nativo, preservando la credibilidad sin enlaces salientes que faciliten el abandono del sitio.
  - Sincronización completa del grafo Schema.org `FAQPage` en `index.html` para indexación enriquecida en Google.
- **Paquete de Producción Hostinger Actualizado:**
  - Regenerado `01_alacor_sistema_core.zip` (462 KB) con rutas relativas POSIX estándar, bundle optimizado (`index-CDjvnoVd.js`), compresión `.htaccess` y metadatos SEO listos para extracción en `public_html`.

## [1.6.0] - 2026-08-29
### Added
- **Subsistema de Correo Corporativo SMTP en CorePrice:**
  - Nueva tabla `user_smtp_configs` para parametrizar de forma individual o corporativa servidores SMTP (Host, Puerto, Usuario, Contraseña, Protocolo SSL 465 / STARTTLS 587 y Nombre de Remitente).
  - Módulo independiente `EmailService` (`services/email_service.py`) con soporte RFC completo, pruebas de conexión en tiempo real (`/api/test_smtp`) y plantillas HTML con identidad corporativa ALACOR.
  - Interfaz de gestión y prueba SMTP dentro del modal de administración de usuarios en `alacor_dashboard.html` / `dashboard_app.js`.
- **Protocolo de Recuperación de Contraseñas por Autoservicio (`Forgot Password Flow`):**
  - Nueva tabla transaccional `password_resets` para almacenar tokens criptográficos uniuso con expiración de 30 minutos.
  - Endpoints públicos `/api/request_password_reset` y `/api/reset_password`.
  - Vistas frontend dedicadas: Modal interactivo en `login.html` y página de restablecimiento seguro `reset_password.html`.

### Fixed
- **Normalización Estructural de Autenticación:**
  - Implementada sanitización `LOWER(TRIM(email))` en el backend (`controllers/auth_controller.py`) y en `login.html` eliminando de raíz los errores de acceso por mayúsculas involuntarias o espacios de autocompletado.

## [1.5.0] - 2026-08-14
### Fixed
- **Resolución de ErrorBoundary:** Eliminadas colisiones de minificación y bucles de sincronización reactiva en el catálogo. Se separó el bundle de React (`vendor.js`) de la aplicación principal.
- **Sincronización Unificada SSOT:** Eliminadas funciones legacy desincronizadas (`ea`) que corrompían las claves maestras de líneas del catálogo (`SEGURIDAD INDUSTRIAL`, `TRABAJO SEGURO EN ALTURAS`, `CALZADO INDUSTRIAL`), unificando toda la ingesta y clasificación en `fetchLiveCatalog` (`src/services/catalogService.js`).
- **Navegación por Subcategorías y Familias de Productos:** Totalmente estabilizada la visualización de tarjetas de familias con variantes agrupadas (`ProductFamilyCard`) y mallas de subcategorías (`SubcategoryGrid`).

### Added
- **Integración CRM CORALIS:** Despacho de cotizaciones formales hacia el endpoint público `https://coralis.alacor.net/api/v1/requests/public` con cálculo dinámico de totales, desglose de ítems, captación de datos de contacto DIAN y generación automática de enlace WhatsApp.

## [1.4.0] - 2026-07-30
### Added
- Matriz de gestión de proveedores LLM en la interfaz de administración ("PROVEEDORES CONFIGURADOS") idéntica al diseño de referencia con ordenamiento por prioridad, insignias por motor (`GEMINI`, `GITHUB`, `OPENAI`, `CLAUDE`), indicadores de estado (`LISTO` / `⚠️ ERR 429`), prueba de conexión directa (`▷`), edición (`✏️`) y eliminación (`🗑️`).
- Motor de conmutación por error `ResilientLLMGateway` en `chat-server.cjs` con ordenamiento por prioridad, reintentos en tiempo real, captura de límites de cuota (HTTP 429) y persistencia del estado en `ai-config.json`.
- Endpoints de administración `/api/config/ai/providers` y `/api/config/ai/test-provider`.
- Integración de fallback automático desde la clasificación local ML a la matriz de proveedores LLM activos cuando no se encuentra coincidencia directa de intención.
### Fixed
- Resuelta la falta de respuesta del chatbot web al dinamizar `CHAT_API_URL` para adaptarse a cualquier host/origen (`localhost`, IP local o dominio) en lugar de una IP fija.
- Corregida la falsificación de sesiones bloqueadas eliminando la restricción de 10 no-vocales seguidas sobre códigos de productos o referencias ANSI.
- Solucionada la propiedad nula `result.text` vs `result.answer` en las respuestas devueltas al bot.

### Added
- Lema/Stemmer en español y vectorización por n-gramas (bigramas) en el motor de clasificación ML (`ml-engine.cjs`).
- Reducción adaptativa del umbral de confianza cosine similarity a 0.35 para mayor cobertura de intención.
### Added
- Nueva vertical de negocios SG-SST (Sistema de Gestión de la Seguridad y Salud en el Trabajo) para micro y pequeñas empresas.
- Módulo e interfaz interactiva `SgsstSection` con Wizard de Onboarding de 4 pasos (Datos de Empresa, Diagnóstico Inicial Res. 0312, Informe de Brechas y Selección de Plan).
- Integración en vivo con API `http://[REDACTED_API_HOST]:3000`:
  - Contrato A: `GET /api/v1/assessment/questions` (Diagnóstico dinámico según Res. 0312).
  - Contrato B: `POST /api/v1/onboarding/register` (Registro de empresas y guardado de respuestas en PostgreSQL).
  - Contrato C: Redirección directa y enlace de activación `http://[REDACTED_API_HOST]:3000/activate?token=...` al Portal de Clientes SG-SST (`/dashboard`).
- Algoritmo en JavaScript de validación y cálculo automático del Dígito de Verificación (DV) de la DIAN en tiempo real (Módulo 11).
- Modal `SgsstPortalLoginModal` para el acceso rápido de clientes existentes en la barra de navegación superior.

## [1.1.0] - 2026-05-11
### Added
- Metaetiquetas SEO avanzadas y Open Graph en `index.html`.
- Script de navegación asíncrono (`js/navigation.js`) con smooth scrolling.
- Sistema de inyección analítica diferida (`js/analytics.js`) para GA y Meta Pixel.

## [1.0.0] - 2026-05-11
### Added
- Inicialización de proyecto (Fase 1).
- Estructura base de HTML5 semántico (`index.html`).
- Módulos CSS (variables, layout, componentes).
- Diseño implementando estética Glassmorphism.
- Archivos de PWA (`manifest.json` y `sw.js`).
