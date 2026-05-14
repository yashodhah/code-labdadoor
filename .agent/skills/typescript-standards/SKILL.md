---
name: typescript-standards
description: Use when reviewing TypeScript/Bun code in this project — flags anti-patterns to raise and enforces test philosophy
---

# TypeScript & Bun Standards
## Type Safety

| ID | Rule |
|---|---|
| TS-001 | Do not use `any`. Flag unless a comment explains why it is unavoidable. |
| TS-002 | Do not use `as SomeType` to silence a type error. Fix the type definition instead. |
| TS-003 | Do not use `!` non-null assertion unless the invariant is immediately obvious from context. |
| TS-004 | Exported functions must have explicit return types. |
| TS-005 | Function parameters must not have implicit `any`. |

## Structure

| ID | Rule |
|---|---|
| TS-006 | Do not use `enum`. Use a `const` object + `typeof` union instead. |
| TS-007 | Do not use `namespace`. Use ES modules. |
| TS-008 | Do not use `require()` in `.ts` files. Use `import`. |
| TS-009 | Do not use a class as a container for static methods only. Use module-level exports or a plain object. |

## Bun

| ID | Rule |
|---|---|
| TS-010 | Do not import from `jest`. This project uses `bun:test`. |
| TS-011 | Be consistent with `node:` prefix usage within a file (note, not a block). |

## Tests

| ID | Rule |
|---|---|
| TS-020 | Do not test private fields or internal implementation details. |
| TS-021 | Do not mock private methods or internal state. Only mock injected dependencies. |
| TS-022 | Do not write duplicate tests that re-verify a contract already covered in the same file. |
| TS-023 | Do not flag missing edge cases or boundary condition tests. |
| TS-024 | Do not suggest "could also test X" improvements. |
| TS-025 | A test suite is sufficient when the public API contract is covered. Do not require more. |
