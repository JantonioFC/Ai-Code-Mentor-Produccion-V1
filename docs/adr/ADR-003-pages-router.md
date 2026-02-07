# ADR-003: Pages Router vs App Router

**Status**: Accepted  
**Date**: 2026-02-06  
**Deciders**: Development Team

## Context

Next.js offers two routing paradigms:
1. **Pages Router** (`pages/`) - Original, stable routing system
2. **App Router** (`app/`) - New React Server Components-based system

AI Code Mentor was originally built with Pages Router and we evaluated migration.

## Decision

We chose to **remain on Pages Router** for the foreseeable future.

### Current Structure
```
pages/
├── _app.js          # Application wrapper
├── _document.js     # HTML document
├── index.js         # Landing page
├── dashboard.js     # User dashboard
├── codigo.js        # Code sandbox
└── api/             # API routes
    ├── auth/
    ├── v2/
    └── ...
```

## Rationale

| Factor | Pages Router | App Router |
|--------|--------------|------------|
| Stability | Battle-tested | Still evolving |
| Documentation | Extensive | Growing |
| Third-party support | Universal | Partial |
| Migration effort | None | 40+ hours |
| Performance | Good | Better (theoretical) |
| Complexity | Simple | Higher |

### Why Stay on Pages Router?

1. **Stability**: App Router had breaking changes in Next.js 14, 15. Pages Router is frozen.

2. **No Rewrite Needed**: 50+ components work perfectly as-is.

3. **Third-Party Compatibility**: All our dependencies (Sentry, analytics) fully support Pages Router.

4. **Team Familiarity**: Entire codebase follows Pages Router patterns.

5. **Risk/Reward**: Migration cost (~40h) with unclear benefits for our use case.

## Consequences

### Positive
- ✅ Zero migration effort
- ✅ Stable, predictable behavior
- ✅ Full ecosystem compatibility
- ✅ Simpler mental model

### Negative
- ❌ No React Server Components benefits
- ❌ Missing some streaming features
- ❌ Will eventually be legacy (years away)

### Re-evaluation Triggers

Consider migrating to App Router when:
- Starting a new major feature area
- App Router reaches 2+ years of stability
- Significant performance gains proven for our use case

## Related
- `pages/_app.js` - Application entry point
- `next.config.js` - Next.js configuration
