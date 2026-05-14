# Naming Review

## Overview

Good names are crucial for code readability and maintainability. Names should fully communicate what something is or does without being unnecessarily long.

## Key Points to Check

- **Clarity**: Does the name clearly indicate what this item is or does?
- **Completeness**: Is the name long enough to be unambiguous?
- **Brevity**: Is the name as short as possible while remaining clear?
- **Consistency**: Does the name follow project conventions?

## Naming Best Practices

1. **Variables**: Use descriptive names that indicate what data they hold
   - Good: `userAccountBalance`, `isValidEmail`
   - Bad: `x`, `data`, `temp`

2. **Functions**: Use verb-noun combinations that describe what the function does
   - Good: `calculateTotalPrice()`, `validateUserInput()`
   - Bad: `doStuff()`, `process()`

3. **Classes**: Use nouns that describe the concept being modeled
   - Good: `UserRepository`, `PaymentProcessor`
   - Bad: `MyClass`, `Handler`

4. **Constants**: Use UPPER_SNAKE_CASE and make their purpose clear
   - Good: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_MS`
   - Bad: `MAX_VAL`, `NUM`

5. **Booleans**: Use prefixes like `is`, `has`, `should`, `can`
   - Good: `isActive`, `hasPermission`, `shouldRetry`
   - Bad: `active`, `permission`, `retry`

## What to Look For

1. **Pronounceability**: Can names be read out loud?
2. **Searchability**: Are names unique enough to search for?
3. **Abstraction Level**: Do names match the abstraction they represent?
4. **Language**: Are names in consistent language (avoid mixing languages)?
5. **Domain Alignment**: Do names use domain-specific terminology appropriately?

## Red Flags

- Single letter variable names (except loop counters)
- Ambiguous abbreviations
- Names that don't describe purpose
- Inconsistent naming styles in same codebase
- Names that are too generic or too specific

## Questions to Ask

- What does this name describe?
- Is the name searchable in the codebase?
- Would a new developer understand this name?
- Could this name be shortened without losing clarity?
- Does this name follow project conventions?
