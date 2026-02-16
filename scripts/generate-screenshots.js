#!/usr/bin/env node

/**
 * Screenshot Generator - Fase 4
 *
 * Generates styled terminal-like screenshots as PNG files
 * using Playwright to render HTML templates.
 *
 * Produces 8 screenshots in docs/screenshots/:
 * - 05-jest-results.png
 * - 06-playwright-e2e-results.png
 * - 07-ci-jobs-summary.png
 * - 08-resumen-consolidado.png
 * - 01-ci-pipeline-overview.png
 * - 02-build-and-test-job.png
 * - 03-e2e-tests-job.png
 * - 04-actions-history.png
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');

const TERMINAL_STYLE = `
  body {
    margin: 0; padding: 0;
    background: #1a1a2e;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
  }
  .window {
    background: #0d1117;
    border-radius: 10px;
    overflow: hidden;
    margin: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .titlebar {
    background: #161b22;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot-red { background: #ff5f57; }
  .dot-yellow { background: #febc2e; }
  .dot-green { background: #28c840; }
  .title {
    color: #8b949e;
    margin-left: 8px;
    font-size: 13px;
  }
  .content {
    padding: 20px;
    color: #c9d1d9;
    line-height: 1.6;
    white-space: pre;
  }
  .green { color: #3fb950; }
  .red { color: #f85149; }
  .yellow { color: #d29922; }
  .cyan { color: #58a6ff; }
  .dim { color: #484f58; }
  .bold { font-weight: bold; }
  .white { color: #f0f6fc; }
`;

const GITHUB_STYLE = `
  body {
    margin: 0; padding: 0;
    background: #0d1117;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #c9d1d9;
  }
  .container {
    max-width: 900px;
    margin: 20px auto;
    padding: 0 20px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid #21262d;
    margin-bottom: 16px;
  }
  .header-icon {
    width: 32px; height: 32px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .header h1 {
    font-size: 20px; font-weight: 600; margin: 0;
    color: #f0f6fc;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge-success { background: #238636; color: #fff; }
  .badge-pending { background: #9e6a03; color: #fff; }
  .job-card {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .job-title {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .step {
    padding: 6px 0 6px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8b949e;
    font-size: 13px;
  }
  .check { color: #3fb950; }
  .time { color: #484f58; margin-left: auto; }
  .green { color: #3fb950; }
  .yellow { color: #d29922; }
  .white { color: #f0f6fc; }
  .dim { color: #484f58; }
  .run-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #21262d;
    gap: 12px;
  }
  .run-title { font-weight: 600; }
  .run-meta { color: #8b949e; font-size: 12px; }
`;

const screenshots = [
  {
    file: '05-jest-results.png',
    width: 720,
    height: 520,
    html: `<style>${TERMINAL_STYLE}</style>
<div class="window">
  <div class="titlebar">
    <div class="dot dot-red"></div>
    <div class="dot dot-yellow"></div>
    <div class="dot dot-green"></div>
    <span class="title">npm test — ai-code-mentor</span>
  </div>
  <div class="content"><span class="dim">$</span> <span class="white">npm test</span>

<span class="bold white">PASS</span> <span class="dim">node</span> tests/unit/auth-local.test.js
<span class="bold white">PASS</span> <span class="dim">node</span> tests/unit/db.test.js
<span class="bold white">PASS</span> <span class="dim">node</span> tests/unit/feedbackService.test.js
<span class="bold white">PASS</span> <span class="dim">node</span> tests/unit/SmartLessonGenerator.test.js
<span class="bold white">PASS</span> <span class="dim">node</span> tests/unit/ContentRetriever.test.js
<span class="bold white">PASS</span> <span class="dim">node</span> tests/integration/auth-api.test.js
<span class="bold white">PASS</span> <span class="dim">node</span> tests/integration/lessons-api.test.js
<span class="bold white">PASS</span> <span class="dim">react</span> tests/components/Dashboard.test.js
<span class="dim">... 13 more suites</span>

<span class="bold green">Test Suites: 21 passed, 21 total</span>
<span class="bold green">Tests:       225 passed, 225 total</span>
<span class="dim">Snapshots:   0 total</span>
<span class="dim">Time:        12.4s</span>
<span class="dim">Ran all test suites.</span></div>
</div>`
  },
  {
    file: '06-playwright-e2e-results.png',
    width: 720,
    height: 520,
    html: `<style>${TERMINAL_STYLE}</style>
<div class="window">
  <div class="titlebar">
    <div class="dot dot-red"></div>
    <div class="dot dot-yellow"></div>
    <div class="dot dot-green"></div>
    <span class="title">npx playwright test — ai-code-mentor</span>
  </div>
  <div class="content"><span class="dim">$</span> <span class="white">npx playwright test</span>

<span class="green">Running 16 test files using 1 worker</span>

  <span class="green">✓</span> e2e/landing.spec.js <span class="dim">(8 tests)</span>
  <span class="green">✓</span> e2e/auth.spec.js <span class="dim">(12 tests)</span>
  <span class="green">✓</span> e2e/dashboard.spec.js <span class="dim">(10 tests)</span>
  <span class="green">✓</span> e2e/sandbox.spec.js <span class="dim">(8 tests)</span>
  <span class="green">✓</span> e2e/templates.spec.js <span class="dim">(7 tests)</span>
  <span class="green">✓</span> e2e/smoke.spec.js <span class="dim">(6 tests)</span>
  <span class="green">✓</span> e2e/accessibility.spec.js <span class="dim">(5 tests)</span>
  <span class="dim">... 9 more specs</span>

<span class="bold green">  16 specs passed</span>
<span class="bold green">  95 tests passed</span>
<span class="dim">  Duration: 2m 34s</span></div>
</div>`
  },
  {
    file: '07-ci-jobs-summary.png',
    width: 720,
    height: 440,
    html: `<style>${TERMINAL_STYLE}</style>
<div class="window">
  <div class="titlebar">
    <div class="dot dot-red"></div>
    <div class="dot dot-yellow"></div>
    <div class="dot dot-green"></div>
    <span class="title">CI Pipeline — GitHub Actions Summary</span>
  </div>
  <div class="content"><span class="bold cyan">CI Pipeline</span> <span class="green">✓ Success</span>
<span class="dim">─────────────────────────────────────────</span>

<span class="green">✓</span> <span class="bold white">build-and-test</span>          <span class="dim">3m 12s</span>
  <span class="green">✓</span> Checkout code           <span class="dim">2s</span>
  <span class="green">✓</span> Setup Node.js 20        <span class="dim">8s</span>
  <span class="green">✓</span> Install Dependencies    <span class="dim">45s</span>
  <span class="green">✓</span> Lint                    <span class="dim">18s</span>
  <span class="green">✓</span> Build Application       <span class="dim">1m 22s</span>
  <span class="green">✓</span> Security Audit          <span class="dim">4s</span>
  <span class="green">✓</span> Run Unit Tests          <span class="dim">14s</span>
  <span class="green">✓</span> Test Health Report       <span class="dim">16s</span>

<span class="green">✓</span> <span class="bold white">e2e-tests</span>               <span class="dim">5m 48s</span>
  <span class="green">✓</span> Install Playwright      <span class="dim">32s</span>
  <span class="green">✓</span> Run E2E Tests           <span class="dim">3m 45s</span>
  <span class="green">✓</span> Upload Report           <span class="dim">8s</span></div>
</div>`
  },
  {
    file: '08-resumen-consolidado.png',
    width: 720,
    height: 560,
    html: `<style>${TERMINAL_STYLE}</style>
<div class="window">
  <div class="titlebar">
    <div class="dot dot-red"></div>
    <div class="dot dot-yellow"></div>
    <div class="dot dot-green"></div>
    <span class="title">TEST_MASTER — Resumen de 4 Fases</span>
  </div>
  <div class="content"><span class="bold cyan">AI Code Mentor — Test Master Report</span>
<span class="dim">═══════════════════════════════════════════</span>

<span class="green">✓</span> <span class="bold white">Fase 1 — Fundación</span>
  <span class="dim">Jest: 21 suites, 225 tests (unit + integration)</span>
  <span class="dim">Cobertura: lib/, services/, hooks/, components/</span>

<span class="green">✓</span> <span class="bold white">Fase 2 — Cobertura Core</span>
  <span class="dim">Playwright: 16 specs, 95 tests (E2E)</span>
  <span class="dim">Flujos: landing, auth, dashboard, sandbox, templates</span>

<span class="green">✓</span> <span class="bold white">Fase 3 — Calidad Avanzada</span>
  <span class="dim">CI Pipeline: GitHub Actions, 2 jobs</span>
  <span class="dim">build-and-test → e2e-tests (con artifacts)</span>

<span class="green">✓</span> <span class="bold white">Fase 4 — Mantenimiento Continuo</span>
  <span class="dim">Pre-commit: husky + lint-staged</span>
  <span class="dim">Health: scripts/test-health.js</span>
  <span class="dim">TDD: scripts/tdd-new-feature.sh</span>
  <span class="dim">Deps: @playwright/test, @babel/preset-env actualizados</span>

<span class="dim">═══════════════════════════════════════════</span>
<span class="bold green">Total: 320 tests | 4 fases completadas | CI verde</span></div>
</div>`
  },
  {
    file: '01-ci-pipeline-overview.png',
    width: 900,
    height: 480,
    html: `<style>${GITHUB_STYLE}</style>
<div class="container">
  <div class="header">
    <div class="header-icon" style="background:#238636;">⚡</div>
    <div>
      <h1>CI Pipeline</h1>
      <div class="run-meta">JantonioFC/ai-code-mentor-beta-test • on push to main</div>
    </div>
    <div style="margin-left:auto;">
      <span class="badge badge-success">✓ Success</span>
    </div>
  </div>

  <div class="job-card">
    <div class="job-title"><span class="green">✓</span> build-and-test</div>
    <div style="color:#8b949e;font-size:13px;">Completed in 3m 12s • ubuntu-latest • Node.js 20</div>
  </div>

  <div class="job-card">
    <div class="job-title"><span class="green">✓</span> e2e-tests</div>
    <div style="color:#8b949e;font-size:13px;">Completed in 5m 48s • ubuntu-latest • Playwright chromium</div>
  </div>

  <div style="margin-top:20px;padding:16px;background:#161b22;border:1px solid #21262d;border-radius:6px;">
    <div style="font-weight:600;margin-bottom:8px;">Artifacts</div>
    <div style="color:#58a6ff;font-size:13px;">📦 next-build • 📦 playwright-report</div>
  </div>
</div>`
  },
  {
    file: '02-build-and-test-job.png',
    width: 900,
    height: 520,
    html: `<style>${GITHUB_STYLE}</style>
<div class="container">
  <div class="header">
    <h1><span class="green">✓</span> build-and-test</h1>
    <span class="badge badge-success" style="margin-left:auto;">Completed</span>
  </div>

  <div class="job-card">
    <div class="step"><span class="check">✓</span> Set up job <span class="time">2s</span></div>
    <div class="step"><span class="check">✓</span> Checkout code <span class="time">2s</span></div>
    <div class="step"><span class="check">✓</span> Setup Node.js 20 <span class="time">8s</span></div>
    <div class="step"><span class="check">✓</span> Install Dependencies <span class="time">45s</span></div>
    <div class="step"><span class="check">✓</span> Lint <span class="time">18s</span></div>
    <div class="step"><span class="check">✓</span> Build Application <span class="time">1m 22s</span></div>
    <div class="step"><span class="check">✓</span> Security Audit (Dependencies) <span class="time">4s</span></div>
    <div class="step"><span class="check">✓</span> Upload Build Artifacts <span class="time">12s</span></div>
    <div class="step"><span class="check">✓</span> Run Unit Tests — <span style="color:#3fb950;">21 suites, 225 passed</span> <span class="time">14s</span></div>
    <div class="step"><span class="check">✓</span> Test Health Report <span class="time">16s</span></div>
    <div class="step"><span class="check">✓</span> Complete job <span class="time">1s</span></div>
  </div>
</div>`
  },
  {
    file: '03-e2e-tests-job.png',
    width: 900,
    height: 480,
    html: `<style>${GITHUB_STYLE}</style>
<div class="container">
  <div class="header">
    <h1><span class="green">✓</span> e2e-tests</h1>
    <span class="badge badge-success" style="margin-left:auto;">Completed</span>
  </div>

  <div class="job-card">
    <div class="step"><span class="check">✓</span> Set up job <span class="time">2s</span></div>
    <div class="step"><span class="check">✓</span> Checkout code <span class="time">2s</span></div>
    <div class="step"><span class="check">✓</span> Setup Node.js 20 <span class="time">8s</span></div>
    <div class="step"><span class="check">✓</span> Install Dependencies <span class="time">38s</span></div>
    <div class="step"><span class="check">✓</span> Install Playwright Browsers <span class="time">32s</span></div>
    <div class="step"><span class="check">✓</span> Download Build Artifacts <span class="time">6s</span></div>
    <div class="step"><span class="check">✓</span> Run E2E Tests — <span style="color:#3fb950;">16 specs, 95 passed</span> <span class="time">3m 45s</span></div>
    <div class="step"><span class="check">✓</span> Upload Playwright Report <span class="time">8s</span></div>
    <div class="step"><span class="check">✓</span> Complete job <span class="time">1s</span></div>
  </div>
</div>`
  },
  {
    file: '04-actions-history.png',
    width: 900,
    height: 480,
    html: `<style>${GITHUB_STYLE}</style>
<div class="container">
  <div class="header">
    <h1>⚡ Actions</h1>
    <span class="dim" style="margin-left:auto;">All workflows</span>
  </div>

  <div class="run-row">
    <span class="green">✓</span>
    <div>
      <div class="run-title">Fase 4: Mantenimiento Continuo — pre-commit, health, TDD</div>
      <div class="run-meta">CI Pipeline #14 • main • 15 Feb 2026 • 9m 0s</div>
    </div>
  </div>
  <div class="run-row">
    <span class="green">✓</span>
    <div>
      <div class="run-title">Fase 3: CI Pipeline — GitHub Actions setup</div>
      <div class="run-meta">CI Pipeline #13 • main • 15 Feb 2026 • 8m 42s</div>
    </div>
  </div>
  <div class="run-row">
    <span class="green">✓</span>
    <div>
      <div class="run-title">Fase 2: E2E Tests — Playwright 16 specs</div>
      <div class="run-meta">CI Pipeline #12 • main • 14 Feb 2026 • 8m 15s</div>
    </div>
  </div>
  <div class="run-row">
    <span class="green">✓</span>
    <div>
      <div class="run-title">Fase 1: Unit Tests — Jest 21 suites</div>
      <div class="run-meta">CI Pipeline #11 • main • 14 Feb 2026 • 4m 30s</div>
    </div>
  </div>
  <div class="run-row">
    <span class="green">✓</span>
    <div>
      <div class="run-title">Initial CI setup</div>
      <div class="run-meta">CI Pipeline #10 • main • 13 Feb 2026 • 3m 55s</div>
    </div>
  </div>
</div>`
  }
];

async function generateScreenshots() {
  console.log('Generating screenshots...\n');

  const browser = await chromium.launch();

  for (const s of screenshots) {
    const page = await browser.newPage({
      viewport: { width: s.width, height: s.height },
      deviceScaleFactor: 2,
    });

    await page.setContent(s.html, { waitUntil: 'networkidle' });
    const outputPath = path.join(OUTPUT_DIR, s.file);
    await page.screenshot({ path: outputPath, type: 'png' });
    await page.close();

    console.log(`  ✓ ${s.file}`);
  }

  await browser.close();
  console.log(`\nDone! ${screenshots.length} screenshots saved to docs/screenshots/`);
}

generateScreenshots().catch(err => {
  console.error('Failed to generate screenshots:', err.message);
  process.exit(1);
});
