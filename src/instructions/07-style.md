# Style Review

## Overview
Code should follow the appropriate style guides for the project and language. Style reviews should not block submissions for personal preferences.

## Key Points to Check

- **Consistency**: Does code follow project style guides?
- **Standards**: Are there established style guides being followed?
- **Nitpicks**: Are minor style issues worth flagging?
- **Major Changes**: Are style changes separated from functional changes?

## Style Guide Principles

1. **Authority**: Style guides are the absolute authority for style requirements
2. **Recommendations**: Style guide recommendations should be followed unless local inconsistency is less confusing
3. **Separation**: Major style changes should be separate CLs from functional changes
4. **Nitpicks**: Mark non-mandatory style suggestions with "Nit:" prefix

## What to Look For

1. **Formatting**:
   - Indentation and whitespace
   - Line length limits
   - Bracket and brace placement
   - Trailing whitespace

2. **Naming Conventions**:
   - Variable naming style (camelCase, snake_case, etc.)
   - Class and function naming
   - Constant naming

3. **Code Structure**:
   - Method/function organization
   - Class organization
   - Import ordering
   - Visibility modifiers

4. **Language-Specific**:
   - Type annotations
   - Null handling patterns
   - Error handling style
   - Async/await patterns

## Red Flags

- Mixing style conventions in same file
- Large unrelated style changes with functional changes
- Reformatting existing code without addressing functionality
- Ignoring established project style guide
- Style that conflicts with language best practices

## Best Practices

- Refer developers to the style guide
- Use automated tools (linters, formatters) when possible
- Keep style reviews separate from functional review
- Don't block CLs on personal style preferences
- Be consistent with how style is enforced

## Handling Style Disagreements

- Default to the official style guide
- If no rule applies, maintain consistency with existing code
- Encourage filing bugs for cleaning up inconsistent code
- Use automation (tools) to enforce style consistently

## Questions to Ask

- Does this follow the project style guide?
- Is this a mandatory rule or a preference?
- Would an automated tool catch this?
- Should this be a separate style-only CL?
- Is the inconsistency creating confusion?
