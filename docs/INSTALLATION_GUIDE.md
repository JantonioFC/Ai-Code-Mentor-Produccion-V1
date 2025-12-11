# ⚙️ GUÍA DE INSTALACIÓN TÉCNICA - AI CODE MENTOR

**Versión:** 1.0 (Arquitectura v19.3)  
**Stack:** Next.js Monolith + Supabase + Google Gemini AI  
**Entorno:** Local Development (Windows/Linux/Mac)

---

## 📋 REQUISITOS DEL SISTEMA

### **Software Base:**
- **Node.js:** v18.17.0 o superior (LTS recomendado).
- **Git:** Para control de versiones.
- **Navegador:** Chrome/Edge/Firefox actualizado (para soporte de Features modernas).

### **Servicios Externos (Gratuitos):**
1. **Google AI Studio:** Para obtener la `GEMINI_API_KEY`.
   - [Conseguir API Key](https://aistudio.google.com/)
2. **Supabase:** Para Base de Datos y Autenticación.
   - [Crear Proyecto Supabase](https://supabase.com/)

---

## 🚀 PASO A PASO: INSTALACIÓN DESDE CERO

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/ai-code-mentor-v5.git
cd ai-code-mentor-v5
```

### 2. Instalar Dependencias

Utilizamos `npm` para gestionar las dependencias del monorepo unificado.

```bash
npm install
```
> **Nota:** Si encuentras errores de dependencias peer, usa `npm install --legacy-peer-deps`.

### 3. Configuración de Variables de Entorno

El sistema necesita credenciales para funcionar. Crea un archivo `.env.local` en la raíz:

```bash
# Copiar plantilla base
cp .env.example .env.local
```

**Edita `.env.local` con tus credenciales reales:**

```env
# --- SUPABASE (Base de Datos & Auth) ---
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anonima-publica"
SUPABASE_SERVICE_ROLE_KEY="tu-clave-servicio-secreta" (Solo necesaria para scripts admin)

# --- GOOGLE AI (Inteligencia Artificial) ---
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL_NAME="gemini-2.5-flash" (Opcional, default: gemini-2.5-flash)

# --- SEGURIDAD ---
JWT_SECRET="tu-secreto-super-seguro-para-tokens"
```

### 4. Inicialización de Base de Datos

Debes crear las tablas necesarias en tu proyecto de Supabase.

1. Ve al **SQL Editor** en tu dashboard de Supabase.
2. Abre el archivo local: `supabase/migrations/irp_migration.sql`.
3. Copia el contenido del SQL y ejecútalo en Supabase.
4. **Verifica:** Deberías ver tablas como `users`, `irp_reviews`, `sandbox_history`.

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

- El servidor iniciará en: `http://localhost:3000`
- **Health Check:** Visita `http://localhost:3000/api/v2/health` para verificar que la IA responde.

---

## 🧪 VERIFICACIÓN DE INSTALACIÓN

Una vez corriendo, realiza estas pruebas para confirmar que todo funciona:

| Prueba | Acción | Resultado Esperado |
|--------|--------|-------------------|
| **Front** | Abrir `http://localhost:3000` | Carga Landing Page sin errores. |
| **Auth** | Ir a `/login` e ingresar | Redirige al Panel de Control. |
| **IA** | Ir a `/codigo` (Sandbox) | Genera una lección al enviar texto. |
| **DB** | Guardar lección en Sandbox | Aparece en el Historial (derecha). |

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### **Error: "API Key inválida" en Sandbox**
- Verifica que `GEMINI_API_KEY` en `.env.local` sea correcta.
- Asegúrate de haber reiniciado el servidor (`Ctrl+C` -> `npm run dev`) tras cambiar el .env.

### **Error: "Auth session missing" (401)**
- Revisa `NEXT_PUBLIC_SUPABASE_URL` y `ANON_KEY`.
- Asegúrate de que las cookies del navegador no estén bloqueadas.
- Limpia LocalStorage y Cookies e intenta loguearte de nuevo.

### **Error: Dependencias de "microservicio-irp"**
- **Solución:** La arquitectura actual es monolítica. Si ves referencias a carpetas antiguas, ignóralas. Todo corre desde la raíz.

---

## 📚 RECURSOS ADICIONALES

- [Arquitectura Viva (Técnica)](../ARQUITECTURA_VIVA/ARQUITECTURA_VIVA_v19.3.md)
- [Guía de Sandbox](../docs/USER_GUIDE_SANDBOX.md)
