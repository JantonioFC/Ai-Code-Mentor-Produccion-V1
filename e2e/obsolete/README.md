# Archivos Obsoletos - Misión M-274

## 📁 Directorio de Archivos Archivados

Este directorio contiene archivos que fueron **deprecados** como parte de la **Misión M-274: Inyección Híbrida Verdadera**.

## ❌ Archivos Archivados

### 1. `global-setup.js`
**Fecha de Archivado:** Misión M-274  
**Razón:** Fallo arquitectónico fundamental en globalSetup

**Problema Identificado:**
- `storageState` solo inyectaba autenticación en el navegador
- **NO** inyectaba en contextos de `fetch()` del cliente
- **NO** inyectaba en contextos de `request()` (como teardown)
- Resultaba en fallos **401 Unauthorized** en llamadas API desde el cliente

### 2. `global-teardown.js`
**Fecha de Archivado:** Misión M-274  
**Razón:** Dependencia de globalSetup eliminado

**Problema Identificado:**
- `request.newContext` con `storageState` no inyectaba cookies en peticiones fetch
- Fallaba con **401 Unauthorized** al intentar limpiar estado
- Dependía de `globalSetup` que fue eliminado

## ✅ Solución Implementada (M-274)

### Arquitectura de Inyección Híbrida

**Archivo de Reemplazo:** `e2e/helpers/authHelper.js`

**Función Principal:** `authenticateHybrid(page)`

**Implementación:**
```javascript
import { authenticateHybrid } from './helpers/authHelper';

test.beforeEach(async ({ page }) => {
  await authenticateHybrid(page);
});
```

**Componentes de la Solución:**

1. **Cookie Injection** (Para Servidor/Middleware)
   - Inyecta cookie `sb-access-token` con token mock
   - El middleware (M-264) valida esta cookie en modo E2E

2. **Storage Injection** (Para Cliente/React)
   - Inyecta `localStorage.setItem('sb-supabase-auth-token', ...)`
   - El hook `useAuth` detecta autenticación activa

3. **Limpieza Inicial** (Reemplaza Teardown)
   - Limpia cookies y storage al inicio de cada test
   - Llama a `/api/auth/e2e-logout` para limpiar servidor
   - Garantiza aislamiento completo entre tests

## 📊 Beneficios de M-274 vs M-268

| Aspecto | M-268 (globalSetup) | M-274 (Inyección Híbrida) |
|---------|---------------------|---------------------------|
| **Autenticación Servidor** | ❌ Falla (storageState) | ✅ Exitosa (Cookie) |
| **Autenticación Cliente** | ✅ Funciona | ✅ Funciona (Storage) |
| **Aislamiento de Tests** | ⚠️ Compartido | ✅ Completo |
| **Limpieza de Estado** | ❌ Falla en teardown | ✅ Por-test |
| **Complejidad** | 🟡 Media | 🟢 Baja |
| **Estabilidad E2E** | 🔴 46/50 PASS | 🟢 49/50 PASS |

## 🚫 NO ELIMINAR

Estos archivos se conservan para:
- **Historia Arquitectónica**: Documentar decisiones de diseño
- **Aprendizaje**: Evitar repetir errores del pasado
- **Referencia**: Comparar soluciones entre misiones

## 📚 Referencias

- **Misión M-268:** Implementación de globalSetup
- **Misión M-270:** Identificación del problema de hidratación
- **Misión M-274:** Implementación de Inyección Híbrida Verdadera
- **Documento:** `e2e/M274_REVERSION_INSTRUCTIONS.md`

---

**Última Actualización:** Misión M-274  
**Mantenedor:** Mentor Coder  
**Arquitecto:** Supervisor
