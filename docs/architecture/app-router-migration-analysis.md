# App Router vs Pages Router Analysis

## 1. Context
Next.js 13+ introduced the **App Router**, built on React Server Components (RSC). AI Code Mentor currently uses the **Pages Router** (integrated with Next.js 15.1.6). This document evaluates the feasibility and benefits of migrating to the App Router.

## 2. Feature Comparison Matrix

| Feature | Pages Router (Current) | App Router (Target) | Benefit |
|---------|------------------------|---------------------|---------|
| **Data Fetching** | `getServerSideProps` / `getStaticProps` | Server Components + `fetch` | Less JS sent to client |
| **Layouts** | `_app.js` (Global) | Nested `layout.js` | Partial rendering, less re-renders |
| **SEO** | `next-seo` / `Head` | Metadata API | Native, more robust |
| **Streaming** | Limited | Native (Suspense) | Better perceived performance (TTFB) |
| **Loading/Error UI** | Manual state management | `loading.js` / `error.js` | Standardized DX |

## 3. Performance Impact
- **Bundle Size**: Significant reduction (RSC removes heavy libraries from the client bundle).
- **TTFB (Time to First Byte)**: Improved with Streaming.
- **Hydration**: Reduced hydration surface area.

## 4. Migration Strategy: Incremental Approach
The App Router coexists with the Pages Router. We will migrate in phases:

### Phase 1: Setup & Public Pages
1. Create `app/` directory.
2. Initialize root `layout.js` (Auth/Theme providers).
3. Migrate `pages/index.js` -> `app/page.js`.
4. Migrate `pages/login.js` -> `app/login/page.js`.

### Phase 2: Dashboard & Internal Tools
1. Migrate `/panel-de-control`.
2. Migrate `/codigo` (Sandbox).
3. Migrate `/plantillas`.

### Phase 3: Complexity & APIs
1. Migrate `/leccion/[id]` (Complex dynamic routes).
2. Migrate `/api/v1/*` -> `app/api/*` (Route Handlers).

## 5. POC: Coexistence Setup

```javascript
// app/layout.js (The new root)
import AuthProvider from '../lib/auth/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

## 6. Risks & Mitigation
- **Risk**: Learning curve for RSC.
- **Mitigation**: Start with simple static pages.
- **Risk**: Interaction between `useAuth` (Client) and Server Components.
- **Mitigation**: Keep Auth context at the root layout and pass session data as needed.

## 7. Recommendation
**HOLD**. We should wait for Phase 3.3 (Refresh Tokens) to be stable before attempting a migration, as Auth is the most sensitive part of the App Router transition. Target migration start: Q2 2026.
