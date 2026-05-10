# Consistency Review

## Overview
Code should follow established patterns and conventions. When style guides have recommendations (not requirements), judge whether to follow recommendations or existing code patterns.

## Key Points to Check

- **Guide Authority**: Style guide requirements are absolute
- **Recommendations**: For recommendations, consider consistency with local code
- **Bias**: Prefer following style guide unless local inconsistency would be confusing
- **Cleanup**: Encourage addressing existing inconsistencies through separate CLs

## Consistency Hierarchy

1. **Style Guide Requirements** (Absolute): Must be followed in new code
2. **Style Guide Recommendations**: Consider local consistency, prefer guide unless confusing
3. **Existing Code Patterns**: Follow when no other rule applies
4. **Team Conventions**: Maintain consistency with team practices

## What to Look For

1. **Following Established Patterns**:
   - Are error handling patterns consistent?
   - Are naming conventions consistent?
   - Is code organization consistent?

2. **Integration with Existing Code**:
   - Does new code follow existing patterns in the file?
   - Are similar features implemented similarly?
   - Is the new approach a better pattern worth generalizing?

3. **Style Guide Adherence**:
   - Are guide requirements met?
   - If guide recommends approach X but code uses Y, is Y clearly inferior?

## Red Flags

- Code that violates style guide requirements
- Introducing new patterns without good reason
- Breaking existing conventions unnecessarily
- Inconsistent approach for similar problems
- Code that doesn't fit the established architecture

## Decision Framework

When encountering inconsistency:

1. **Is it a guide requirement?** → Must follow guide
2. **Is it a guide recommendation?** → Consider: which is less confusing?
3. **Is there established local pattern?** → Follow local pattern unless clearly inferior
4. **No existing rule applies?** → Maintain consistency with existing code

## Best Practices

- Accept that some inconsistency may exist
- Clean up inconsistencies in separate CLs
- Encourage consistency improvements over time
- Use automated tools to enforce consistency
- Document team conventions clearly

## Addressing Inconsistency

- Suggest following the style guide when it's a requirement
- Ask developer to follow local pattern if that's clearer
- Encourage filing bugs for future cleanup
- Don't block CLs on optional style recommendations
- Be pragmatic about what's truly confusing

## Questions to Ask

- Does this follow the style guide requirement?
- Is this consistent with existing code?
- Would following the guide be clearer here?
- Is the inconsistency actually confusing?
- Should this be a separate cleanup CL?
