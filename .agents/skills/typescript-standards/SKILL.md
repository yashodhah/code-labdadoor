---
name: typescript-standards
description: "Apply when writing or reviewing TypeScript — enforces TCP TypeScript standards."
---

# The Cloud Plumbing Co — TypeScript Standards

These are **what NOT to do** rules. Each rule exists because the antipattern causes real bugs or obscures real errors. Enforce them when writing new TypeScript and flag them during code review.

---

## TCP-TS-001 — No `any` Type

**Rule:** Do not use `any`. Use `unknown` and narrow with type guards, or model the type properly.

**Why:** `any` silently disables the type checker, turning TypeScript into JavaScript with extra steps.

```typescript
// ❌ Bad
function parse(input: any) {
  return input.value;
}

// ✅ Good
function parse(input: unknown) {
  if (typeof input === "object" && input !== null && "value" in input) {
    return (input as { value: unknown }).value;
  }
  throw new Error("Invalid input shape");
}
```

---

## TCP-TS-002 — No Non-Null Assertion (`!`)

**Rule:** Do not use the non-null assertion operator `!`. Handle the null or undefined case explicitly.

**Why:** `!` is a promise to the compiler that you are making without proof — it defers the crash to runtime.

```typescript
// ❌ Bad
const name = user!.profile!.name;

// ✅ Good
if (!user?.profile?.name) {
  throw new Error("User profile name is required");
}
const name = user.profile.name;
```

---

## TCP-TS-003 — No `as` Casting Without a Preceding Type Guard

**Rule:** Do not use `as` to cast a type unless you have already narrowed the type with a type guard immediately above the cast.

**Why:** Casting without a guard is lying to the compiler — it produces a type-safe illusion over an unchecked assumption.

```typescript
// ❌ Bad
const config = JSON.parse(raw) as AppConfig;

// ✅ Good
function isAppConfig(value: unknown): value is AppConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "apiUrl" in value &&
    typeof (value as Record<string, unknown>).apiUrl === "string"
  );
}

const parsed = JSON.parse(raw);
if (!isAppConfig(parsed)) {
  throw new Error("Invalid config format");
}
const config = parsed as AppConfig; // guard has already run
```

---

## TCP-TS-004 — No Floating Promises

**Rule:** Every `Promise` must be `await`ed, explicitly discarded with `void`, or assigned to a variable and handled.

**Why:** Unhandled promises swallow errors silently and cause unpredictable execution order.

```typescript
// ❌ Bad
function setup() {
  loadConfig(); // promise floats, errors are lost
  initDatabase(); // same
}

// ✅ Good
async function setup() {
  await loadConfig();
  await initDatabase();
}

// ✅ Also acceptable for intentional fire-and-forget
void sendAnalyticsEvent("app_start");
```

---

## TCP-TS-005 — No `enum`

**Rule:** Do not use TypeScript `enum`. Use `const` objects with `as const` and derive the union type via `typeof`.

**Why:** `enum` compiles to runtime objects with surprising semantics, numeric reverse-mapping, and poor tree-shaking behaviour; `const` objects are transparent plain values.

```typescript
// ❌ Bad
enum Status {
  Active = "active",
  Inactive = "inactive",
}

// ✅ Good
const Status = {
  Active: "active",
  Inactive: "inactive",
} as const;

type Status = (typeof Status)[keyof typeof Status];
// type Status = 'active' | 'inactive'
```

---

## When This Skill Applies

Trigger this skill when:

- Writing any new `.ts` or `.tsx` file
- Reviewing TypeScript code (PRs, inline review, pair programming)
- Any task description mentions a `.ts` file or TypeScript module
- Refactoring existing TypeScript that may contain legacy antipatterns

Check each rule (TCP-TS-001 through TCP-TS-005) against the code in scope and flag or fix every violation found.
