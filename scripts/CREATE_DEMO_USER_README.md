# GUÍA: CREAR USUARIO DEMO PARA TESTS E2E

**Fecha:** 2025-10-06  
**Propósito:** Configurar usuario de prueba para tests automatizados  
**Estado:** ✅ Script listo para ejecutar  

---

## 📋 RESUMEN

Los tests E2E requieren un usuario demo con credenciales conocidas para poder autenticarse automáticamente. Este script crea ese usuario en el sistema.

**Credenciales del Usuario Demo:**
- **Email:** demo@aicodementor.com
- **Password:** demo123
- **Display Name:** Usuario Demo

---

## 🚀 EJECUCIÓN

### Prerrequisitos

1. **Servidor Next.js corriendo** (puerto 3000)
   ```bash
   npm run dev
   ```

2. **Variables de entorno configuradas** (.env.local)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Ejecutar Script

```bash
npm run create:demo-user
```

**O directamente:**
```bash
node scripts/create-demo-user.js
```

---

## 📊 PROCESO DEL SCRIPT

El script realiza los siguientes pasos:

1. **Verificación:** Comprueba si el usuario demo ya existe
2. **Creación en Auth:** Registra el usuario en Supabase Auth
3. **Creación de Perfil:** Crea el perfil en la base de datos
4. **Verificación:** Confirma que las credenciales funcionan

---

## ✅ SALIDAS ESPERADAS

### Usuario Ya Existe
```
🔍 Verificando si el usuario demo ya existe...
✅ El usuario demo YA EXISTE y las credenciales funcionan correctamente
   User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Email: demo@aicodementor.com

🎯 No es necesario crear el usuario. Los tests E2E deberían funcionar.
```

### Usuario Creado Exitosamente
```
📝 Usuario demo no existe. Procediendo a crearlo...
✅ Usuario creado exitosamente en Supabase Auth
   User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Email: demo@aicodementor.com

📄 Intentando crear perfil en base de datos...
✅ Perfil creado exitosamente en base de datos

🔍 Verificando que las credenciales funcionan...
✅ Verificación exitosa: Las credenciales funcionan correctamente

🎉 USUARIO DEMO CREADO EXITOSAMENTE

📋 Resumen:
   ✅ Usuario creado en Supabase Auth
   ✅ Perfil creado en base de datos
   ✅ Credenciales verificadas y funcionando

🧪 Los tests E2E ahora deberían funcionar correctamente.
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: Variables de entorno no encontradas

**Problema:**
```
❌ ERROR: Variables de entorno de Supabase no encontradas
```

**Solución:**
- Verifica que `.env.local` existe
- Confirma que contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Error: Usuario ya existe con diferente contraseña

**Problema:**
```
❌ ERROR al crear usuario en Supabase Auth: User already registered
ℹ️  El usuario ya está registrado pero la contraseña es incorrecta.
```

**Solución:**
Opción 1 - Resetear contraseña desde Supabase Dashboard:
1. Ir a Supabase Dashboard → Authentication → Users
2. Buscar demo@aicodementor.com
3. Click en "..." → Reset Password
4. Configurar nueva contraseña: demo123

Opción 2 - Eliminar y recrear:
1. Eliminar usuario desde Supabase Dashboard
2. Ejecutar script de nuevo

### Error: No se puede conectar a localhost:3000

**Problema:**
```
⚠️  Warning: Usuario creado en Auth pero error en perfil
```

**Solución:**
- Asegúrate de que el servidor Next.js esté corriendo
- Ejecuta `npm run dev` en otra terminal
- Espera a que el servidor esté completamente iniciado
- Ejecuta el script de nuevo

---

## 🧪 VALIDAR FUNCIONAMIENTO

Después de crear el usuario, valida que todo funciona:

### 1. Login Manual
1. Ve a http://localhost:3000
2. Click en "Acceder a la Plataforma"
3. Usa credenciales:
   - Email: demo@aicodementor.com
   - Password: demo123
4. Deberías ser redirigido a /panel-de-control

### 2. Tests E2E
```bash
npm run test:e2e
```

**Esperado:**
- ✅ AUTH-001: Debe autenticar con credenciales válidas
- ✅ AUTH-002: Debe cerrar sesión correctamente
- ✅ Todos los tests que usan autenticación deberían pasar

---

## 📝 NOTAS TÉCNICAS

### ¿Por qué se necesita el usuario demo?

Los tests E2E necesitan autenticarse para probar funcionalidades protegidas. En lugar de usar credenciales reales de usuarios, se usa un usuario de prueba dedicado con credenciales conocidas.

### ¿Dónde se usan estas credenciales?

```javascript
// e2e/ai-code-mentor.spec.js
const TEST_CONFIG = {
  DEMO_EMAIL: 'demo@aicodementor.com',
  DEMO_PASSWORD: 'demo123',
  // ...
};
```

### Estructura del Usuario Demo

**En Supabase Auth:**
- ID único generado automáticamente
- Email: demo@aicodementor.com
- Password hash: (generado por Supabase)
- Metadata: { display_name: 'Usuario Demo' }

**En Base de Datos (tabla profiles):**
- user_id: (referencia al ID de Auth)
- email: demo@aicodementor.com
- display_name: Usuario Demo
- created_at: timestamp

---

## 🔄 MANTENIMIENTO

### Resetear Usuario Demo

Si necesitas limpiar y recrear el usuario:

```bash
# 1. Eliminar desde Supabase Dashboard
#    Authentication → Users → demo@aicodementor.com → Delete

# 2. Recrear
npm run create:demo-user
```

### Cambiar Credenciales

Si necesitas diferentes credenciales:

1. Edita `scripts/create-demo-user.js`:
   ```javascript
   const DEMO_EMAIL = 'tu-nuevo-email@ejemplo.com';
   const DEMO_PASSWORD = 'tu-nueva-password';
   ```

2. Edita `e2e/ai-code-mentor.spec.js`:
   ```javascript
   const TEST_CONFIG = {
     DEMO_EMAIL: 'tu-nuevo-email@ejemplo.com',
     DEMO_PASSWORD: 'tu-nueva-password',
     // ...
   };
   ```

3. Ejecuta script:
   ```bash
   npm run create:demo-user
   ```

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de ejecutar tests E2E, verifica:

- [ ] Servidor Next.js corriendo (`npm run dev`)
- [ ] Variables de entorno configuradas (.env.local)
- [ ] Usuario demo creado (`npm run create:demo-user`)
- [ ] Login manual funciona con credenciales demo
- [ ] Base de datos accesible

---

**Última actualización:** 2025-10-06  
**Misión:** 211.0 - Corrección de Tests E2E
