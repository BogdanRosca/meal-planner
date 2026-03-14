# Architecture Rules

> Purpose: Define the structural patterns and conventions used in this meal-planner portfolio project.
> Scope: Backend (FastAPI/Python), Frontend (React/TypeScript), and cross-project patterns.

---

## Backend Architecture

### Overview
- **Framework**: FastAPI (lightweight, async-ready, auto-documentation)
- **Database**: PostgreSQL 15 via psycopg2
- **Organization**: Domain-based routers + centralized database client
- **Validation**: Pydantic models at all API boundaries

### Directory Structure
```
backend/app/
├── main.py              # FastAPI setup, middleware, router registration
├── models.py            # Pydantic validation models (Create, Update, Response)
├── database_client.py   # PostgreSQL access layer (all queries)
└── routes/
    ├── health.py        # Health check endpoint
    ├── recipes.py       # Recipe CRUD: GET, POST, PATCH, DELETE
    └── meal_plans.py    # Meal plan endpoints
```

### Router Pattern (Domain-Based)

Each route file defines an `APIRouter` with a prefix:

```python
# routes/recipes.py
router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("")
def get_all_recipes():
    db_client = DatabaseClient()
    try:
        if not db_client.connect():
            raise HTTPException(status_code=500, detail="DB connection failed")
        recipes = db_client.get_all_recipes()
        return {"status": "success", "count": len(recipes), "recipes": recipes}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        db_client.disconnect()
```

**Rules:**
- One router per domain (recipes, meal_plans, etc.)
- All routers registered in `main.py` via `app.include_router(router)`
- Follow RESTful conventions (GET, POST, PATCH, DELETE)
- Always return JSON response envelope: `{"status": "success", "data": ...}` or `{"status": "error", "detail": "..."}`

### Database Layer (DatabaseClient)

Location: `app/database_client.py`

**Pattern - Single DatabaseClient Class:**
- Encapsulates all database operations
- One instance per request (instantiated in route handlers)
- Explicit connect/disconnect lifecycle

**Usage in Routes:**
```python
db_client = DatabaseClient()
try:
    db_client.connect()  # Establish connection
    result = db_client.get_recipe_by_id(recipe_id)
finally:
    db_client.disconnect()  # Always cleanup
```

**Methods organized by domain:**
- `get_all_recipes()`, `get_recipe_by_id(id)`, `add_recipe(data)`, `update_recipe(id, data)`, `delete_recipe(id)`
- `get_meal_plan_by_week(week)`, `add_meal_plan_entry(data)`, `delete_meal_plan_entry(id)`

**Rules:**
- All database queries belong in DatabaseClient, not in routes
- Use parameterized queries (?) to prevent SQL injection
- Return raw data (dicts/lists) from DatabaseClient
- Let Pydantic models in routes handle validation/transformation

### Models (Pydantic Validation)

Location: `app/models.py`

**Pattern - Separate Models for Each Operation:**
```python
class Ingredient(BaseModel):
    quantity: float
    unit: str
    name: str

class RecipeCreate(BaseModel):
    name: str
    category: str
    main_ingredients: List[Ingredient]
    common_ingredients: Optional[List[str]] = []
    instructions: str
    prep_time: int
    portions: int

class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    # All fields optional for PATCH operations
```

**Rules:**
- Create = request model for POST (all required fields)
- Update = request model for PATCH (all optional fields)
- Response = output model with full data + id
- Use `Optional[Type]` for nullable fields
- Pydantic automatically validates type and required fields

### Error Handling

**Pattern - Try-Finally for Cleanup:**
```python
try:
    db_client.connect()
    # perform operations
except HTTPException:
    raise  # Re-raise HTTP errors as-is
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
finally:
    db_client.disconnect()  # Always cleanup
```

**Rules:**
- Always use try-finally to ensure `db_client.disconnect()`
- Use `HTTPException` for API errors with appropriate status codes
- Include detail messages for debugging
- Let general exceptions become 500 errors (logged by framework)

### CORS Middleware

Configured in `main.py`:
```python
frontend_url = os.getenv("REACT_APP_FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Rule**: Single origin allowed (controlled via environment variable)

---

## Frontend Architecture

### Overview
- **Framework**: React 18 + TypeScript
- **Styling**: CSS Modules (component-scoped)
- **State Management**: Custom React hooks (useState, useEffect, useCallback)
- **API Layer**: Service objects with fetch
- **Testing**: React Testing Library + Jest

### Directory Structure
```
frontend/src/
├── pages/              # Full-page components (route destinations)
│   ├── home/
│   ├── recipes/        # Container component for recipe features
│   ├── meal-planner/
│   └── shopping-list/
├── components/         # Reusable UI components
│   ├── recipes/        # Domain-specific components
│   ├── popup/          # Modal/popup components
│   ├── quick-actions/
│   ├── top-bar/
│   └── categories/
├── hooks/              # Custom React hooks
│   ├── useRecipes.ts   # Fetch + CRUD logic for recipes
│   └── useMealPlanner.ts
├── services/           # API client layer
│   ├── recipeService.ts
│   └── mealPlanService.ts
├── config/             # Static configuration
│   └── api.ts          # API_ENDPOINTS constants
├── types/              # TypeScript interfaces
│   └── index.ts
└── App.tsx             # Root component with navigation
```

### Component Organization: Pages vs Components

**Pages** (Container Components):
- Full-page components in `pages/` directory
- Manage local state, fetch data, handle logic
- Coordinate multiple sub-components
- Example: `pages/recipes/Recipes.tsx` fetches all recipes, manages selected recipe, handles add/delete

**Components** (Presentational Components):
- Reusable UI components in `components/` directory
- Receive data via props, emit events via callbacks
- No API calls, minimal state
- Example: `components/recipes/RecipeCard.tsx` displays recipe, calls `onRecipeClick(recipe)`

**Rule**: Keep presentational components pure; container components orchestrate

### State Management Pattern (Custom Hooks)

**Hook Pattern - Encapsulate logic as composable hooks:**

```typescript
export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recipeService.getAllRecipes();
        setRecipes(data);
      } catch (err) {
        setError('Failed to load recipes');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const addRecipe = async (newRecipe: Omit<Recipe, 'id'>) => {
    try {
      const added = await recipeService.addRecipe(newRecipe);
      setRecipes(prev => [...prev, added]);
      return true;
    } catch {
      return false;
    }
  };

  return { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe };
};
```

**Usage in Components:**
```typescript
const Recipes = () => {
  const { recipes, loading, error, addRecipe } = useRecipes();

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
    </>
  );
};
```

**Rules:**
- Custom hooks are composable units of state + logic
- Hook names start with `use*` (React convention)
- Return object with state and action functions
- Handle loading/error states inside hook
- Fetch data in `useEffect`, never in render
- Use `useCallback` only for memoized callbacks passed to memoized children

### Service Layer (API Client)

Location: `services/recipeService.ts`

**Pattern - Object with async methods:**
```typescript
export const recipeService = {
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch(API_ENDPOINTS.RECIPES);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: RecipesResponse = await response.json();
      return data.recipes;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  },

  async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    try {
      const response = await fetch(API_ENDPOINTS.RECIPES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  },
};
```

**Rules:**
- Service is an object with async methods (singleton-like)
- Use native `fetch` API
- Return strongly typed promises
- Throw errors for caller to handle (hooks handle loading/error UI)
- Centralize API endpoints in `config/api.ts`

### Styling (CSS Modules)

**Pattern - Component-scoped CSS:**
```typescript
// components/recipes/RecipeCard.tsx
import styles from './RecipeCard.module.css';

export function RecipeCard({ recipe, onRecipeClick }: Props) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{recipe.name}</h3>
      <button className={styles.button} onClick={() => onRecipeClick(recipe)}>
        View Details
      </button>
    </div>
  );
}
```

```css
/* RecipeCard.module.css */
.card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 4px;
}

.title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.button {
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}
```

**Rules:**
- Each component gets a `.module.css` file with same name
- Import as: `import styles from './ComponentName.module.css'`
- Use semantic class names (not utility-style like `mt-4`)
- No global component styles (only reset.css, tokens.css allowed)
- No inline `style={{ ... }}` except for runtime-calculated values

### Testing Pattern

**Unit Tests - Components:**
- React Testing Library + Jest
- Mock services and callbacks
- Test user interactions and rendered output
- Use CSS selectors or `getByRole`/`getByLabelText`

**Hook Tests:**
- `renderHook` from React Testing Library
- Mock service modules with `jest.mock()`
- Test state updates with `waitFor`

**Service Tests:**
- Mock global `fetch`
- Test success and error paths
- Verify fetch parameters

**Rules:**
- Aim for 90% coverage (branches, functions, lines, statements)
- Test behavior, not implementation
- Mock external dependencies (services, API)
- Use `waitFor` for async state updates
- Cleanup mocks with `jest.clearAllMocks()`

### Navigation Pattern (Current)

**App.tsx - State-Based Navigation:**
```typescript
const [currentSection, setCurrentSection] = useState('Meal Planner');

const handleNavigation = (section: string) => {
  setCurrentSection(section);
};

return (
  <>
    <TopBar onNavigate={handleNavigation} />
    <main>
      {currentSection === 'Recipes' && <Recipes />}
      {currentSection === 'Meal Planner' && <MealPlanner />}
      {/* ... */}
    </main>
  </>
);
```

**Current Limitations:**
- No browser history/back button support
- No deep linking (e.g., `/recipes/123`)
- Doesn't scale beyond ~5 pages

**Note**: React Router planned for future iteration (see BACKLOG.md)

---

## Cross-Project Patterns

### API Contract

**Backend Response Format:**
```json
{
  "status": "success",
  "count": 5,
  "recipes": [...]
}
```

**Error Response Format:**
```json
{
  "status": "error",
  "detail": "Database connection failed"
}
```

**Rule**: All responses use status field; frontend checks `response.ok` before parsing

### Configuration

**Environment Variables:**
- `REACT_APP_FRONTEND_URL` - frontend origin for CORS (default: `http://localhost:3000`)
- `PGHOST`, `PGPORT`, `PGDATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` - database connection

**Frontend API Endpoints:**
Centralized in `frontend/src/config/api.ts`
```typescript
export const API_ENDPOINTS = {
  RECIPES: 'http://localhost:8000/recipes',
  MEAL_PLANS: 'http://localhost:8000/meal-plans',
  HEALTH: 'http://localhost:8000/health',
};
```

### Testing Coverage

**Backend:**
- Unit tests: Test individual functions with mocked database
- Integration tests: Real PostgreSQL, full endpoint testing

**Frontend:**
- Unit tests: Components, hooks, services with mocks
- 90% coverage threshold enforced

**Rule**: All tests run in CI/CD before merge to main

---

## Naming Conventions

### Backend (Python)
- **Functions/Variables**: `snake_case`
- **Classes**: `PascalCase` (e.g., `DatabaseClient`)
- **Files**: `snake_case` (e.g., `database_client.py`)
- **Constants**: `UPPER_SNAKE_CASE`

### Frontend (TypeScript)
- **Components**: `PascalCase` (e.g., `RecipeCard.tsx`)
- **Functions/Variables**: `camelCase`
- **Hooks**: `use*` pattern (e.g., `useRecipes.ts`)
- **Interfaces/Types**: `PascalCase` (e.g., `Recipe`, `RecipesResponse`)
- **Directories**: `kebab-case` (e.g., `quick-actions/`, `meal-planner/`)
- **CSS Modules**: `ComponentName.module.css`
- **Test Files**: `*.test.ts(x)` suffix
- **Unused Props**: `_propName` prefix (e.g., `_recipe`)

---

## What's Out of Scope (For Now)

See `ARCHITECTURE_IMPROVEMENTS.md` for planned improvements:
- Authentication/Authorization
- React Router for client-side routing
- Global state management (Redux, Context API)
- Connection pooling and request caching
- Database migrations system
- Request deduplication and response caching
- E2E testing
