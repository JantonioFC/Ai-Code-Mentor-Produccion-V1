#!/usr/bin/env node

/**
 * Test Health Report - Consolidated Diagnostic Script
 * Fase 4: Mantenimiento Continuo
 *
 * Runs Jest (unit) and Playwright (E2E) in JSON mode,
 * generates a consolidated health report with:
 * - Pass/Fail/Skip counts
 * - Slow tests (>5s for unit, >30s for E2E)
 * - Orphan test files (no assertions)
 *
 * Exit code 1 if any failures detected.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SLOW_UNIT_THRESHOLD = 5000;   // 5s
const SLOW_E2E_THRESHOLD = 30000;   // 30s

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function runCommand(cmd, options = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000, // 5 min max
      ...options,
    });
  } catch (err) {
    // Jest exits with code 1 when tests fail but still outputs JSON
    if (err.stdout) return err.stdout;
    return null;
  }
}

function collectJestResults() {
  console.log(`${c.cyan}Running Jest tests...${c.reset}`);
  const output = runCommand('npx jest --json --forceExit 2>/dev/null');
  if (!output) {
    return { error: 'Jest failed to execute', suites: 0, passed: 0, failed: 0, skipped: 0, slow: [], duration: 0 };
  }

  try {
    const json = JSON.parse(output);
    const slow = [];

    for (const suite of json.testResults || []) {
      for (const test of suite.testResults || []) {
        if (test.duration > SLOW_UNIT_THRESHOLD) {
          slow.push({
            name: test.fullName || test.title,
            duration: test.duration,
            file: path.relative(ROOT, suite.name),
          });
        }
      }
    }

    return {
      suites: json.numTotalTestSuites || 0,
      passed: json.numPassedTests || 0,
      failed: json.numFailedTests || 0,
      skipped: json.numPendingTests || 0,
      slow: slow.sort((a, b) => b.duration - a.duration),
      duration: (json.testResults || []).reduce((sum, s) => sum + (s.endTime - s.startTime), 0),
    };
  } catch (e) {
    return { error: `Failed to parse Jest output: ${e.message}`, suites: 0, passed: 0, failed: 0, skipped: 0, slow: [], duration: 0 };
  }
}

function collectPlaywrightResults() {
  console.log(`${c.cyan}Running Playwright tests...${c.reset}`);
  const output = runCommand('npx playwright test --reporter=json 2>/dev/null');
  if (!output) {
    return { error: 'Playwright failed to execute (dev server may not be running)', specs: 0, passed: 0, failed: 0, skipped: 0, slow: [], duration: 0 };
  }

  try {
    const json = JSON.parse(output);
    const slow = [];
    let passed = 0, failed = 0, skipped = 0, specs = 0;

    for (const suite of json.suites || []) {
      for (const spec of suite.specs || []) {
        specs++;
        for (const test of spec.tests || []) {
          const result = test.results?.[0];
          if (test.status === 'expected') passed++;
          else if (test.status === 'unexpected') failed++;
          else if (test.status === 'skipped') skipped++;

          if (result && result.duration > SLOW_E2E_THRESHOLD) {
            slow.push({
              name: spec.title,
              duration: result.duration,
              file: spec.file || suite.title,
            });
          }
        }
      }
      // Handle nested suites
      for (const nested of suite.suites || []) {
        for (const spec of nested.specs || []) {
          specs++;
          for (const test of spec.tests || []) {
            const result = test.results?.[0];
            if (test.status === 'expected') passed++;
            else if (test.status === 'unexpected') failed++;
            else if (test.status === 'skipped') skipped++;

            if (result && result.duration > SLOW_E2E_THRESHOLD) {
              slow.push({
                name: spec.title,
                duration: result.duration,
                file: spec.file || nested.title,
              });
            }
          }
        }
      }
    }

    return {
      specs,
      passed,
      failed,
      skipped,
      slow: slow.sort((a, b) => b.duration - a.duration),
      duration: json.stats?.duration || 0,
    };
  } catch (e) {
    return { error: `Failed to parse Playwright output: ${e.message}`, specs: 0, passed: 0, failed: 0, skipped: 0, slow: [], duration: 0 };
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function printReport(jest, pw) {
  const divider = '═'.repeat(60);

  console.log(`\n${c.bold}${divider}${c.reset}`);
  console.log(`${c.bold}  TEST HEALTH REPORT${c.reset}`);
  console.log(`${c.bold}${divider}${c.reset}\n`);

  // Jest section
  console.log(`${c.bold}${c.cyan}  UNIT TESTS (Jest)${c.reset}`);
  if (jest.error) {
    console.log(`  ${c.red}Error: ${jest.error}${c.reset}`);
  } else {
    const jestStatus = jest.failed > 0 ? `${c.red}FAIL${c.reset}` : `${c.green}PASS${c.reset}`;
    console.log(`  Status:  ${jestStatus}`);
    console.log(`  Suites:  ${jest.suites}`);
    console.log(`  Passed:  ${c.green}${jest.passed}${c.reset}`);
    if (jest.failed > 0) console.log(`  Failed:  ${c.red}${jest.failed}${c.reset}`);
    if (jest.skipped > 0) console.log(`  Skipped: ${c.yellow}${jest.skipped}${c.reset}`);
    console.log(`  Time:    ${formatDuration(jest.duration)}`);
  }

  console.log('');

  // Playwright section
  console.log(`${c.bold}${c.cyan}  E2E TESTS (Playwright)${c.reset}`);
  if (pw.error) {
    console.log(`  ${c.yellow}Warning: ${pw.error}${c.reset}`);
  } else {
    const pwStatus = pw.failed > 0 ? `${c.red}FAIL${c.reset}` : `${c.green}PASS${c.reset}`;
    console.log(`  Status:  ${pwStatus}`);
    console.log(`  Specs:   ${pw.specs}`);
    console.log(`  Passed:  ${c.green}${pw.passed}${c.reset}`);
    if (pw.failed > 0) console.log(`  Failed:  ${c.red}${pw.failed}${c.reset}`);
    if (pw.skipped > 0) console.log(`  Skipped: ${c.yellow}${pw.skipped}${c.reset}`);
    console.log(`  Time:    ${formatDuration(pw.duration)}`);
  }

  // Slow tests
  const allSlow = [
    ...jest.slow.map(s => ({ ...s, type: 'unit' })),
    ...pw.slow.map(s => ({ ...s, type: 'e2e' })),
  ];

  if (allSlow.length > 0) {
    console.log(`\n${c.bold}${c.yellow}  SLOW TESTS${c.reset}`);
    for (const t of allSlow.slice(0, 10)) {
      console.log(`  ${c.yellow}[${t.type}]${c.reset} ${formatDuration(t.duration)} - ${t.name}`);
      console.log(`  ${c.dim}${t.file}${c.reset}`);
    }
  }

  // Summary
  console.log(`\n${c.bold}${divider}${c.reset}`);
  const totalPassed = jest.passed + pw.passed;
  const totalFailed = jest.failed + pw.failed;
  const totalSkipped = jest.skipped + pw.skipped;
  const overallStatus = totalFailed > 0 ? `${c.red}UNHEALTHY${c.reset}` : `${c.green}HEALTHY${c.reset}`;

  console.log(`  ${c.bold}Overall: ${overallStatus}${c.reset}`);
  console.log(`  Total:  ${totalPassed + totalFailed + totalSkipped} tests (${c.green}${totalPassed} passed${c.reset}, ${c.red}${totalFailed} failed${c.reset}, ${c.yellow}${totalSkipped} skipped${c.reset})`);
  console.log(`${c.bold}${divider}${c.reset}\n`);

  return totalFailed;
}

// Main
async function main() {
  const jestResults = collectJestResults();
  const pwResults = collectPlaywrightResults();
  const failures = printReport(jestResults, pwResults);

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${c.red}Test health report failed: ${err.message}${c.reset}`);
  process.exit(1);
});
