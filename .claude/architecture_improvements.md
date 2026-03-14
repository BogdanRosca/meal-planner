# Architecture Improvements Backlog

This document tracks architectural improvements and refactoring opportunities for future iterations. Items are organized by priority and area.

---

## 🔴 High Priority

### Backend: Connection Pooling
**Issue**: DatabaseClient creates a new connection per request
- Creates fresh `psycopg2` connection in every route handler
- Scales poorly with concurrent requests
- No connection reuse or pooling

**Solution**:
- Investigate `psycopg2.pool.SimpleConnectionPool` or `psycopg2.pool.ThreadedConnectionPool`
- Move connection pool to application-level initialization in `main.py`
- Routes access pool instead of creating connections
- Reduces connection overhead significantly

**Impact**: Performance improvement for concurrent requests
**Effort**: Medium (requires refactoring database access pattern)
**Reference**: See `.claude/rules/ARCHITECTURE.md` - "Database Layer" section

---

### Frontend: React Router Implementation
**Issue**: State-based navigation doesn't support:
- Browser back/forward buttons
- Deep linking (`/recipes/123`)
- URL-based state
- Scalability beyond ~5 pages

**Solution**:
- Add `react-router-dom` v6
- Convert `currentSection` state to route-based navigation
- Define routes in routing config (could be separate file)
- Example pages: `/`, `/recipes`, `/recipes/:id`, `/meal-planner`, `/shopping-list`
- Preserves navigation state in URL

**Impact**: Better UX, scalable navigation, standard React pattern
**Effort**: Medium (touch multiple components)
**Blocking**: N/A (frontend feature, doesn't block other work)

---

### Backend: Authentication & Authorization
**Issue**: Hardcoded user in frontend, no auth in backend
```typescript
currentUser={{ name: 'John Doe' }}  // Hardcoded
```

**Solution**:
- Add JWT or session-based auth to FastAPI
- Protect endpoints with auth middleware
- Frontend stores token, sends in Authorization header
- Support login/logout flows

**Impact**: Security, user-specific features
**Effort**: High (affects API contract, requires frontend changes)
**Blocking**: Until user-specific features needed
**Note**: Currently acceptable for portfolio project

---

## 🟡 Medium Priority

### Database: Migrations System
**Issue**: Schema management is manual (SQL in GitHub Actions)
- No version history of schema changes
- Hard to track what changed and when
- Difficult to apply changes in development

**Solution**:
- Add Alembic (Python database migrations) or similar
- Define migrations as code in `backend/alembic/` directory
- Run migrations on startup or explicitly
- Track schema versions in database

**Impact**: Better schema management, easier collaboration
**Effort**: Medium (learning curve for Alembic)
**Blocking**: Not urgent for portfolio project

---

### Frontend: Global State Management
**Issue**: Current state management doesn't handle:
- User context across pages (if auth added)
- Shared state (e.g., selected recipe for meal planner)
- Prop drilling as features increase

**Solution**:
- Evaluate Context API vs Redux vs Zustand
- For portfolio: Context API + useReducer probably sufficient
- Could centralize user, recipes, meal plans state
- Reduces prop drilling

**Impact**: Cleaner component props, easier to add features
**Effort**: Medium (requires refactoring state)
**Blocking**: After React Router (good time to add both)
**Note**: Current approach works fine for small apps

---

### Frontend: Request Caching & Deduplication
**Issue**: Services don't cache responses
- User clicks "Recipes" twice quickly → two identical fetch calls
- No deduplication of in-flight requests
- No cache invalidation strategy

**Solution**:
- Add simple cache in service layer (Map of URL → cached response)
- Deduplicate in-flight requests (only one fetch for same URL)
- Add cache invalidation on mutation (POST/PATCH/DELETE)
- Could use React Query (TanStack Query) for more sophisticated caching

**Impact**: Better performance, fewer API calls
**Effort**: Low (if simple cache), High (if using React Query)
**Priority**: After core features stable

---

### Testing: E2E Tests
**Issue**: No end-to-end tests (browser automation)

**Solution**:
- Add Playwright or Cypress for E2E tests
- Test full user flows: add recipe → view in meal planner → export shopping list
- Run against staging environment or local dev server

**Impact**: Confidence in full user flows
**Effort**: Medium (learning + test writing)
**Note**: Usually added after core features stable

---

## 🟢 Low Priority / Refinement

### Backend: Dependency Injection
**Issue**: Routes tightly coupled to DatabaseClient
- Hard to swap implementations (for testing or alternative databases)
- DatabaseClient instantiation logic spread across routes

**Solution**:
- Use FastAPI's dependency injection (`Depends()`)
- Define `get_db()` dependency function
- Routes request database via `db: DatabaseClient = Depends(get_db)`
- Cleaner, more testable

**Impact**: Better testability, cleaner code
**Effort**: Low (FastAPI has built-in support)
**Note**: Nice-to-have refactor

---

### Backend: Structured Logging
**Issue**: No logging framework, just `print()` and exception messages
- Hard to trace request flows
- No log levels (INFO, WARNING, ERROR)
- No structured logging for debugging

**Solution**:
- Add Python `logging` module or `loguru`
- Log HTTP requests, database operations, errors
- Include request IDs for tracing

**Impact**: Better debugging and monitoring
**Effort**: Low (straightforward add)
**Note**: Quality-of-life improvement

---

### Frontend: API Error Handling Standardization
**Issue**: Error handling varies between services
- Some throw, some return null
- No consistent error structure

**Solution**:
- Define standard error response type
- All services throw consistent errors
- Hooks handle errors uniformly
- UI displays error messages consistently

**Impact**: Better error UX
**Effort**: Low (refactoring existing code)

---

### Testing: Improve Component Tests
**Issue**: Some tests use CSS selectors instead of accessibility queries
```typescript
container.querySelector('.recipe-card')  // Implementation detail
```

**Better Approach**:
```typescript
getByRole('article')  // Accessible name or explicit getByRole
getByLabelText('Recipe name')
```

**Impact**: Tests reflect actual user interactions
**Effort**: Low (incrementally as tests are touched)

---

### Frontend: Design Tokens / Theming
**Issue**: No design system or token consistency
- Colors, spacing hardcoded in multiple CSS files
- No dark mode support
- Hard to maintain consistent design

**Solution**:
- Create `src/styles/tokens.css` with CSS variables
  ```css
  :root {
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
  }
  ```
- Reference tokens in component CSS
- Enables theming, easier maintenance

**Impact**: Design consistency, easier theming
**Effort**: Low (mostly refactoring existing CSS)

---

### Performance: Image Optimization
**Issue**: If recipes have images, not optimized
- No lazy loading
- No responsive images
- No WebP format variants

**Solution**:
- Add `next/image` (if migrating to Next.js) or use `<img loading="lazy">`
- Consider image CDN or optimization service
- Responsive sizes with srcset

**Impact**: Faster page loads, especially on mobile
**Effort**: Medium (depends on image strategy)
**Note**: Only needed if adding images prominently

---

## Decisions Made (Kept As-Is)

✅ **No ORM** - DatabaseClient with raw SQL is fine for portfolio scope
✅ **No TypeORM or Sequelize** - Direct psycopg2 acceptable for learning
✅ **Fetch API instead of Axios** - Native fetch is sufficient
✅ **No Next.js** - React SPA is appropriate for this scope
✅ **CSS Modules instead of Tailwind** - Explicit choice, working well

---

## Related Issues

- See `CLAUDE.md` for current architecture overview
- See `.claude/rules/ARCHITECTURE.md` for detailed architectural patterns
- See `.claude/rules/design.md` for frontend design/styling rules

---

## How to Use This Backlog

- **When starting work**: Check this list for related improvements
- **When refactoring**: Use as guide for patterns to implement
- **When planning sprints**: Prioritize by color (🔴 → 🟡 → 🟢)
- **When completing items**: Move to completed section below

---

## Completed Improvements

*(None yet - future section for tracking progress)*
