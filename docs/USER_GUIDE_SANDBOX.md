# GUÍA DE USUARIO - SANDBOX CON HISTORIAL Y EXPORTACIÓN

**Sistema de Generación de Lecciones con IA** - Aprende creando tus propias lecciones interactivas

---

## 📋 CONTENIDO

1. [¿Qué es el Sandbox?](#qué-es-el-sandbox)
2. [Primeros Pasos](#primeros-pasos)
3. [Generar tu Primera Lección](#generar-tu-primera-lección)
4. [Usar el Historial](#usar-el-historial)
5. [Exportar Lecciones](#exportar-lecciones)
6. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)
7. [Preguntas Frecuentes](#preguntas-frecuentes)
8. [Solución de Problemas](#solución-de-problemas)

---

## 1. ¿QUÉ ES EL SANDBOX?

El **Sandbox de Aprendizaje** es una herramienta que te permite:

✨ **Generar lecciones interactivas personalizadas** sobre cualquier tema  
📚 **Guardar automáticamente** tus generaciones en un historial personal  
🔄 **Restaurar** lecciones anteriores cuando las necesites  
📥 **Exportar** tus lecciones a formato Markdown (.md) para usarlas offline  

### **¿Cómo funciona?**

1. **Escribes** sobre un tema que quieres aprender (mínimo 50 caracteres)
2. **La IA analiza** tu contenido y genera una lección estructurada
3. **Obtienes** una lección completa con:
   - 📖 Contenido educativo detallado
   - 🎯 3 ejercicios interactivos con respuestas
   - ✅ Explicaciones para reforzar el aprendizaje

### **¿Para quién es?**

- 🎓 **Estudiantes** que quieren reforzar lo aprendido en clase
- 👨‍💻 **Desarrolladores** que estudian nuevas tecnologías
- 📚 **Autodidactas** explorando nuevos temas
- 🧑‍🏫 **Educadores** creando material de estudio

---

## 2. PRIMEROS PASOS

### **Paso 1: Acceder al Sandbox**

1. Abre tu navegador en `http://localhost:3000`
2. Navega a la sección **"Sandbox"** en el menú principal
3. Verás la interfaz del Sandbox con:
   - **Área de texto grande** (izquierda): Para escribir tu contenido
   - **Panel de historial** (derecha): Tus generaciones guardadas

### **Paso 2: (Opcional) Iniciar Sesión**

**¿Es necesario iniciar sesión?**
- ✅ **NO** para generar lecciones
- ✅ **SÍ** para guardar en historial y recuperar después

**Si inicias sesión:**
- Tus generaciones se guardan automáticamente
- Puedes ver tu historial de hasta 20 lecciones
- Puedes restaurar generaciones anteriores

**Si NO inicias sesión:**
- Puedes generar lecciones normalmente
- Puedes exportarlas a Markdown
- NO se guardan en historial (se pierden al refrescar)

---

## 3. GENERAR TU PRIMERA LECCIÓN

### **Paso 1: Escribe tu Contenido**

En el área de texto grande, escribe sobre el tema que quieres aprender.

**Ejemplo de contenido válido:**

```
Python es un lenguaje de programación interpretado de alto nivel 
y propósito general. Fue creado por Guido van Rossum y lanzado en 
1991. Python enfatiza la legibilidad del código con su uso 
significativo de espacios en blanco. Sus construcciones de lenguaje 
y enfoque orientado a objetos tienen como objetivo ayudar a los 
programadores a escribir código claro y lógico para proyectos 
pequeños y grandes.
```

**Requisitos:**
- ✅ Mínimo 50 caracteres
- ✅ Máximo 50,000 caracteres
- ✅ Puede ser en cualquier idioma (español, inglés, etc.)
- ✅ Puede incluir emojis, código, etc.

---

### **Paso 2: Generar la Lección**

1. Haz clic en el botón **"Generar Lección Interactiva"** (azul, con ícono de cohete)
2. Verás un indicador de carga: **"Procesando con IA..."**
3. Espera **20-35 segundos** mientras la IA analiza tu contenido

**¿Qué está pasando?**
- 🤖 La IA lee tu contenido
- 🧠 Identifica conceptos clave
- 📝 Genera una lección estructurada
- 🎯 Crea 3 ejercicios específicos sobre tu tema

---

### **Paso 3: Revisar la Lección Generada**

Una vez completada, verás:

#### **📖 Contenido de la Lección:**
- Introducción al tema
- Conceptos clave explicados
- Ejemplos prácticos
- Analogías para mejor comprensión
- Mejores prácticas
- Conclusión

#### **🎯 Ejercicios Interactivos:**
- 3 preguntas de opción múltiple (A, B, C, D)
- Respuesta correcta marcada con ✅
- Explicación detallada de por qué es correcta

**Ejemplo de ejercicio:**
```
Ejercicio 1

¿Quién creó el lenguaje Python?

✅ A. Guido van Rossum
   B. James Gosling
   C. Brendan Eich
   D. Dennis Ritchie

Explicación:
Python fue creado por Guido van Rossum y lanzado en 1991...
```

---

### **Paso 4: (Automático) Guardado en Historial**

**Si estás autenticado:**
- ✅ La lección se guarda **automáticamente** en tu historial
- ✅ Verás un mensaje: **"Guardando en historial..."**
- ✅ El panel de historial (derecha) se actualiza mostrando tu nueva generación

**No tienes que hacer nada más, es automático.**

---

## 4. USAR EL HISTORIAL

### **Ver tus Generaciones Guardadas**

El **Panel de Historial** (columna derecha) muestra:
- 📊 Contador: **"X generación(es)"**
- 📋 Lista de tus últimas generaciones (hasta 20)
- 🕐 Fecha relativa: "Hace X minutos", "Hace X horas"

**Cada generación muestra:**
- 📝 **Título** (primeras palabras del contenido)
- 🕐 **Cuándo la creaste**
- ➕ **Botón para expandir/colapsar**

---

### **Expandir una Generación**

1. **Haz clic** en el card de cualquier generación
2. Se **expande** mostrando:
   - 👁️ Preview del contenido (primeras líneas)
   - ℹ️ Información adicional (caracteres procesados)
   - 🔄 Botón **"Restaurar Generación"**

---

### **Restaurar una Generación Anterior**

¿Quieres volver a ver una lección que generaste antes?

1. **Expande** la generación que quieres restaurar
2. Haz clic en **"Restaurar Generación"** (botón azul)
3. **Automáticamente:**
   - ✅ El área de texto se llena con tu contenido original
   - ✅ La lección completa se muestra abajo
   - ✅ Puedes exportarla o estudiarla de nuevo

**La página hace scroll automático al contenido restaurado.**

---

### **Recargar el Historial**

Si quieres actualizar la lista manualmente:
1. Haz clic en el **ícono de recarga** (🔄) en el header del panel
2. El historial se actualiza mostrando las generaciones más recientes

---

## 5. EXPORTAR LECCIONES

¿Quieres guardar una lección en tu computadora?

### **Paso 1: Generar o Restaurar una Lección**

Primero debes tener una lección visible en pantalla (ya sea recién generada o restaurada del historial).

---

### **Paso 2: Exportar a Markdown**

1. Busca el botón **"Exportar .md"** (verde, con ícono de descarga)
2. Haz clic en el botón
3. **¡Listo!** El archivo se descarga automáticamente

---

### **Paso 3: Encontrar tu Archivo**

El archivo se descarga en tu carpeta **Descargas** con el formato:
```
titulo-normalizado-YYYY-MM-DD-HH-MM-SS.md
```

**Ejemplo:**
```
python-lenguaje-de-programacion-2025-10-09-16-40-53.md
```

**Características del nombre:**
- ✅ Título normalizado (sin acentos, sin espacios)
- ✅ Fecha y hora exacta de exportación
- ✅ Fácil de identificar y ordenar

---

### **Paso 4: Abrir tu Archivo**

Puedes abrir el archivo `.md` con:
- **Notepad** (Windows)
- **TextEdit** (Mac)
- **Visual Studio Code** (recomendado para ver formato Markdown)
- **Obsidian, Notion, etc.** (apps de notas que soportan Markdown)

---

### **¿Qué contiene el archivo exportado?**

```markdown
# Título de la Lección

---
**Generado:** 2025-10-09 16:40:19
**Contenido procesado:** 350 caracteres
**Ejercicios:** 3
---

## 📖 Contenido de la Lección

[Tu lección completa aquí...]

## 🎯 Ejercicios Interactivos

### Ejercicio 1
[Preguntas con respuestas marcadas...]

---

*Generado por Sandbox de Aprendizaje - AI Code Mentor*
```

**Características:**
- ✅ Formato Markdown legible
- ✅ Emojis y caracteres especiales correctos
- ✅ Metadata útil (fecha, estadísticas)
- ✅ Ejercicios con respuestas correctas marcadas (✅)

---

## 6. CONSEJOS Y MEJORES PRÁCTICAS

### **Para Mejores Resultados:**

#### **✅ Contenido de Calidad:**
```
✅ BIEN:
"React es una biblioteca de JavaScript creada por Facebook 
en 2013. Se utiliza para construir interfaces de usuario 
interactivas mediante componentes reutilizables. React usa 
un Virtual DOM para optimizar las actualizaciones de la UI..."

❌ MAL:
"React. JavaScript. Facebook."
(Muy breve, sin contexto)
```

#### **✅ Longitud Óptima:**
- 📏 **Mínimo:** 50 caracteres (requerido)
- 🎯 **Óptimo:** 200-2000 caracteres
- 📚 **Máximo:** 50,000 caracteres

**Más contenido = Lección más detallada**

---

#### **✅ Estructura Clara:**
Si tu contenido tiene estructura, la lección será mejor:
```
✅ BIEN:
"Java: Origen, Características y Evolución

Java fue creado por James Gosling en 1995...

Características principales:
1. Independencia de plataforma
2. Orientado a objetos
3. Gestión automática de memoria..."

❌ MAL:
"java gosling 1995 oop plataforma independiente memoria..."
(Sin estructura, difícil de analizar)
```

---

#### **✅ Temas Específicos:**
La IA funciona mejor con temas concretos:
```
✅ BIEN: "El patrón Observer en programación"
✅ BIEN: "Fotosíntesis en plantas"
✅ BIEN: "Historia de la Segunda Guerra Mundial"

❌ MAL: "Cosas"
❌ MAL: "Todo sobre programación"
(Demasiado vago o amplio)
```

---

### **Gestionar tu Historial:**

#### **📊 Límite de 20 Generaciones**
- Solo puedes tener 20 generaciones guardadas
- Si alcanzas el límite, elimina las antiguas para crear nuevas
- Las más recientes aparecen primero

#### **🧹 Limpiar Generaciones Antiguas**
**¿Por qué limpiar?**
- Mantener tu historial organizado
- Liberar espacio para nuevas generaciones
- Más fácil encontrar lo que buscas

**¿Cómo eliminar?**
_(Nota: Función de eliminación se agregará en futuras versiones)_
Por ahora, las 20 más recientes se mantienen automáticamente.

---

### **Usar las Lecciones Exportadas:**

#### **📚 Crear tu Biblioteca Personal**
```
Carpeta: Mis Lecciones/
  ├─ Python/
  │  ├─ python-basico-2025-10-01.md
  │  ├─ python-clases-2025-10-05.md
  │  └─ python-decoradores-2025-10-09.md
  ├─ JavaScript/
  │  ├─ javascript-async-2025-09-28.md
  │  └─ javascript-promises-2025-10-03.md
  └─ Otros/
     └─ git-comandos-2025-10-07.md
```

#### **🔄 Reusar el Contenido**
- Copia/pega partes de la lección en tus notas
- Imprime para estudiar offline
- Comparte con compañeros de estudio

---

## 7. PREGUNTAS FRECUENTES

### **General**

**P: ¿Es gratis usar el Sandbox?**  
R: Sí, completamente gratuito.

**P: ¿Necesito crear una cuenta?**  
R: No es obligatorio. Puedes generar lecciones sin cuenta, pero NO se guardarán en historial.

**P: ¿Cuántas lecciones puedo generar?**  
R: Ilimitadas (sujeto a límites del servicio: ~1500/día).

**P: ¿En qué idiomas funciona?**  
R: Funciona con contenido en cualquier idioma. La lección se genera en el mismo idioma de tu input.

---

### **Generación**

**P: ¿Por qué tarda tanto en generar?**  
R: La IA necesita 20-35 segundos para analizar tu contenido y crear una lección de calidad. Es normal.

**P: ¿Puedo cancelar una generación en curso?**  
R: No por el momento. Espera a que termine o refresca la página.

**P: El título de mi lección no es relevante, ¿por qué?**  
R: Asegúrate de que tu contenido sea claro y específico sobre el tema. La IA analiza tu input para determinar el título.

**P: Los ejercicios no son sobre mi tema, ¿qué pasó?**  
R: Esto no debería ocurrir con el motor corregido. Si pasa, reporta el bug con tu contenido original.

---

### **Historial**

**P: ¿Dónde se guardan mis generaciones?**  
R: En una base de datos segura en Supabase. Solo tú puedes verlas (autenticación requerida).

**P: ¿Puedo ver el historial en otro dispositivo?**  
R: Sí, si inicias sesión con la misma cuenta, verás tu historial completo.

**P: ¿Por qué solo puedo tener 20 generaciones?**  
R: Es un límite para evitar abuso de almacenamiento. 20 es suficiente para uso normal. Elimina antiguas si necesitas más.

**P: ¿Cómo elimino una generación?**  
R: Esta función se agregará pronto. Por ahora, las más recientes permanecen automáticamente.

---

### **Exportación**

**P: ¿En qué formato se exporta?**  
R: Markdown (.md), un formato de texto plano fácil de leer y editar.

**P: Los caracteres especiales salen raros, ¿qué hago?**  
R: Asegúrate de abrir el archivo con un editor que soporte UTF-8 (VS Code, Notepad++, etc.). Si usas Notepad básico de Windows, puede tener problemas.

**P: ¿Puedo exportar a PDF o Word?**  
R: No directamente. Pero puedes:
  1. Abrir el `.md` en un editor Markdown
  2. Usar herramientas como Pandoc para convertir a PDF/DOCX

**P: ¿Por qué el nombre del archivo no tiene acentos?**  
R: Para compatibilidad universal. "características" → "caracteristicas" evita problemas en diferentes sistemas.

---

## 8. SOLUCIÓN DE PROBLEMAS

### **"Error: Contenido insuficiente"**
**Problema:** Tu texto tiene menos de 50 caracteres.  
**Solución:** Escribe al menos 50 caracteres sobre tu tema.

---

### **"Error 500: Internal Server Error"**
**Problema:** Error en el servidor.  
**Solución:**
1. Espera 30 segundos e intenta de nuevo
2. Si persiste, refresca la página
3. Si aún falla, reporta el bug con tu contenido

---

### **"Límite de generaciones alcanzado"**
**Problema:** Ya tienes 20 generaciones guardadas.  
**Solución:**
1. Exporta las generaciones que quieras conservar
2. Espera a que se implemente la función de eliminar
3. O crea una nueva cuenta (no recomendado)

---

### **La lección no se guarda en historial**
**Problema:** No estás autenticado.  
**Solución:**
1. Inicia sesión con tu cuenta
2. Genera la lección nuevamente
3. Debería guardarse automáticamente

---

### **El panel de historial no se actualiza**
**Problema:** Cache del navegador.  
**Solución:**
1. Haz clic en el ícono de recarga (🔄)
2. O refresca la página completa (F5)

---

### **El archivo exportado tiene caracteres raros**
**Problema:** Editor no soporta UTF-8 correctamente.  
**Solución:**
1. Usa un editor moderno: VS Code, Atom, Sublime Text
2. O configura tu editor actual para UTF-8:
   - Notepad++: Encoding > UTF-8
   - Notepad: Guardar como > Encoding: UTF-8

---

### **La generación se cuelga (más de 1 minuto)**
**Problema:** Timeout del servidor o problema con Gemini API.  
**Solución:**
1. Refresca la página
2. Intenta con contenido más corto
3. Espera unos minutos e intenta de nuevo

---

## 🎯 RESUMEN RÁPIDO

### **En 5 Pasos:**

1. **Escribe** sobre lo que quieres aprender (>50 caracteres)
2. **Genera** la lección (botón azul con cohete 🚀)
3. **Espera** 20-30 segundos
4. **Estudia** tu lección personalizada con ejercicios
5. **Exporta** a Markdown para guardar offline

### **Recuerda:**
- ✅ Inicia sesión para guardar en historial
- ✅ Máximo 20 generaciones guardadas
- ✅ Exporta lo que quieras conservar
- ✅ Contenido claro = Mejor lección

---

## 📞 SOPORTE

**¿Necesitas ayuda?**
- 📧 Contacta al equipo de desarrollo
- 🐛 Reporta bugs en el repositorio
- 💡 Sugiere mejoras

---

**¡Feliz aprendizaje! 🎓**

---

**Última Actualización:** 2025-10-09  
**Versión:** 1.0  
**Autor:** Mentor Coder - AI Code Mentor Team
