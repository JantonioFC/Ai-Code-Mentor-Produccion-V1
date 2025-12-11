/**
 * ARM (MÓDULO DE RECUPERACIÓN ACTIVA) - EXTENSIONES EXTERNAS v1.0
 * 
 * MISIÓN 166 SUB-MISIÓN 166.3: INTEGRACIÓN ARM EXTERNO CON MOTOR RAG
 * 
 * Implementa el flujo Cache Hit/Cache Miss → Recuperador → Extractor → Caché
 * para integrar fuentes externas (URLs oficiales) con el Motor RAG existente.
 * 
 * Flujo ARM Completo:
 * 1. Motor RAG obtiene contexto curricular interno (retrieve_sources)
 * 2. ARM detecta URLs oficiales en recursos/ejercicios
 * 3. Para cada URL: Cache Hit/Miss → Recuperar → Extraer → Almacenar
 * 4. Contexto enriquecido = Curricular Interno + Contenido Externo
 * 
 * @author Mentor Coder
 * @version v1.0 - ARM Externo Integrado
 * @fecha 2025-09-18
 * @misión 166 - Completar construcción del ARM según ARQUITECTURA_VIVA v7.0
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * CONFIGURACIÓN ARM EXTERNO
 */
const ARM_CONFIG = {
  // Configuración Supabase (para acceso al caché)
  // IMPORTANTE: Estas variables DEBEN estar configuradas en .env.local
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  
  // Configuración de red resiliente optimizada
  FETCH_TIMEOUT: 5000, // 5 segundos (reducido para evitar delays)
  RETRY_ATTEMPTS: 2, // 2 intentos (reducido)
  RETRY_DELAY: 1000, // 1 segundo base
  
  // Configuración de caché
  CACHE_TTL_HOURS: 24, // 24 horas por defecto
  MAX_CONTENT_SIZE: 1024 * 1024, // 1MB máximo por URL
  
  // User-Agent para ciudadanía digital responsable
  USER_AGENT: 'AI Code Mentor ARM/1.0 (Educational Content Retriever; +https://github.com/ecosistema360)'
};

// Inicializar cliente Supabase para acceso al caché (solo si las credenciales están configuradas)
const supabase = ARM_CONFIG.SUPABASE_URL && ARM_CONFIG.SUPABASE_SERVICE_KEY 
  ? createClient(ARM_CONFIG.SUPABASE_URL, ARM_CONFIG.SUPABASE_SERVICE_KEY)
  : null;

/**
 * CONTENIDO CURADO INTERNO DE ALTA CALIDAD
 * Fallback inteligente cuando las fuentes externas fallan por CORS/Network
 */
const FALLBACK_CONTENT_DATABASE = {
  'https://ai.google/responsibility/principles/': {
    type: 'ai-principles',
    name: 'Principios de IA Responsable de Google',
    content: `Los 7 Principios de IA Responsable de Google:

1. IA debe ser socialmente beneficiosa: Los avances en IA deben generar beneficios sociales amplios y transformar positivamente campos como salud, seguridad, energía, transporte, fabricación y entretenimiento.

2. Evitar crear o reforzar sesgos injustos: Los sistemas de IA pueden reflejar, reforzar o reducir sesgos injustos. Donde los sesgos injustos puedan tener un impacto directo en las personas, se deben establecer salvaguardas apropiadas.

3. Ser construida y probada para seguridad: Desarrollar IA siguiendo las mejores prácticas en seguridad de software, incluyendo pruebas rigurosas y prácticas de desarrollo seguro.

4. Ser responsable ante las personas: Los sistemas de IA deben proporcionar oportunidades apropiadas para retroalimentación, explicaciones relevantes y apelación.

5. Incorporar principios de diseño de privacidad: Fomentar arquitecturas con salvaguardas de privacidad, y proporcionar transparencia y control apropiados sobre el uso de datos.

6. Mantener altos estándares de excelencia científica: El trabajo de IA técnico debe cumplir con altos estándares de excelencia científica y ser hecho disponible para escrutinio donde sea apropiado.

7. Estar disponible para usos que estén de acuerdo con estos principios: Las tecnologías tienen usos múltiples. Se debe trabajar para limitar aplicaciones potencialmente dañinas o abusivas.

Aplicaciones que Google NO desarrollará:
- Tecnologías que causen o faciliten daño general
- Armas u otras tecnologías cuyo propósito principal es causar lesión  
- Tecnologías que recojan información para vigilancia que viole normas internacionalmente aceptadas
- Tecnologías cuyo propósito contraríe principios de derecho internacional y derechos humanos

Estos principios guían el desarrollo ético de IA y son fundamentales para crear sistemas que beneficien a la humanidad de manera responsable.`,
    extractionMetadata: {
      contentLength: 1847,
      extractedAt: '2025-09-18T21:00:00.000Z',
      quality: 'curated-high',
      source: 'internal-fallback'
    }
  }
};

/**
 * RECUPERADOR (RETRIEVER) - COMPONENTE 1 DEL ARM
 * Cliente HTTP robusto con manejo resiliente de red
 * 
 * @param {string} url - URL a recuperar
 * @returns {Promise<string>} HTML crudo de la página
 * @throws {Error} En caso de fallo irrecuperable
 */
async function fetchRawHTML(url) {
  console.log(`🔄 [ARM RECUPERADOR] Iniciando descarga: ${url}`);
  
  // Validación de URL
  try {
    new URL(url);
  } catch {
    throw new Error(`URL inválida: ${url}`);
  }
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= ARM_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`   📡 Intento ${attempt}/${ARM_CONFIG.RETRY_ATTEMPTS}...`);
      
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ARM_CONFIG.FETCH_TIMEOUT);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': ARM_CONFIG.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal,
        redirect: 'follow',
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      // Verificar código de estado HTTP
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          // Errores 4xx - No reintentar
          throw new Error(`HTTP ${response.status}: ${response.statusText} - No reintentar`);
        } else if (response.status >= 500) {
          // Errores 5xx - Reintentar
          throw new Error(`HTTP ${response.status}: ${response.statusText} - Error servidor`);
        }
      }
      
      // Verificar tamaño del contenido
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > ARM_CONFIG.MAX_CONTENT_SIZE) {
        throw new Error(`Contenido demasiado grande: ${contentLength} bytes > ${ARM_CONFIG.MAX_CONTENT_SIZE}`);
      }
      
      const html = await response.text();
      
      // Verificar que el contenido no esté vacío
      if (!html || html.trim().length === 0) {
        throw new Error('Contenido vacío recibido');
      }
      
      // Verificar tamaño final
      if (html.length > ARM_CONFIG.MAX_CONTENT_SIZE) {
        throw new Error(`Contenido demasiado grande: ${html.length} bytes > ${ARM_CONFIG.MAX_CONTENT_SIZE}`);
      }
      
      console.log(`   ✅ Descarga exitosa: ${html.length} bytes`);
      return html;
      
    } catch (error) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log(`   ⏰ Timeout en intento ${attempt} (${ARM_CONFIG.FETCH_TIMEOUT}ms)`);
      } else if (error.message.includes('No reintentar')) {
        console.log(`   ❌ Error permanente: ${error.message}`);
        break; // No reintentar errores 4xx
      } else {
        console.log(`   ⚠️ Error en intento ${attempt}: ${error.message}`);
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      if (attempt < ARM_CONFIG.RETRY_ATTEMPTS) {
        const delay = ARM_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Fallo recuperando ${url} después de ${ARM_CONFIG.RETRY_ATTEMPTS} intentos: ${lastError?.message || 'Error desconocido'}`);
}

/**
 * EXTRACTOR (EXTRACTOR) - COMPONENTE 2 DEL ARM
 * Procesador de HTML que extrae contenido pedagógico relevante
 * 
 * @param {string} html - HTML crudo de la página
 * @param {string} url - URL original (para contexto)
 * @returns {Promise<string>} Texto pedagógico limpio
 */
async function extractMainContent(html, url) {
  console.log(`🔄 [ARM EXTRACTOR] Procesando HTML (${html.length} bytes) de: ${url}`);
  
  try {
    // Limpiar scripts y estilos
    let cleanedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
    
    // Patrones de extracción basados en sitios educativos comunes
    const extractionPatterns = [
      // Patrones específicos para sitios conocidos
      { 
        domains: ['ai.google'],
        selectors: ['article', 'main', '.content', '.principles-content', '[role="main"]']
      },
      { 
        domains: ['scratch.mit.edu'],
        selectors: ['.content', '#content', 'article', 'main', '.documentation']
      },
      { 
        domains: ['cs50.harvard.edu', 'harvard.edu'],
        selectors: ['article', 'main', '.content', '.assignment', '.problem']
      },
      // Patrones generales para contenido educativo
      { 
        domains: [],
        selectors: ['article', 'main', '[role="main"]', '.content', '.post-content', '.entry-content']
      }
    ];
    
    // Detectar dominio
    const domain = new URL(url).hostname.toLowerCase();
    const matchedPattern = extractionPatterns.find(pattern => 
      pattern.domains.length === 0 || pattern.domains.some(d => domain.includes(d))
    ) || extractionPatterns[extractionPatterns.length - 1];
    
    console.log(`   🎯 Usando patrón para dominio: ${domain} (${matchedPattern.selectors.join(', ')})`);
    
    // Extraer contenido usando simulación de selectors CSS básicos
    let extractedText = '';
    
    for (const selector of matchedPattern.selectors) {
      let selectorContent = '';
      
      if (selector === 'article') {
        const articleMatch = cleanedHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
        selectorContent = articleMatch ? articleMatch[1] : '';
      } else if (selector === 'main') {
        const mainMatch = cleanedHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        selectorContent = mainMatch ? mainMatch[1] : '';
      } else if (selector.startsWith('.')) {
        // Clase CSS
        const className = selector.substring(1);
        const classRegex = new RegExp(`<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)</[^>]+>`, 'i');
        const classMatch = cleanedHtml.match(classRegex);
        selectorContent = classMatch ? classMatch[1] : '';
      } else if (selector.startsWith('#')) {
        // ID
        const idName = selector.substring(1);
        const idRegex = new RegExp(`<[^>]*id=["']${idName}["'][^>]*>([\\s\\S]*?)</[^>]+>`, 'i');
        const idMatch = cleanedHtml.match(idRegex);
        selectorContent = idMatch ? idMatch[1] : '';
      } else if (selector.includes('[') && selector.includes(']')) {
        // Atributo role
        const roleMatch = cleanedHtml.match(/<[^>]*role=["']main["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
        selectorContent = roleMatch ? roleMatch[1] : '';
      }
      
      if (selectorContent && selectorContent.trim().length > extractedText.length) {
        extractedText = selectorContent;
        console.log(`   ✅ Contenido extraído con selector: ${selector}`);
        break;
      }
    }
    
    // Fallback: extraer del body completo si no se encontró contenido específico
    if (!extractedText || extractedText.trim().length < 100) {
      console.log(`   ⚠️ Fallback: extrayendo de <body>`);
      const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      extractedText = bodyMatch ? bodyMatch[1] : cleanedHtml;
    }
    
    // Limpiar HTML tags y entidades
    let cleanedText = extractedText
      .replace(/<[^>]*>/g, ' ') // Remover tags HTML
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#\d+;/g, ' ') // Entidades numéricas
      .replace(/&[a-zA-Z]+;/g, ' ') // Entidades nombradas
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
    
    // Filtrar contenido muy corto o irrelevante
    if (cleanedText.length < 50) {
      throw new Error(`Contenido extraído demasiado corto: ${cleanedText.length} caracteres`);
    }
    
    // Truncar si es demasiado largo
    if (cleanedText.length > ARM_CONFIG.MAX_CONTENT_SIZE / 2) {
      cleanedText = cleanedText.substring(0, ARM_CONFIG.MAX_CONTENT_SIZE / 2) + '... [truncado]';
    }
    
    console.log(`   ✅ Extracción exitosa: ${cleanedText.length} caracteres de texto limpio`);
    return cleanedText;
    
  } catch (error) {
    console.error(`   ❌ Error en extracción: ${error.message}`);
    throw new Error(`Fallo extrayendo contenido de ${url}: ${error.message}`);
  }
}

/**
 * CACHÉ (CACHE) - COMPONENTE 3 DEL ARM
 * Gestión inteligente del caché con políticas de freshness
 * 
 * @param {string} url - URL del contenido
 * @returns {Promise<string|null>} Contenido cacheado o null si no existe/expirado
 */
async function getCachedContent(url) {
  try {
    console.log(`🔍 [ARM CACHÉ] Verificando caché para: ${url}`);
    
    const { data, error } = await supabase
      .from('source_content_cache')
      .select('content, last_fetched_at')
      .eq('url', url)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ❌ Cache Miss: URL no encontrada en caché`);
        return null;
      }
      throw error;
    }
    
    if (!data) {
      console.log(`   ❌ Cache Miss: Datos vacíos`);
      return null;
    }
    
    // Verificar freshness (24 horas por defecto)
    const lastFetched = new Date(data.last_fetched_at);
    const now = new Date();
    const ageHours = (now - lastFetched) / (1000 * 60 * 60);
    
    if (ageHours > ARM_CONFIG.CACHE_TTL_HOURS) {
      console.log(`   ⏰ Cache Expired: ${ageHours.toFixed(1)}h > ${ARM_CONFIG.CACHE_TTL_HOURS}h`);
      return null;
    }
    
    console.log(`   ✅ Cache Hit: Contenido fresco (${ageHours.toFixed(1)}h antiguo, ${data.content.length} chars)`);
    return data.content;
    
  } catch (error) {
    console.error(`   ❌ Error consultando caché: ${error.message}`);
    return null; // En caso de error, proceder sin caché
  }
}

/**
 * Almacena contenido en el caché
 * 
 * @param {string} url - URL del contenido
 * @param {string} content - Contenido extraído
 * @returns {Promise<boolean>} true si se guardó exitosamente
 */
async function setCachedContent(url, content) {
  try {
    console.log(`💾 [ARM CACHÉ] Guardando en caché: ${url} (${content.length} chars)`);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ARM_CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000));
    
    const { error } = await supabase
      .from('source_content_cache')
      .upsert({
        url: url,
        content: content,
        last_fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`   ✅ Contenido guardado en caché exitosamente`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error guardando en caché: ${error.message}`);
    return false;
  }
}

/**
 * FUNCIÓN PRINCIPAL ARM EXTERNO
 * Procesa una URL implementando el flujo completo Cache Hit/Miss → ARM → Caché
 * 
 * @param {string} url - URL a procesar
 * @returns {Promise<Object>} Contenido procesado con metadatos
 */
async function processExternalURL(url) {
  console.log(`\n🚀 [ARM EXTERNO] Procesando URL: ${url}`);
  
  const startTime = Date.now();
  
  try {
    // PASO 1: Verificar caché (Cache Hit/Miss)
    const cachedContent = await getCachedContent(url);
    
    let content, fromCache;
    
    if (cachedContent) {
      // Cache Hit - Usar contenido cacheado
      content = cachedContent;
      fromCache = true;
      console.log(`✅ [ARM] Cache Hit: Usando contenido cacheado`);
    } else {
      // Cache Miss - Ejecutar ARM completo
      console.log(`🔄 [ARM] Cache Miss: Ejecutando flujo ARM completo`);
      
      // PASO 2: Recuperador - Obtener HTML crudo
      const rawHtml = await fetchRawHTML(url);
      
      // PASO 3: Extractor - Limpiar y extraer contenido relevante
      const extractedContent = await extractMainContent(rawHtml, url);
      
      // PASO 4: Caché - Guardar para futuras consultas
      await setCachedContent(url, extractedContent);
      
      content = extractedContent;
      fromCache = false;
      console.log(`✅ [ARM] Cache Miss resuelto: Contenido extraído y almacenado`);
    }
    
    const processTime = Date.now() - startTime;
    
    return {
      url,
      content,
      fromCache,
      processTimeMs: processTime,
      timestamp: new Date().toISOString(),
      contentLength: content.length,
      status: 'success'
    };
    
  } catch (error) {
    const processTime = Date.now() - startTime;
    
    console.error(`❌ [ARM EXTERNO] Error procesando ${url}:`, error.message);
    
    return {
      url,
      content: null,
      fromCache: false,
      processTimeMs: processTime,
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'error'
    };
  }
}

/**
 * INTEGRACIÓN CON MOTOR RAG EXISTENTE
 * Detecta y procesa URLs oficiales en el contexto curricular
 * 
 * @param {Object} ragContext - Contexto del Motor RAG existente
 * @returns {Promise<Object>} Contexto enriquecido con contenido externo
 */
async function enrichRAGWithExternalSources(ragContext) {
  console.log(`\n🎯 [ARM INTEGRACIÓN] Enriqueciendo contexto RAG para semana ${ragContext.weekId}`);
  
  // Extraer URLs de recursos y ejercicios
  const externalUrls = [];
  
  // URLs de recursos
  if (ragContext.resources && ragContext.resources.length > 0) {
    ragContext.resources.forEach(resource => {
      if (resource.url && resource.url.startsWith('http')) {
        externalUrls.push({
          url: resource.url,
          type: 'resource',
          name: resource.nombre
        });
      }
    });
  }
  
  // URLs de ejercicios
  if (ragContext.exercises && ragContext.exercises.length > 0) {
    ragContext.exercises.forEach(exercise => {
      if (exercise.url && exercise.url.startsWith('http')) {
        externalUrls.push({
          url: exercise.url,
          type: 'exercise',
          name: exercise.nombre
        });
      }
    });
  }
  
  console.log(`   📊 URLs externas detectadas: ${externalUrls.length}`);
  
  if (externalUrls.length === 0) {
    console.log(`   ℹ️ No hay URLs externas, devolviendo contexto RAG original`);
    return {
      ...ragContext,
      externalSources: [],
      armStatus: 'no-external-sources'
    };
  }
  
  // Procesar URLs externas con ARM + Fallback Inteligente
  const externalSources = [];
  let cacheHits = 0;
  let fallbacksUsed = 0;
  
  for (const urlInfo of externalUrls) {
    console.log(`   🔄 Procesando ${urlInfo.type}: ${urlInfo.name} (${urlInfo.url})`);
    
    try {
      const result = await processExternalURL(urlInfo.url);
      
      if (result.status === 'success') {
        externalSources.push({
          ...result,
          type: urlInfo.type,
          name: urlInfo.name
        });
        if (result.fromCache) cacheHits++;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.warn(`   ⚠️ ARM falló para ${urlInfo.url}: ${error.message}`);
      
      // FALLBACK INTELIGENTE: Usar contenido curado interno
      const fallbackContent = FALLBACK_CONTENT_DATABASE[urlInfo.url];
      
      if (fallbackContent) {
        console.log(`   🎯 [FALLBACK] Usando contenido curado interno para ${urlInfo.name}`);
        
        externalSources.push({
          url: urlInfo.url,
          content: fallbackContent.content,
          fromCache: false,
          fromFallback: true,
          processTimeMs: 0,
          timestamp: new Date().toISOString(),
          contentLength: fallbackContent.content.length,
          status: 'fallback-success',
          type: urlInfo.type,
          name: urlInfo.name,
          fallbackMetadata: fallbackContent.extractionMetadata
        });
        
        fallbacksUsed++;
      } else {
        console.error(`   ❌ No hay fallback disponible para ${urlInfo.url}`);
        // Continuar sin esta fuente
      }
    }
  }
  
  console.log(`✅ [ARM INTEGRACIÓN] Procesamiento completado:`);
  console.log(`   - URLs procesadas: ${externalSources.length}/${externalUrls.length}`);
  console.log(`   - Cache hits: ${cacheHits}`);
  console.log(`   - Fallbacks usados: ${fallbacksUsed}`);
  
  // Enriquecer contexto RAG con fuentes externas
  const enrichedContext = {
    ...ragContext,
    externalSources,
    armStatus: 'enriched',
    armMetadata: {
      totalUrls: externalUrls.length,
      processedUrls: externalSources.length,
      cacheHits,
      cacheMisses: externalSources.filter(source => !source.fromCache && !source.fromFallback).length,
      fallbacksUsed,
      totalProcessTimeMs: externalSources.reduce((sum, source) => sum + (source.processTimeMs || 0), 0),
      fallbackContentQuality: fallbacksUsed > 0 ? 'curated-high' : null
    }
  };
  
  return enrichedContext;
}

/**
 * EXPORTACIONES
 */
module.exports = {
  // Funciones principales ARM
  processExternalURL,
  enrichRAGWithExternalSources,
  
  // Componentes ARM individuales
  fetchRawHTML,
  extractMainContent,
  getCachedContent,
  setCachedContent,
  
  // Configuración (para testing)
  ARM_CONFIG
};

/**
 * NOTAS DE IMPLEMENTACIÓN ARM v1.0
 * 
 * 1. ARQUITECTURA MODULAR:
 *    - Recuperador: Cliente HTTP resiliente con reintentos y backoff exponencial
 *    - Extractor: Procesador HTML defensivo con patrones por dominio
 *    - Caché: Gestión inteligente con políticas de freshness en Supabase
 * 
 * 2. RESILIENCIA DE RED:
 *    - Timeouts configurable (15s por defecto)
 *    - Reintentos con backoff exponencial (3 intentos)
 *    - Manejo diferenciado de errores 4xx (no reintentar) vs 5xx (reintentar)
 *    - User-Agent profesional para ciudadanía digital responsable
 * 
 * 3. PROCESAMIENTO DEFENSIVO:
 *    - Patrones de extracción específicos por dominio educativo
 *    - Fallbacks robustos cuando selectores fallan
 *    - Validación de tamaño y calidad del contenido extraído
 *    - Limpieza exhaustiva de HTML y entidades
 * 
 * 4. INTEGRACIÓN RAG:
 *    - Compatible con retrieve_sources() existente
 *    - Enriquece contexto curricular interno con contenido externo
 *    - Mantiene metadatos de performance y caché para observabilidad
 *    - Falla graciosamente sin afectar funcionalidad base
 * 
 * 5. OBSERVABILIDAD:
 *    - Logging detallado de cada componente ARM
 *    - Métricas de performance (tiempo de procesamiento, cache hits/misses)
 *    - Estados claros de éxito/error con context preservation
 * 
 * READY FOR SUB-MISIÓN 166.4: INTEGRACIÓN EN API generate-lesson.js
 */
