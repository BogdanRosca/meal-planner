# Frontend Linting Rules

> Purpose: Enforce consistent code quality and formatting in frontend code.
> Scope: All TypeScript/JavaScript files in `/frontend/src` directory.

---

## Mandatory Post-Change Verification

**When any file in `/frontend/src` is modified:**

1. **Always check ESLint errors** after making changes
   - Review the error output carefully
   - Address all eslint violations immediately
   - Do not assume fixes will work without verification

2. **Common Prettier Formatting Issues:**
   - Long lines must be split properly
   - Argument lists should break after opening parenthesis if needed
   - State initialization with long values needs proper line breaks
   - Use `clamp()` for responsive values instead of fixed px

3. **Fix Process:**
   - After each file modification, check for compilation errors
   - If ESLint reports issues, fix them immediately in the same edit
   - Verify the fix by re-reading the affected lines
   - Never leave formatting errors unresolved

## Common Patterns to Avoid

### useState Declarations
❌ **Bad - Too long on one line:**
```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
```

✅ **Good - Split properly:**
```typescript
const [selectedCategory, setSelectedCategory] =
  useState<string>('All Categories');
```

### Function Parameters with Defaults
❌ **Bad - Too long on one line:**
```typescript
const Recipes: React.FC<RecipesProps> = ({ selectedCategory = 'All Categories' }) => {
```

✅ **Good - Multi-line:**
```typescript
const Recipes: React.FC<RecipesProps> = ({
  selectedCategory = 'All Categories',
}) => {
```

### CSS Units
❌ **Bad - Fixed pixels:**
```css
width: 140px;
padding: 14px 20px;
```

✅ **Good - Responsive clamp():**
```css
flex: 0 0 clamp(180px, 30%, 270px);
padding: clamp(12px, 2vw, 14px) clamp(16px, 3vw, 20px);
```

## ESLint Configuration

- **Extend:** Use project's existing eslintrc configuration
- **Prettier Integration:** ESLint and Prettier must not conflict
- **Auto-fix:** Some issues can be fixed with formatter, but verify manually

## Testing After Changes

After frontend modifications:
```bash
cd frontend
npm run lint
npm run format:check
npm test -- --watchAll=false
```

---

## When to Apply This Rule

- ✅ Modifying existing components
- ✅ Creating new components or pages
- ✅ Updating CSS modules
- ✅ Modifying hooks or services
- ✅ Any TypeScript/JavaScript file changes
