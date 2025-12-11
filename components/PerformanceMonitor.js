/**
 * PERFORMANCE MONITOR - AUTO-INICIADO
 * 
 * Componente que inyecta el script de monitoreo automáticamente en desarrollo.
 * 
 * Características:
 * - Se inicia automáticamente al cargar la página
 * - Monitorea todas las métricas en tiempo real
 * - Genera reportes automáticos cada 10 segundos
 * - Guarda logs en localStorage para análisis posterior
 * 
 * Control:
 * - Para activar/desactivar: window.togglePerformanceMonitor()
 * - Para ver reporte: window.showPerformanceReport()
 * - Para exportar: window.exportPerformanceReport()
 * 
 * @author Mentor Coder
 * @version 2.0 - Auto-Start
 */

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    // Verificar si ya está inicializado
    if (window.__performanceMonitorActive) {
      console.log('⚠️ Performance Monitor ya está activo');
      return;
    }

    console.log('🚀 Iniciando Performance Monitor automático...');

    // === CONFIGURACIÓN ===
    const CONFIG = {
      AUTO_REPORT_INTERVAL: 10000, // Reporte cada 10 segundos
      SAVE_TO_STORAGE: true,        // Guardar en localStorage
      LOG_TO_CONSOLE: true,         // Log en consola
      TRACK_INTERACTIONS: true,     // Track clicks y navegación
      MONITOR_APIS: [
        '/api/v1/curriculum/summary',
        '/api/v1/phases',
        '/api/v1/weeks',
        '/api/analyze'
      ]
    };

    // === ALMACENAMIENTO DE MÉTRICAS ===
    const metrics = {
      pageLoad: {},
      webVitals: {},
      apiCalls: [],
      resourceTimings: [],
      userInteractions: [],
      customMarks: [],
      startTime: performance.now(),
      pageName: window.location.pathname,
      sessionId: Date.now()
    };

    // === CAPTURA DE NAVIGATION TIMING ===
    function captureNavigationTiming() {
      const perfData = performance.getEntriesByType('navigation')[0];
      
      if (perfData) {
        metrics.pageLoad = {
          connectionTime: Math.round(perfData.connectEnd - perfData.connectStart),
          requestTime: Math.round(perfData.responseStart - perfData.requestStart),
          responseTime: Math.round(perfData.responseEnd - perfData.responseStart),
          domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
          domComplete: Math.round(perfData.domComplete - perfData.fetchStart),
          domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
          loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
          totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
        };

        if (CONFIG.LOG_TO_CONSOLE) {
          console.log('⏱️  Navigation Timing:', metrics.pageLoad);
        }
      }
    }

    // === CAPTURA DE WEB VITALS ===
    function captureWebVitals() {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.webVitals.LCP = Math.round(lastEntry.renderTime || lastEntry.loadTime);
        
        if (CONFIG.LOG_TO_CONSOLE) {
          console.log(`🎨 LCP: ${metrics.webVitals.LCP}ms`);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          metrics.webVitals.FID = Math.round(entry.processingStart - entry.startTime);
          if (CONFIG.LOG_TO_CONSOLE) {
            console.log(`⚡ FID: ${metrics.webVitals.FID}ms`);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        metrics.webVitals.CLS = Math.round(clsScore * 1000) / 1000;
      }).observe({ entryTypes: ['layout-shift'] });

      // FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            metrics.webVitals.FCP = Math.round(entry.startTime);
            if (CONFIG.LOG_TO_CONSOLE) {
              console.log(`🖼️  FCP: ${metrics.webVitals.FCP}ms`);
            }
          }
        });
      }).observe({ entryTypes: ['paint'] });
    }

    // === MONITOREO DE APIs ===
    function monitorAPIs() {
      const originalFetch = window.fetch;
      
      window.fetch = function(...args) {
        const startTime = performance.now();
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        
        return originalFetch.apply(this, args).then(response => {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);
          
          const clonedResponse = response.clone();
          clonedResponse.json().then(data => {
            const payloadSize = new Blob([JSON.stringify(data)]).size;
            
            const apiCall = {
              url,
              method: args[1]?.method || 'GET',
              status: response.status,
              duration,
              payloadSize,
              payloadSizeKB: Math.round(payloadSize / 1024 * 100) / 100,
              timestamp: new Date().toISOString(),
              relativeTime: Math.round(performance.now() - metrics.startTime)
            };
            
            metrics.apiCalls.push(apiCall);
            
            const isMonitored = CONFIG.MONITOR_APIS.some(api => url.includes(api));
            if (isMonitored && CONFIG.LOG_TO_CONSOLE) {
              console.log(`🔌 API: ${url.split('/').slice(-3).join('/')}`);
              console.log(`   ⏱️  ${duration}ms | 💾 ${apiCall.payloadSizeKB} KB`);
            }
          }).catch(() => {
            const apiCall = {
              url,
              method: args[1]?.method || 'GET',
              status: response.status,
              duration,
              payloadSize: 0,
              payloadSizeKB: 0,
              timestamp: new Date().toISOString(),
              relativeTime: Math.round(performance.now() - metrics.startTime)
            };
            metrics.apiCalls.push(apiCall);
          });
          
          return response;
        });
      };
    }

    // === TRACKING DE INTERACCIONES ===
    function trackInteractions() {
      if (!CONFIG.TRACK_INTERACTIONS) return;

      // Clicks
      document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-testid], button, a');
        if (target) {
          const interaction = {
            type: 'click',
            element: target.tagName,
            testId: target.dataset.testid || null,
            text: target.textContent?.slice(0, 50) || null,
            timestamp: Math.round(performance.now() - metrics.startTime)
          };
          metrics.userInteractions.push(interaction);
        }
      }, true);

      // Navegación
      let lastPath = window.location.pathname;
      const checkNavigation = () => {
        const currentPath = window.location.pathname;
        if (currentPath !== lastPath) {
          metrics.userInteractions.push({
            type: 'navigation',
            from: lastPath,
            to: currentPath,
            timestamp: Math.round(performance.now() - metrics.startTime)
          });
          lastPath = currentPath;
          
          if (CONFIG.LOG_TO_CONSOLE) {
            console.log(`🔄 Navegación: ${currentPath}`);
          }
        }
      };
      setInterval(checkNavigation, 500);
    }

    // === CAPTURA DE RESOURCES ===
    function captureResourceTimings() {
      const resources = performance.getEntriesByType('resource');
      
      metrics.resourceTimings = resources.map(resource => ({
        name: resource.name.split('/').pop() || resource.name,
        type: resource.initiatorType,
        duration: Math.round(resource.duration),
        size: resource.transferSize || 0,
        sizeKB: Math.round((resource.transferSize || 0) / 1024 * 100) / 100
      }));
    }

    // === GENERAR REPORTE ===
    function generateReport() {
      const report = {
        metadata: {
          page: metrics.pageName,
          url: window.location.href,
          sessionId: metrics.sessionId,
          timestamp: new Date().toISOString(),
          duration: Math.round(performance.now() - metrics.startTime),
          mission: '213.0 - Performance Optimization'
        },
        
        summary: {
          totalLoadTime: metrics.pageLoad.totalTime || 0,
          domContentLoaded: metrics.pageLoad.domContentLoaded || 0,
          firstContentfulPaint: metrics.webVitals.FCP || 0,
          largestContentfulPaint: metrics.webVitals.LCP || 0,
          cumulativeLayoutShift: metrics.webVitals.CLS || 0,
          apiCallsCount: metrics.apiCalls.length,
          totalPayloadKB: Math.round(
            metrics.apiCalls.reduce((sum, call) => sum + call.payloadSizeKB, 0) * 100
          ) / 100,
          userInteractionsCount: metrics.userInteractions.length
        },
        
        pageLoad: metrics.pageLoad,
        webVitals: metrics.webVitals,
        apiCalls: metrics.apiCalls,
        userInteractions: metrics.userInteractions,
        resourceTimings: metrics.resourceTimings.slice(0, 20),
        customMarks: metrics.customMarks
      };

      return report;
    }

    // === MOSTRAR REPORTE ===
    function displayReport() {
      const report = generateReport();

      console.log('\n' + '='.repeat(70));
      console.log('📊 PERFORMANCE REPORT - Auto-Monitor');
      console.log('='.repeat(70));
      
      console.log('\n📄 Session:', report.metadata.sessionId);
      console.log('🕐 Duration:', Math.round(report.metadata.duration / 1000), 'seconds');
      
      console.log('\n📈 Summary:');
      console.table({
        'Load Time (ms)': report.summary.totalLoadTime,
        'DOM Ready (ms)': report.summary.domContentLoaded,
        'FCP (ms)': report.summary.firstContentfulPaint,
        'LCP (ms)': report.summary.largestContentfulPaint,
        'CLS': report.summary.cumulativeLayoutShift,
        'API Calls': report.summary.apiCallsCount,
        'Total Payload (KB)': report.summary.totalPayloadKB,
        'Interactions': report.summary.userInteractionsCount
      });

      // APIs recientes
      const recentAPIs = report.apiCalls.slice(-5);
      if (recentAPIs.length > 0) {
        console.log('\n🔌 Recent API Calls:');
        console.table(recentAPIs.map(call => ({
          'API': call.url.split('/').slice(-3).join('/'),
          'Time (ms)': call.duration,
          'Size (KB)': call.payloadSizeKB,
          'Status': call.status
        })));
      }

      // Interacciones recientes
      const recentInteractions = report.userInteractions.slice(-5);
      if (recentInteractions.length > 0) {
        console.log('\n👆 Recent Interactions:');
        console.table(recentInteractions);
      }

      console.log('\n' + '='.repeat(70));
      console.log('Commands:');
      console.log('  window.showPerformanceReport() - Ver reporte completo');
      console.log('  window.savePerformanceLog() - Guardar en /performance-logs/');
      console.log('  window.exportPerformanceReport() - Descargar JSON');
      console.log('  window.getPerformanceHistory() - Ver historial');
      console.log('  window.togglePerformanceMonitor() - ON/OFF');
      console.log('='.repeat(70) + '\n');
    }

    // === GUARDAR EN STORAGE ===
    function saveToStorage() {
      if (!CONFIG.SAVE_TO_STORAGE) return;

      const report = generateReport();
      const history = JSON.parse(localStorage.getItem('performanceHistory') || '[]');
      history.push(report);
      
      // Mantener solo últimos 10 reportes
      if (history.length > 10) {
        history.shift();
      }
      
      localStorage.setItem('performanceHistory', JSON.stringify(history));
    }

    // === GUARDAR EN DISCO (SERVIDOR) ===
    async function saveToDisk() {
      const report = generateReport();
      
      try {
        const response = await fetch('/api/save-performance-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ report }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Log guardado en servidor: ${data.filename}`);
          return data;
        } else {
          console.error('❌ Error guardando log en servidor');
          return null;
        }
      } catch (error) {
        console.error('❌ Error en saveToDisk:', error);
        return null;
      }
    }

    // === GUARDAR AL CERRAR (BEACON API) ===
    function saveOnUnload() {
      const report = generateReport();
      const blob = new Blob([JSON.stringify({ report })], { type: 'application/json' });
      
      // Usar Beacon API para garantizar que se envíe incluso al cerrar
      const sent = navigator.sendBeacon('/api/save-performance-log', blob);
      
      if (sent) {
        console.log('📤 Performance log enviado al servidor (al cerrar)');
      } else {
        console.warn('⚠️  No se pudo enviar log al cerrar');
      }
    }

    // === EXPORTAR REPORTE (DESCARGA NAVEGADOR) ===
    window.exportPerformanceReport = function() {
      const report = generateReport();
      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perf-${metrics.pageName.replace(/\//g, '-')}-${metrics.sessionId}.json`;
      a.click();
      console.log('✅ Report exported (descarga)');
    };

    // === GUARDAR EN SERVIDOR (MANUAL) ===
    window.savePerformanceLog = async function() {
      console.log('💾 Guardando log en servidor...');
      const result = await saveToDisk();
      if (result) {
        console.log(`✅ Guardado en: performance-logs/${result.filename}`);
      }
      return result;
    };

    // === VER HISTORIAL ===
    window.getPerformanceHistory = function() {
      const history = JSON.parse(localStorage.getItem('performanceHistory') || '[]');
      console.log(`📚 Performance History (${history.length} sessions):`);
      console.table(history.map(h => ({
        Page: h.metadata.page,
        Duration: Math.round(h.metadata.duration / 1000) + 's',
        'Load Time': h.summary.totalLoadTime + 'ms',
        'API Calls': h.summary.apiCallsCount,
        'Payload (KB)': h.summary.totalPayloadKB,
        Timestamp: new Date(h.metadata.timestamp).toLocaleTimeString()
      })));
      return history;
    };

    // === TOGGLE MONITOR ===
    window.togglePerformanceMonitor = function() {
      window.__performanceMonitorActive = !window.__performanceMonitorActive;
      CONFIG.LOG_TO_CONSOLE = window.__performanceMonitorActive;
      console.log(
        window.__performanceMonitorActive 
          ? '✅ Performance Monitor ACTIVADO' 
          : '⏸️  Performance Monitor PAUSADO'
      );
    };

    // === MOSTRAR REPORTE ON-DEMAND ===
    window.showPerformanceReport = displayReport;

    // === MARCAR EVENTO ===
    window.markPerformance = function(name) {
      const timestamp = performance.now();
      metrics.customMarks.push({
        name,
        timestamp: Math.round(timestamp),
        relativeTime: Math.round(timestamp - metrics.startTime)
      });
      if (CONFIG.LOG_TO_CONSOLE) {
        console.log(`🏁 Mark: ${name} @ ${Math.round(timestamp)}ms`);
      }
    };

    // === INICIALIZACIÓN ===
    function init() {
      if (document.readyState === 'complete') {
        captureNavigationTiming();
        captureResourceTimings();
      } else {
        window.addEventListener('load', () => {
          captureNavigationTiming();
          captureResourceTimings();
        });
      }

      captureWebVitals();
      monitorAPIs();
      trackInteractions();

      // Reportes automáticos
      const reportInterval = setInterval(() => {
        if (window.__performanceMonitorActive) {
          displayReport();
          saveToStorage();
        }
      }, CONFIG.AUTO_REPORT_INTERVAL);

      // Guardar al cerrar navegador/tab
      window.addEventListener('beforeunload', saveOnUnload);

      // Limpiar en unmount
      return () => {
        clearInterval(reportInterval);
        window.removeEventListener('beforeunload', saveOnUnload);
      };
    }

    // === EJECUTAR ===
    const cleanup = init();
    window.__performanceMonitorActive = true;
    window.__performanceMetrics = metrics;

    console.log('✅ Performance Monitor ACTIVO');
    console.log('📊 Reportes automáticos cada', CONFIG.AUTO_REPORT_INTERVAL / 1000, 'segundos');
    console.log('💾 Guardando en localStorage');
    console.log('📁 Guardado automático en: /performance-logs/');
    console.log('👆 Tracking de interacciones: ON');
    console.log('\nComandos:');
    console.log('  window.savePerformanceLog() - Guardar ahora en servidor');
    console.log('  window.togglePerformanceMonitor() - Pausar/reanudar');
    console.log('  window.showPerformanceReport() - Ver reporte\n');
    console.log('ℹ️  Al cerrar el navegador, el log se guarda automáticamente\n');

    // Cleanup en unmount
    return cleanup;
  }, []);

  // No renderiza nada
  return null;
}
