
# Contributing to AI Code Mentor

Thank you for your interest in contributing! We follow strict coding standards to ensure quality, maintainability, and enterprise readiness.

## Code Quality Principles

1.  **Readability First**: Clear variable/function names > comments.
2.  **KISS**: Simplest solution that works.
3.  **DRY**: Extract common logic.
4.  **Immutability**: Avoid direct mutation. Use spread operators.

## TypeScript/JavaScript Standards

### Variable Naming
*   **Boolean**: `isUserAuthenticated`, `hasAccess`, `canEdit`.
*   **Functions**: Verb-Noun (`fetchData`, `calculateTotal`).
*   **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`).

### Error Handling
All internal services must return a standardized Result or throw detailed Errors.
```typescript
try {
  // logic
} catch (error) {
  console.error('[Service] Action Failed:', error);
  throw new AppError('Detailed Message', 500);
}
```

### File Organization
*   `components/` (PascalCase)
*   `lib/` (camelCase)
*   `hooks/` (camelCase, prefix `use`)

## React Best Practices

1.  **Component Structure**:
    ```typescript
    interface Props { ... }
    export const Component = ({ ... }: Props) => { ... }
    ```
2.  **State**:
    *   UI State -> `useState`
    *   Server State -> `swr` or `react-query`
    *   Global App State -> `zustand` (e.g. `useLessonStore`)

## Branching Strategy
*   `main`: Production-ready code.
*   `dev`: Integration branch.
*   Feature branches: `feature/feature-name`

## UI/UX Guidelines
*   **Accessibility**: All interactive elements must have `aria-label` if no text. High contrast (4.5:1).
*   **Touch**: Minimum 44x44px targets.
*   **Icons**: Use Lucide React (SVG). No Emojis as icons.

---
*Happy Coding!*
