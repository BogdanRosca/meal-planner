---
name: can-i-deploy
description: This skill will perform all checks that would run at CI level in a local environment
---

# Can I Deploy? Pre-deployment Validation Guide

Verify all quality standards are met before pushing to production.

## When to Use

- Use this skill when prompted `/can-i-deploy`
- Run these checks before creating a pull request or deployment

## Instructions

### 1. Backend Validation
When there are changes in `/backend`:

1. **Activate the virtual environment**
   ```bash
   cd backend
   source .venv/bin/activate
   ```

2. **Run Linting with Flake8**
   ```bash
   flake8 app/
   ```
   - ✅ Should exit with code 0 (no errors)

3. **Run Unit Tests**
   ```bash
   python -m pytest tests/unit -v
   ```
   - ✅ All tests must pass
   - ✅ Check for any failures or errors

4. **Run Integration Tests**
   ```bash
   python -m pytest tests/integration -v
   ```
   - ✅ All tests must pass
   - ✅ Database connectivity required

5. **Expected Result**
   - All tests passing
   - No linting errors
   - Ready for deployment ✅

---

### 2. Frontend Validation
When there are changes in `/frontend`, run these checks in order:

#### Step 1: Validate Linting
```bash
cd frontend
npm run lint
```
- ✅ Exit code must be 0 (no errors)
- ⚠️ Warnings are acceptable (testing-library best practices)

#### Step 2: Run Unit Tests
```bash
npm test -- --coverage --watchAll=false --testTimeout=10000
```
- ✅ All tests must pass
- ✅ No failed test suites
- ⚠️ Watch for any failing tests related to your changes

#### Step 3: Verify Test Coverage
After running tests with `--coverage`:
- ✅ Branches coverage: **≥ 90%**
- ✅ Functions coverage: **≥ 90%**
- ✅ Lines coverage: **≥ 90%**
- ✅ Statements coverage: **≥ 90%**
- Excluded files that don't count toward coverage:
  - `src/index.tsx`
  - `src/serviceWorker.ts`
  - `src/reportWebVitals.ts`
  - `src/setupTests.ts`
  - `src/types/**`
  - `src/declarations.d.ts`

#### Step 4: Validate Build
```bash
npm run build
```
- ✅ Build must complete without errors
- ✅ Check `build/` folder is created with:
  - `build/static/js/main.*.js`
  - `build/static/css/main.*.css`
- ⚠️ Build warnings are acceptable

#### Step 5: Run Integration Tests (Optional)
If you want to test the app locally:
```bash
npm run start &          # Start app on port 3000
# Run tests against running app
npm test -- --watchAll=false --testTimeout=10000
kill %1                   # Stop the app
```

#### Step 6: Code Formatting Check
```bash
npm run format:check
```
- ✅ All files must be properly formatted
- If fails, run: `npm run format` to auto-fix

---

## Complete Pre-Deployment Checklist

### Frontend ✅
- [ ] **No lint errors**: `npm run lint` exits with code 0
- [ ] **All unit tests pass**: `npm test` shows all tests passing
- [ ] **Coverage ≥ 90%**: Coverage report shows all metrics above 90%
- [ ] **No build errors**: `npm run build` completes successfully
- [ ] **Code formatting valid**: `npm run format:check` passes
- [ ] **No console errors**: Check browser console for errors

### Backend ✅
- [ ] **No linting errors**: `flake8 app/` exits with code 0
- [ ] **All unit tests pass**: `pytest tests/unit -v` all passing
- [ ] **All integration tests pass**: `pytest tests/integration -v` all passing
- [ ] **Database connects**: Integration tests can reach database

---

## Troubleshooting

### Frontend Coverage Below 90%
- Run coverage report: `npm test -- --coverage --watchAll=false`
- Identify uncovered branches in the report
- Add tests for missing branches
- Check `src/hooks/useMealPlanner.test.ts` and `src/services/recipeService.test.ts` for branch coverage

### Lint Errors
- Fix automatically: `npm run lint:fix`
- Check for remaining issues: `npm run lint`
- Common fixes:
  - Missing semicolons
  - Incorrect spacing
  - Unused variables

### Test Failures
- Run specific test: `npm test -- --testNamePattern="test name"`
- Check test setup: `npm test -- --verbose`
- Ensure mocks are properly configured in test file

### Build Failures
- Check for TypeScript errors: `npm run build 2>&1 | grep -A 5 "TS"`
- Ensure all dependencies are installed: `npm ci`
- Clear cache: `rm -rf node_modules && npm ci && npm run build`

---

## CI/CD Integration

These checks mirror the GitHub Actions workflows:
- `.github/workflows/test_frontend.yaml` - Frontend checks
- `.github/workflows/test_backend.yaml` - Backend checks

Run locally to catch issues before pushing to GitHub!
