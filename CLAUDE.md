# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Backend Development

- **Run locally:** `cd backend && uvicorn app.main:app --reload`
- **Run tests (unit):** `cd backend && pytest tests/unit -v`
- **Run tests (integration):** `cd backend && pytest tests/integration -v`
- **Run all tests:** `cd backend && pytest tests/ -v`
- **Run single test:** `cd backend && pytest tests/unit/path/to/test_file.py::test_name -v`
- **Lint:** `cd backend && flake8`

### Frontend Development

- **Install dependencies:** `cd frontend && npm ci`
- **Run dev server:** `cd frontend && npm run dev` (starts on port 3000)
- **Run prod build:** `cd frontend && npm run build`
- **Run tests:** `cd frontend && npm test -- --watchAll=false`
- **Run single test:** `cd frontend && npm test -- --testNamePattern="test name" --watchAll=false`
- **Lint:** `cd frontend && npm run lint`
- **Lint fix:** `cd frontend && npm run lint:fix`
- **Format:** `cd frontend && npm run format`
- **Format check:** `cd frontend && npm run format:check`

## Architecture Overview

### Backend Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization, middleware setup
│   ├── models.py            # Pydantic models for request/response validation
│   ├── database_client.py   # PostgreSQL client and connection management
│   └── routes/
│       ├── health.py        # Health check endpoint
│       ├── recipes.py       # Recipe CRUD operations
│       └── meal_plans.py    # Meal plan endpoints
├── tests/
│   ├── unit/               # Unit tests (no database)
│   └── integration/        # Integration tests (with database)
└── requirements.txt        # Python dependencies
```

**Key Technical Decisions:**

- **FastAPI**: Lightweight, modern Python web framework with automatic API documentation
- **Pydantic**: Type validation and serialization via models (see `models.py`)
- **psycopg2**: PostgreSQL driver
- **pytest**: Test framework with fixtures for database testing

**Important Patterns:**

- Routes are organized as separate modules in `routes/` directory, each with a FastAPI router
- All external input is validated through Pydantic models
- Integration tests require PostgreSQL to be running (GitHub Actions handles this)
- CORS middleware configured to allow frontend requests

### Frontend Structure

```
frontend/
├── src/
│   ├── App.tsx              # Main app component, navigation logic
│   ├── App.module.css       # App-level styles
│   ├── components/          # Reusable UI components
│   │   ├── top-bar/
│   │   ├── quick-actions/
│   │   └── popup/
│   ├── pages/               # Page-level components
│   │   ├── home/
│   │   ├── meal-planner/
│   │   ├── recipes/
│   │   └── shopping-list/
│   ├── index.tsx            # Entry point
│   └── setupTests.ts        # Test configuration
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

**Key Technical Decisions:**

- **React 18 + TypeScript**: Type-safe component development
- **CSS Modules**: Component-scoped styling (each component has a `.module.css` file)
- **React Router**: TBD for navigation (currently using simple state-based navigation in App.tsx)

**Important Patterns:**

- Components are organized by feature (pages/) and UI concern (components/)
- Styles are colocated with components (e.g., `TopBar.tsx` + `TopBar.module.css`)
- Use CSS Module classes to style components (e.g., `className={styles.button}`)
- No inline `style={{ ... }}` unless for truly dynamic runtime values
- Use semantic HTML elements for accessibility

## Testing Strategy

### Backend Testing

- **Unit tests** (`tests/unit/`): Test individual functions/models without database
- **Integration tests** (`tests/integration/`): Test endpoints with a real PostgreSQL database
- Fixtures for database setup/teardown
- GitHub Actions runs both suites on PRs

### Frontend Testing

- **Unit tests**: React Testing Library with Jest
- Tests should assert on user-visible behavior, not implementation details
- Coverage threshold enforced: 90% for all metrics
- GitHub Actions runs tests and builds on PRs

## Important Constraints & Design Rules

### Frontend (from `.cursor/rules/DESIGN.md`)

- **Styling**: Use CSS Modules exclusively (ComponentName.module.css colocated with component)
- **No Tailwind**: Don't add Tailwind classes to new components
- **No CSS-in-JS**: Avoid styled-components, emotion, etc.
- **No inline styles**: Only for truly dynamic values (runtime-calculated dimensions)
- **TypeScript**: No `any` types; use explicit types for props
- **Accessibility**: All interactive elements must be keyboard accessible; use semantic HTML
- **Component structure**: Prefer function components; keep single responsibility
- **Naming conventions**:
  - Components: `PascalCase` (ComponentName.tsx)
  - Hooks: `useSomethingName` pattern
  - Utilities/helpers: `camelCase`
  - CSS classes: semantic, readable names (not utility-style)

### Backend

- Use Pydantic models for ALL external input validation
- Routes should be thin; business logic belongs in the data layer
- Tests should cover both happy paths and error cases
- Linting with flake8 must pass before merging

## Database

### Setup

- PostgreSQL 15 (see GitHub Actions workflow for version details)
- Database name: `supermarket`
- User: `chubby.user`
- Setup script: `.github/actions/setup-database/action.yml`

### Connecting in Code

- Connection string uses environment variables (`POSTGRES_*`)
- See `app/database_client.py` for connection pooling and management
- Integration tests use fixtures that handle connection lifecycle

## API Configuration

### Base URL

- Default frontend URL: `http://localhost:3000` (via `REACT_APP_FRONTEND_URL` env var)
- API runs on `http://127.0.0.1:8000` during development
- API docs available at `http://127.0.0.1:8000/docs`

### CORS

- Configured in `app/main.py` via FastAPI's `CORSMiddleware`
- Allowed origin: frontend URL (environment variable)

## Common Development Tasks

### Adding a New API Endpoint

1. Define a Pydantic model in `backend/app/models.py` (request/response)
2. Create route in appropriate `backend/app/routes/*.py` file (or create new one)
3. Include router in `backend/app/main.py`
4. Add tests to `backend/tests/integration/` for the new endpoint
5. Update this documentation if new patterns emerge

### Adding a New Frontend Page

1. Create page component in `frontend/src/pages/PageName/`
2. Add `PageName.tsx` and `PageName.module.css`
3. Export from page's `index.ts` if needed
4. Import and add routing logic to `App.tsx`
5. Add component tests in `PageName.test.tsx`

### Running Database Migrations

- Currently, schema management is manual via SQL (see `.github/actions/setup-database/action.yml`)
- For local changes: drop and recreate the database as needed
- Consider adding an alembic migration system for production

## Debugging

### Backend

- Use `print()` or Python debugger
- Uvicorn's `--reload` flag automatically restarts on code changes
- Check FastAPI swagger docs at `/docs` for endpoint testing
- Environment variables from `.env` file (if present)

### Frontend

- React DevTools browser extension recommended
- Console in browser DevTools
- ESLint warnings in editor
- `npm test` with `--watch` flag for development

## Git & PR Conventions

- PR title should be concise (under 70 chars)
- PR description: summarize by Backend/Frontend; include diagrams if showing new components
- Branch naming: consider prefixes like `feat/`, `fix/`, `refactor/`
- Exclude minor refactors from PR summary

## Tooling Notes

- **Backend**: flake8 configuration in backend directory (inherited from GitHub Actions)
- **Frontend**: ESLint + Prettier configured in `package.json`; prettier config should match `.prettierrc` if present
- **Tests**: pytest and Jest both have coverage thresholds (frontend: 90%)
