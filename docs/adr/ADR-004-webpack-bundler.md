# ADR-004: Webpack vs Turbopack

**Status**: Accepted  
**Date**: 2026-02-06  
**Deciders**: Development Team

## Context

Next.js supports two bundlers:
1. **Webpack** - Traditional, mature JavaScript bundler
2. **Turbopack** - New Rust-based bundler (default in Next.js 15+)

During development, we encountered issues with Turbopack and needed to make a decision.

## Decision

We chose **Webpack** over Turbopack for now.

### Configuration
```javascript
// next.config.js
// No turbopack: {} means Webpack by default
module.exports = {
  // webpack config for better-sqlite3 exclusion
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        'better-sqlite3': false,
      };
    }
    return config;
  },
};
```

## Rationale

| Factor | Webpack | Turbopack |
|--------|---------|-----------|
| Stability | Rock solid | Beta-quality |
| Build speed | Good | Faster |
| Plugin ecosystem | Massive | Limited |
| Native module support | Full | Partial |
| Error messages | Detailed | Improving |

### Why Webpack?

1. **better-sqlite3 Compatibility**: Turbopack failed to bundle our native SQLite bindings.

2. **Fast Refresh Stability**: Turbopack caused infinite re-render loops in development (M-226 bug).

3. **Sentry Integration**: Sentry webpack plugin is mature; Turbopack support is experimental.

4. **Bundle Analyzer**: `@next/bundle-analyzer` only works with Webpack.

5. **Production Proven**: All our production builds use Webpack without issues.

### Issues Encountered with Turbopack

```
ERROR: Cannot resolve 'better-sqlite3' in client bundle
ERROR: Fast Refresh infinite loop detected
ERROR: Sentry webpack plugin not compatible with Turbopack
```

## Consequences

### Positive
- ✅ All dependencies work correctly
- ✅ Stable development experience
- ✅ Full plugin ecosystem access
- ✅ Predictable build behavior

### Negative
- ❌ Slower dev server startup (~8s vs ~3s)
- ❌ Not leveraging latest Next.js optimizations
- ❌ Will need migration eventually

### Re-evaluation Triggers

Consider migrating to Turbopack when:
- Turbopack reaches stable release
- Native module bundling is supported
- Sentry has official Turbopack plugin
- Next.js 16+ makes it mandatory

## Related
- `next.config.js` - Bundler configuration
- [Downgrade Walkthrough](../walkthroughs/downgrade-walkthrough.md) - Context on stability issues
- Phase 0 of Roadmap - Stack stability work
