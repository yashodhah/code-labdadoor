# Context Review

## Overview

Understand the CL in a broad context - both within the file and within the larger system. This helps catch design issues and architectural problems that might not be apparent from the diff alone.

## Key Points to Check

- **File Context**: Look at the whole file, not just changed lines
- **System Context**: Understand how this fits into the larger system
- **Code Health**: Is this improving or degrading overall system health?
- **Architectural Impact**: Does this change fit the system's architecture?

## File-Level Context

### What to Review

1. **Entire File**: Look at the full file when you see a small change
   - Change might be in a 50-line method that needs refactoring
   - Related code might have style or pattern inconsistencies
   - New code might duplicate existing logic

2. **Related Methods/Classes**: Check for duplication
   - Is similar functionality implemented elsewhere?
   - Could this code be consolidated?
   - Are there shared utilities that should be used?

3. **File Organization**: Is code logically organized?
   - Related functionality grouped together?
   - Methods in logical order?
   - Clear separation of concerns?

## System-Level Context

### What to Look For

1. **System Health**: Does this CL improve or degrade it?
   - Reduces complexity or adds it?
   - Improves testability or makes it harder?
   - Increases or decreases coupling?

2. **Code Health**: Will future developers struggle with this?
   - Is there sufficient test coverage?
   - Is code easy to understand and modify?
   - Are there technical debt markers?

3. **Architectural Fit**: Does this align with system design?
   - Follows established patterns?
   - Respects layer boundaries?
   - Appropriate use of components?

4. **Consistency**: How does this fit with surrounding code?
   - Similar problems solved similarly?
   - Naming and style consistent?
   - Appropriate abstraction level?

## Red Flags for Context Issues

- Small change hiding larger refactoring need
- Code duplication elsewhere in system
- Architectural misalignment
- Degrading system health for convenience
- Breaking established patterns
- Increasing technical debt

## System Health Considerations

### Code Health Improves When

- Tests are added
- Complexity is reduced
- Documentation is improved
- Deprecated code is removed
- Inconsistencies are fixed

### Code Health Degrades When

- Tests are missing
- Complexity increases
- Code becomes harder to understand
- Duplication is introduced
- Technical debt accumulates

## Best Practices

1. **Always Look at the Whole File**:
   - Don't just review diff context
   - Understand the full scope
   - Look for bigger refactoring opportunities

2. **Consider System Implications**:
   - How does this affect other components?
   - Are there cascading effects?
   - Will this create new problems?

3. **Maintain Code Health**:
   - Don't accept changes that degrade health
   - Many small changes accumulate into big problems
   - Prevention is easier than cleanup

4. **Follow Established Patterns**:
   - Be consistent with existing code
   - Don't introduce new patterns without reason
   - Help the system evolve coherently

## Asking for Context Changes

When you see issues:

1. **Request refactoring**: "This method is too long, could it be split?"
2. **Request consolidation**: "Similar logic exists in XYZ, could these be merged?"
3. **Request cleanup**: "This seems disconnected from the rest of the file"
4. **Request documentation**: "Help me understand how this fits the system"

## Questions to Ask

- What's the context of the whole file?
- Is there similar code elsewhere?
- Does this follow established patterns?
- Does this improve or hurt system health?
- Could this change trigger other necessary changes?
- Will developers in 6 months understand why this is here?
