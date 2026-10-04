# PROJECT KNOWLEDGE BASE & RECURRING ERROR PREVENTION

## 1. RECURRING ERRORS & MANDATORY SHIELDS

### A. TypeError: Cannot read properties of undefined (reading 'title')
- **Symptom**: The React app crashes at startup or category navigation, triggering ErrorBoundary fallback ("OPTIMIZANDO INTERFAZ ALACOR").
- **Root Cause #1 (Catálogo O)**: Un-guarded access to object properties when mapping categories (`O[A].title` or `O[A].sublines[qe].title`) when `A` or `qe` is undefined or contains legacy keys.
- **Mandatory Guard #1**:
  - Always insert `if (!t) return null;` at the beginning of any `.map()` iteration over dynamic category objects.
  - Use optional chaining: `O[A]?.title || 'Categoría'`.
  - Add reset effect: Reset category state `A` to `null` if `!O[A]`.

- **Root Cause #2 (Guía EPP w)**:
  - In `src/data/catalogData.js`, exporting `export const w = S;` destroys the `w` object (EPP Guide Data with risk activities).
  - **Mandatory Guard #2**:
    - **NEVER** export `export const w = S;` in `catalogData.js`.
    - `w` MUST remain as the dedicated EPP Guide Data object with all 6 risk activity keys and their respective `title`, `description`, and `obligatory` array.

### B. Business Line Category Icons Text Overlay
- **Symptom**: Category cards show raw text identifiers (`ShieldCheck`, `Anchor`, etc.) overlaying the image.
- **Root Cause**: `renderIcon` falling back to string span without SVG mapper.
- **Mandatory Guard**:
  - Maintain SVG vector icon mapper in `PortfolioView.jsx` for all standard category icon names.

### C. Chatbot Catalog Query Matching & Cart Awareness
- **Rule #1**: For specific requests (e.g. welding gloves), search SSOT catalogue without asking unnecessary qualifying questions (e.g. usage/gender on basic EPP).
- **Rule #2**: When user asks for custom fabrication or out-of-portfolio items, immediately initiate human advisor handover protocol.
- **Rule #3**: Detect items added to quotation cart and show contextual decision buttons.

### D. CorePrice User Authentication, Normalization & Password Recovery Flow
- **Rule #1 (Email Normalization)**: Always sanitize emails with `LOWER(TRIM(email))` in both backend queries (`WHERE LOWER(TRIM(email)) = ?`) and frontend forms to avoid false "Credenciales incorrectas" errors caused by capitalization or trailing whitespace.
- **Rule #2 (Salt Hashing)**: Passwords must be hashed using `hashlib.sha256((password + "alacor_secure_2026").encode()).hexdigest()`.
- **Rule #3 (Corporate SMTP & Password Recovery)**:
  - Table `user_smtp_configs`: Individual SMTP settings per user/admin (Host, Port, User, Pass, SSL/TLS, Sender Name).
  - Table `password_resets`: Single-use tokens with 30-minute expiration.
  - Module `services/email_service.py`: SSL (465) / STARTTLS (587) delivery with HTML branding.
  - Views: `login.html` (modal "¿Olvidaste tu contraseña?"), `reset_password.html` (interfaz de cambio seguro), y formulario SMTP en el modal de usuario de `alacor_dashboard.html`.

---

## 2. INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE

- **Production URL**: `https://testweb.alacor.net/`
- **CorePrice Platform URL**: `https://coreprice.alacor.net/`
- **SSH Remote Server**: `[REDACTED_USER]@[REDACTED_IP]`
- **Remote Web Root**: `/home/alacor/comercial/dist/`
- **CorePrice Root**: `/home/falarcon/mis_proyectos/coreprice/`
- **CorePrice SQLite Database**: `/home/falarcon/mis_proyectos/coreprice/alacor_intel.db`
- **Active PM2 Services (SSH [REDACTED_IP])**:
  - `ID 10`: `coreprice` (Port 8000)
  - `ID 11`: `alacor-chat-server` (Port 3000)
  - `ID 14`: `coralis-crm` (Port 3000 /api/leads)
  - `ID 15`: `alacor-integrasst`
