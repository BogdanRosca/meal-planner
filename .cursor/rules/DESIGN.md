# Frontend design rules

> Purpose: enforce consistent, maintainable React patterns and a Tailwind-first styling approach.  
> Scope: applies to all new/modified frontend code in this repo.

---

## 1) Defaults (must follow)

### 1.1 Tech choices

- **React + TypeScript** for all UI code (no new JS files unless explicitly requested).
- Styling must be done using:
  - Component-scoped CSS files (ComponentName.module.css)
  - OR structured CSS using a clear methodology (BEM if not using modules)
  - Do **not** use Tailwind
  - Do **not** use CSS-in-JS (styled-components, emotion, etc.)
  - Do **not** use inline `style={{ ... }}` except for truly dynamic values (e.g., runtime-calculated dimensions)

### 1.2 Styling Architecture (Enforced)

- Each component must have its own CSS file:

```
Button.tsx
Button.module.css
```

This ensures:

- Encapsulation
- No global style leakage
- Predictable refactoring
- Better long-term scalability

### 1.3 CSS Modules (Preferred)

Use CSS Modules:

```tsx
import styles from "./Button.module.css";

export function Button({ children }: { children: React.ReactNode }) {
  return <button className={styles.button}>{children}</button>;
}
```

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background-color: var(--color-primary);
  color: white;
}

.button:hover {
  background-color: var(--color-primary-hover);
}
```

### 1.4 Naming Conventions

If CSS Modules are used:

- Class names should be semantic and readable.
- No utility-style class names (mt4, flexRow, etc.)
- If global CSS is required:
- Follow BEM methodology:

```css
.card {
}
.card__header {
}
.card__title {
}
.card--highlighted {
}
```

### 1.5 Design Tokens (Required)

All spacing, colors, and radius values must come from design tokens.
Use CSS variables in a global tokens.css:

```css
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --radius-md: 6px;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
}
```

Do not hard-code raw hex values or pixel values repeatedly.

### 1.6 No Global Styling (Except Foundations)

Allowed global files:
`reset.css`
`tokens.css`
`base.css` (typography, body defaults)

Do not put component styles in global CSS.

### 1.7 Component Rules

- Use function components only.
- Prefer composition over inheritance.
- Keep components small and single-responsibility.
- Prefer controlled components for form inputs.

### 1.8 Accessibility

- All interactive elements must be keyboard accessible.
- Use semantic HTML first (`button`, `a`, `label`, `fieldset`, etc.).
- Use `aria-*` only when necessary.
- Focus states must be visible (defined in CSS, not removed).

**Example:**

```css
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 2) Tailwind rules (enforced)

### 2.1 No bespoke CSS

- Do not create or modify `.css`, `.scss`, `.sass`, `.less` for component styling.
- If you must add CSS (rare), require explicit approval in the PR description with rationale.

### 2.2 Class management

- Prefer readable Tailwind class lists.
- When class composition is non-trivial, use a helper:
  - `clsx` or `classnames` for conditional classes
  - `tailwind-merge` for conflict resolution (e.g., `px-2` vs `px-4`)
- Do not build Tailwind class strings via fragile concatenation.

**Example**

```tsx
import clsx from "clsx";

// Category badge from RecipeCard component
export function CategoryBadge({ category }: { category: string }) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-md px-3 py-1 text-xs font-medium",
        category === "breakfast" && "bg-amber-100 text-amber-700",
        category === "lunch" && "bg-green-100 text-green-700",
        category === "dinner" && "bg-blue-100 text-blue-700",
        category === "snack" && "bg-purple-100 text-purple-700",
      )}
    >
      {category}
    </div>
  );
}
```

### 2.3 Design tokens via Tailwind theme

- Prefer Tailwind config tokens (colors, spacing, radius) over hard-coded arbitrary values.
- Use arbitrary values (`w-[372px]`) only when unavoidable and documented in a comment.

---

## 3) Architecture & design patterns

### 3.1 Separate “UI” from “logic”

- Prefer the **container/presenter** split when complexity grows:
  - Container: data fetching, state, orchestration
  - Presenter: pure UI props -> JSX
- Keep presentational components **pure** whenever possible.

### 3.2 Hooks rules

- Custom hooks must:
  - Start with `use*`
  - Have a single responsibility
  - Return stable shapes (prefer objects with named fields for extensibility)
- Do not call hooks conditionally.

### 3.3 State management

- Prefer local state (`useState`, `useReducer`) for local UI concerns.
- Lift state up only when needed.
- Avoid prop drilling by introducing composition or context **only** when justified.
- Don’t store derived state; derive it during render or via memoization.

### 3.4 Data fetching & side effects

- Side effects live in `useEffect` (or in the data layer), never during render.
- Abort/cancel in-flight requests when relevant.
- Always handle loading + empty + error states in UI.

---

## 4) TypeScript rules

### 4.1 Types over `any`

- No new `any`. If unavoidable, use `unknown` and narrow.
- Prefer discriminated unions for state machines.

### 4.2 Component props

- Export prop types when components are reused across modules.
- Prefer explicit prop types over `React.FC`.

### 4.3 Strictness

- No `as SomeType` casting unless you prove correctness (narrow first).
- Prefer runtime validation for external inputs (API, localStorage).

---

## 5) Code style & quality

### 5.1 Naming

- Components: `PascalCase`
- Hooks: `useSomething`
- Utilities: `camelCase`
- Files:
  - Components: `ComponentName.tsx`
  - Hooks: `use-something.ts`
  - Utilities: `something.ts`

### 5.2 Avoid premature optimization

- Use `useMemo`/`useCallback` only when:
  - there is a measurable render/perf issue, or
  - you pass functions/objects to memoized children and it matters.

### 5.3 Comments

- Prefer self-documenting code.
- Comments should explain “why”, not “what”.

---

## 6) Testing expectations

- Add/adjust tests for:
  - critical UI flows
  - business logic in hooks/utilities
  - edge cases (empty/error)
- Tests should assert user-visible behavior, not implementation details.

---

## 7) UI component guidelines (practical)

### 7.1 Buttons and links

- Use `<button type="button">` by default.
- Use `<a>` only for navigation; otherwise button.
- Disabled states must be visually and functionally correct.

### 7.2 Forms

- Every input must have a `<label>` (or `aria-label` as fallback).
- Show validation messages near the field.
- Use accessible error patterns: `aria-invalid`, `aria-describedby`.

---

## 8) PR / change discipline

- Each PR should keep scope small.
- No drive-by refactors unless necessary for the change.
- If a rule must be broken, document it in PR description:
  - what rule
  - why it’s necessary
  - follow-up plan (if any)

---

## 9) “Do not do” list (hard constraints)

- Do not add CSS-in-JS libraries.
- Do not add new component-level CSS/SCSS files.
- Do not use inline styles except truly dynamic values.
- Do not introduce `any` in new code.
- Do not ignore accessibility for custom components.

---

## 10) When unsure

Default to:

- semantic HTML
- Tailwind utility classes
- small composable components
- predictable types
- explicit loading/error UI
