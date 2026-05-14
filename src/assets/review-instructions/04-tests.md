# Tests Review

## Overview

Tests should be added with production code and be correct, sensible, and useful. Tests are code that must be maintained.

## Key Points to Check

- **Coverage**: Are appropriate tests included (unit, integration, end-to-end)?
- **Correctness**: Are the tests actually correct?
- **Usefulness**: Do tests validate important behavior?
- **Maintenance**: Are tests written to be maintained like production code?

## Test Quality Criteria

1. **Will tests fail when code breaks?**: Tests must actually validate behavior
2. **False Positives**: Can tests pass even when code is broken?
3. **Assertions**: Are each test's assertions simple and useful?
4. **Organization**: Are tests properly separated by concern?
5. **Clarity**: Is it clear what each test validates?

## What to Look For

1. **Appropriate Test Types**:
   - Unit tests for individual functions/components
   - Integration tests for component interactions
   - End-to-end tests for critical user workflows

2. **Test Independence**: Each test should be independent and runnable individually

3. **Edge Cases**: Are edge cases and error conditions tested?

4. **Maintainability**: Can the tests be understood and modified easily?

5. **Performance**: Do tests run in reasonable time?

6. **Coverage**: Is the coverage appropriate for the code's criticality?

## Red Flags

- Tests that pass regardless of code correctness
- Complex test setup or teardown
- Tests that depend on execution order
- Tests that don't test the actual production code
- Insufficient error case coverage
- Slow or flaky tests

## Best Practices

- Don't accept complexity in tests just because they're not production code
- Ensure tests are separate CLs if handling emergencies
- Mock external dependencies appropriately
- Use clear test names that describe what is being tested
- Keep test data simple and relevant

## Questions to Ask

- What does this test actually validate?
- Would this test fail if the code was broken?
- Is this testing the right behavior?
- Are there edge cases not covered?
- Would I understand this test in 6 months?
