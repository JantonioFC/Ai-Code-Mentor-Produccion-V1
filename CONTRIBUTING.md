
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

## Documentation

### Wiki
The project uses a wiki structure for comprehensive documentation:
*   **Local Wiki**: Located in `wiki/` directory
*   **DeepWiki Integration**: Interactive documentation at [deepwiki.com/JantonioFC/ai-code-mentor-beta-test](https://deepwiki.com/JantonioFC/ai-code-mentor-beta-test)

### Updating Documentation
When making significant changes:
1.  Update relevant wiki pages in `wiki/`
2.  Run `npm run wiki:validate` to check structure
3.  Run `npm run wiki:index` to regenerate index
4.  Update main README.md if needed

### Wiki Management Scripts
*   `npm run wiki:list` - List all wiki pages
*   `npm run wiki:validate` - Validate wiki structure
*   `npm run wiki:index` - Generate wiki index

For detailed development workflow, see [Development Workflow](wiki/2.3-development-workflow.md).

---
*Happy Coding!*
