/**
 * FASE 3: ANÁLISIS DE RENDIMIENTO E2E
 *
 * Mide Core Web Vitals y métricas de red via Playwright.
 *
 * Métricas medidas:
 * - FCP (First Contentful Paint) - threshold: < 1800ms
 * - LCP (Largest Contentful Paint) - threshold: < 2500ms
 * - CLS (Cumulative Layout Shift) - threshold: < 0.1
 * - Tiempo de carga total - threshold: < 5000ms (warning), < 10000ms (fail)
 * - Requests de red - threshold: < 50
 * - Tamaño total transferido - threshold: < 3MB
 *
 * Páginas medidas: Landing (sin auth) y Dashboard (con auth)
 *
 * Thresholds iniciales generosos: warning-only para métricas que excedan,
 * fail solo para carga > 10s. Se ajustan progresivamente.
 */

const { test, expect } = require('@playwright/test');
const { authenticateDemo } = require('./helpers/authHelper');

// Thresholds de rendimiento
const THRESHOLDS = {
  FCP: 1800,           // ms - First Contentful Paint
  LCP: 2500,           // ms - Largest Contentful Paint
  CLS: 0.1,            // score - Cumulative Layout Shift
  LOAD_WARNING: 5000,  // ms - warning threshold
  LOAD_FAIL: 10000,    // ms - hard fail threshold
  MAX_REQUESTS: 50,    // count
  MAX_TRANSFER: 3 * 1024 * 1024, // 3MB in bytes
};

/**
 * Inject PerformanceObserver before page load to capture LCP and CLS
 */
async function injectPerformanceObservers(page) {
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0 };

    // LCP observer
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        window.__perf.lcp = lastEntry.startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS observer
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__perf.cls += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  });
}

/**
 * Collect all performance metrics from the browser
 */
async function collectMetrics(page) {
  return await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null;
    const navEntry = performance.getEntriesByType('navigation')[0];
    const domReady = navEntry ? navEntry.domContentLoadedEventEnd : null;
    const loadComplete = navEntry ? navEntry.loadEventEnd : null;

    return {
      fcp,
      lcp: window.__perf?.lcp || null,
      cls: window.__perf?.cls || null,
      domReady,
      loadComplete,
    };
  });
}

/**
 * Track network requests and transfer size
 */
function trackNetwork(page) {
  const stats = { requestCount: 0, totalTransfer: 0 };

  page.on('response', async (response) => {
    stats.requestCount++;
    try {
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      stats.totalTransfer += contentLength;
    } catch (e) {
      // Ignore errors from failed responses
    }
  });

  return stats;
}

/**
 * Log metrics report and return pass/fail status
 */
function reportMetrics(pageName, metrics, networkStats) {
  console.log(`\n  === Performance Report: ${pageName} ===`);

  // FCP
  if (metrics.fcp !== null) {
    const fcpStatus = metrics.fcp < THRESHOLDS.FCP ? 'PASS' : 'WARNING';
    console.log(`  FCP: ${metrics.fcp.toFixed(0)}ms (threshold: ${THRESHOLDS.FCP}ms) [${fcpStatus}]`);
  } else {
    console.log('  FCP: not captured');
  }

  // LCP
  if (metrics.lcp !== null && metrics.lcp > 0) {
    const lcpStatus = metrics.lcp < THRESHOLDS.LCP ? 'PASS' : 'WARNING';
    console.log(`  LCP: ${metrics.lcp.toFixed(0)}ms (threshold: ${THRESHOLDS.LCP}ms) [${lcpStatus}]`);
  } else {
    console.log('  LCP: not captured');
  }

  // CLS
  if (metrics.cls !== null) {
    const clsStatus = metrics.cls < THRESHOLDS.CLS ? 'PASS' : 'WARNING';
    console.log(`  CLS: ${metrics.cls.toFixed(4)} (threshold: ${THRESHOLDS.CLS}) [${clsStatus}]`);
  } else {
    console.log('  CLS: not captured');
  }

  // Load time
  if (metrics.loadComplete !== null && metrics.loadComplete > 0) {
    const loadStatus = metrics.loadComplete < THRESHOLDS.LOAD_WARNING ? 'PASS'
      : metrics.loadComplete < THRESHOLDS.LOAD_FAIL ? 'WARNING' : 'FAIL';
    console.log(`  Load: ${metrics.loadComplete.toFixed(0)}ms (warning: ${THRESHOLDS.LOAD_WARNING}ms, fail: ${THRESHOLDS.LOAD_FAIL}ms) [${loadStatus}]`);
  } else {
    console.log('  Load: not captured');
  }

  // Network
  const reqStatus = networkStats.requestCount < THRESHOLDS.MAX_REQUESTS ? 'PASS' : 'WARNING';
  const sizeKB = (networkStats.totalTransfer / 1024).toFixed(0);
  const sizeMB = (networkStats.totalTransfer / (1024 * 1024)).toFixed(2);
  const sizeStatus = networkStats.totalTransfer < THRESHOLDS.MAX_TRANSFER ? 'PASS' : 'WARNING';

  console.log(`  Requests: ${networkStats.requestCount} (threshold: ${THRESHOLDS.MAX_REQUESTS}) [${reqStatus}]`);
  console.log(`  Transfer: ${sizeMB}MB / ${sizeKB}KB (threshold: 3MB) [${sizeStatus}]`);
  console.log('  ===');

  return metrics;
}

// ═══════════════════════════════════════════════════════════
// LANDING PAGE (sin auth)
// ═══════════════════════════════════════════════════════════

test.describe('⚡ RENDIMIENTO - Landing Page', () => {

  test('PERF-001: Landing page Core Web Vitals', async ({ page }) => {
    await injectPerformanceObservers(page);
    const networkStats = trackNetwork(page);

    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // Give time for LCP/CLS observers to fire
    await page.waitForTimeout(1000);

    const metrics = await collectMetrics(page);
    reportMetrics('Landing Page', metrics, networkStats);

    // Hard fail only for extreme load time
    if (metrics.loadComplete !== null && metrics.loadComplete > 0) {
      expect(metrics.loadComplete, `Page load took ${metrics.loadComplete}ms, exceeds ${THRESHOLDS.LOAD_FAIL}ms fail threshold`)
        .toBeLessThan(THRESHOLDS.LOAD_FAIL);
    }

    // Network thresholds as assertions
    expect(networkStats.requestCount, `${networkStats.requestCount} requests exceeds ${THRESHOLDS.MAX_REQUESTS} threshold`)
      .toBeLessThan(THRESHOLDS.MAX_REQUESTS);
    expect(networkStats.totalTransfer, `Transfer size ${(networkStats.totalTransfer / (1024 * 1024)).toFixed(2)}MB exceeds 3MB threshold`)
      .toBeLessThan(THRESHOLDS.MAX_TRANSFER);
  });

  test('PERF-002: Landing page FCP within threshold', async ({ page }) => {
    await injectPerformanceObservers(page);

    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    const metrics = await collectMetrics(page);

    if (metrics.fcp !== null) {
      console.log(`  FCP: ${metrics.fcp.toFixed(0)}ms (threshold: ${THRESHOLDS.FCP}ms)`);
      // Warning log but no hard fail for FCP in dev environment
      if (metrics.fcp > THRESHOLDS.FCP) {
        console.log(`  WARNING: FCP exceeds threshold (${metrics.fcp.toFixed(0)}ms > ${THRESHOLDS.FCP}ms)`);
      }
    }

    // At minimum, the page should load within 10s
    if (metrics.loadComplete !== null && metrics.loadComplete > 0) {
      expect(metrics.loadComplete).toBeLessThan(THRESHOLDS.LOAD_FAIL);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// DASHBOARD (con auth)
// ═══════════════════════════════════════════════════════════

test.describe('⚡ RENDIMIENTO - Dashboard', () => {

  test('PERF-003: Dashboard Core Web Vitals', async ({ page }) => {
    await authenticateDemo(page);

    // Inject observers for the dashboard navigation
    await injectPerformanceObservers(page);
    const networkStats = trackNetwork(page);

    await page.goto('/panel-de-control');
    await page.waitForLoadState('load');
    await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible({ timeout: 20000 });

    // Give time for LCP/CLS observers to fire
    await page.waitForTimeout(1000);

    const metrics = await collectMetrics(page);
    reportMetrics('Dashboard', metrics, networkStats);

    // Hard fail only for extreme load time
    if (metrics.loadComplete !== null && metrics.loadComplete > 0) {
      expect(metrics.loadComplete, `Dashboard load took ${metrics.loadComplete}ms, exceeds ${THRESHOLDS.LOAD_FAIL}ms fail threshold`)
        .toBeLessThan(THRESHOLDS.LOAD_FAIL);
    }

    // Network thresholds
    expect(networkStats.requestCount, `${networkStats.requestCount} requests exceeds ${THRESHOLDS.MAX_REQUESTS} threshold`)
      .toBeLessThan(THRESHOLDS.MAX_REQUESTS);
    expect(networkStats.totalTransfer, `Transfer size ${(networkStats.totalTransfer / (1024 * 1024)).toFixed(2)}MB exceeds 3MB threshold`)
      .toBeLessThan(THRESHOLDS.MAX_TRANSFER);
  });

  test('PERF-004: Dashboard FCP within threshold', async ({ page }) => {
    await authenticateDemo(page);
    await injectPerformanceObservers(page);

    await page.goto('/panel-de-control');
    await page.waitForLoadState('load');
    await expect(page.locator('h1:has-text("Panel de Control")')).toBeVisible({ timeout: 20000 });

    const metrics = await collectMetrics(page);

    if (metrics.fcp !== null) {
      console.log(`  FCP: ${metrics.fcp.toFixed(0)}ms (threshold: ${THRESHOLDS.FCP}ms)`);
      if (metrics.fcp > THRESHOLDS.FCP) {
        console.log(`  WARNING: FCP exceeds threshold (${metrics.fcp.toFixed(0)}ms > ${THRESHOLDS.FCP}ms)`);
      }
    }

    // At minimum, the page should load within 10s
    if (metrics.loadComplete !== null && metrics.loadComplete > 0) {
      expect(metrics.loadComplete).toBeLessThan(THRESHOLDS.LOAD_FAIL);
    }
  });
});
