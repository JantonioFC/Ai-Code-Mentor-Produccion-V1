#!/usr/bin/env bash

# TDD New Feature Workflow
# Fase 4: Mantenimiento Continuo
#
# Usage: npm run tdd -- <feature-name>
#   or:  bash scripts/tdd-new-feature.sh <feature-name>
#
# Creates a test file with Red-Green-Refactor template
# and launches Jest in watch mode.

set -euo pipefail

FEATURE_NAME="${1:-}"

if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: npm run tdd -- <feature-name>"
  echo ""
  echo "Example: npm run tdd -- userProfile"
  echo "Creates: tests/unit/userProfile.test.js"
  exit 1
fi

# Sanitize: allow only alphanumeric, hyphens, underscores
if [[ ! "$FEATURE_NAME" =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
  echo "Error: Feature name must start with a letter and contain only alphanumeric, hyphens, or underscores."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DIR="$PROJECT_ROOT/tests/unit"
TEST_FILE="$TEST_DIR/$FEATURE_NAME.test.js"

# Ensure test directory exists
mkdir -p "$TEST_DIR"

# Check if file already exists
if [ -f "$TEST_FILE" ]; then
  echo "Test file already exists: tests/unit/$FEATURE_NAME.test.js"
  echo "Launching Jest in watch mode..."
  cd "$PROJECT_ROOT"
  npx jest --watch --testPathPattern="$FEATURE_NAME"
  exit 0
fi

# Create test file with TDD template
cat > "$TEST_FILE" << EOF
/**
 * TDD: $FEATURE_NAME
 *
 * Red-Green-Refactor Workflow:
 * 1. RED    - Write a failing test (describe what the feature should do)
 * 2. GREEN  - Write minimal code to make the test pass
 * 3. REFACTOR - Clean up while keeping tests green
 *
 * Created: $(date +%Y-%m-%d)
 */

// TODO: Import the module under test
// const { $FEATURE_NAME } = require('../../lib/$FEATURE_NAME');

describe('$FEATURE_NAME', () => {
  // ============================================
  // PHASE 1: RED - Write failing tests first
  // ============================================

  describe('basic functionality', () => {
    test.todo('should exist and be a function/class');

    test.todo('should handle valid input correctly');

    test.todo('should return expected output format');
  });

  // ============================================
  // PHASE 2: GREEN - Make tests pass
  // ============================================

  describe('edge cases', () => {
    test.todo('should handle empty input');

    test.todo('should handle invalid input gracefully');
  });

  // ============================================
  // PHASE 3: REFACTOR - Improve implementation
  // ============================================

  describe('integration', () => {
    test.todo('should work with related modules');
  });
});
EOF

echo "Created: tests/unit/$FEATURE_NAME.test.js"
echo ""
echo "TDD Workflow:"
echo "  1. RED    - Edit the test file and write failing assertions"
echo "  2. GREEN  - Implement lib/$FEATURE_NAME.js to pass tests"
echo "  3. REFACTOR - Clean up code while tests stay green"
echo ""
echo "Launching Jest in watch mode..."

cd "$PROJECT_ROOT"
npx jest --watch --testPathPattern="$FEATURE_NAME"
