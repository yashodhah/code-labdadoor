# Code Review Guidelines - Summary

Based on Google's Engineering Practices guide for code reviewers.

## Review Checklist

In doing a code review, ensure that:

### Design

- [ ] The code is well-designed
- [ ] Interactions between components make sense
- [ ] Changes belong in the codebase (not in a library)
- [ ] Integration with rest of system is good
- [ ] Timing of addition is appropriate

### Functionality

- [ ] The code does what was intended
- [ ] The intended behavior is good for users
- [ ] Edge cases are handled
- [ ] No obvious bugs visible in code
- [ ] Parallel programming is safe (no race conditions/deadlocks)

### Complexity

- [ ] Code is not more complex than necessary
- [ ] Individual lines are understandable
- [ ] Functions have appropriate scope
- [ ] Classes aren't overly complicated
- [ ] No over-engineering for speculative future needs

### Tests

- [ ] Appropriate tests are included (unit/integration/e2e)
- [ ] Tests are correct and useful
- [ ] Tests will actually fail when code is broken
- [ ] Test coverage is appropriate
- [ ] Tests are well-designed and maintained

### Naming

- [ ] Good names for variables, functions, and classes
- [ ] Names are descriptive but not excessively long
- [ ] Naming conventions are consistent
- [ ] Names clearly communicate purpose

### Comments

- [ ] Comments explain **why**, not **what**
- [ ] All comments are necessary
- [ ] Comments are clear and in good English
- [ ] Documentation explains purpose and usage
- [ ] No outdated comments

### Style

- [ ] Code follows appropriate style guide
- [ ] Formatting is consistent
- [ ] Style changes are separated from functional changes
- [ ] Minor style notes are marked as "Nit:"

### Consistency

- [ ] Code follows established patterns
- [ ] Inconsistencies are justified or noted for cleanup
- [ ] Style guide requirements are met
- [ ] Consistent with rest of codebase

### Documentation

- [ ] User-facing changes are documented
- [ ] API changes are explained
- [ ] Deprecations are noted
- [ ] Build/test changes are documented
- [ ] README and guides are updated

### Every Line

- [ ] You understand every line of code
- [ ] Code is reviewed thoroughly
- [ ] Risky areas have careful review
- [ ] Specialists are involved for specialized areas
- [ ] You've asked for clarification when needed

### Context

- [ ] You reviewed the whole file, not just diff
- [ ] You understand system-level implications
- [ ] Code health is maintained or improved
- [ ] Architectural alignment is verified
- [ ] Related issues are identified

### Good Things

- [ ] You recognized and appreciated good work
- [ ] You provided constructive feedback
- [ ] Your tone was encouraging
- [ ] You balanced criticism with praise

## Section-by-Section Guides

Each section has detailed guidance available:

1. [Design Review](./01-design.md) - Overall architecture and design
2. [Functionality Review](./02-functionality.md) - Correctness and behavior
3. [Complexity Review](./03-complexity.md) - Simplicity and clarity
4. [Tests Review](./04-tests.md) - Test coverage and quality
5. [Naming Review](./05-naming.md) - Names and terminology
6. [Comments Review](./06-comments.md) - Documentation and explanation
7. [Style Review](./07-style.md) - Code style and formatting
8. [Consistency Review](./08-consistency.md) - Pattern alignment
9. [Documentation Review](./09-documentation.md) - User-facing docs
10. [Every Line Review](./10-every-line.md) - Thoroughness
11. [Context Review](./11-context.md) - System-level perspective
12. [Good Things Review](./12-good-things.md) - Positive feedback

## Key Principles

- **The Standard**: Always apply the standard of code review
- **Code Health**: Improve or maintain system code health
- **Balance**: Balance thoroughness with speed
- **Collaboration**: Work with developers, don't just criticize
- **Consistency**: Be consistent in applying standards
- **Clarity**: Make feedback clear and actionable

## Review Workflow

1. Check overall design and architecture
2. Review functionality and correctness
3. Look for unnecessary complexity
4. Verify test coverage and quality
5. Check naming and clarity
6. Review comments and documentation
7. Verify style guide compliance
8. Look at every line in context
9. Consider system-wide implications
10. Recognize good work and practices

## Remember

- Code reviews are collaborative
- Positive feedback is as important as critical feedback
- Help developers grow and improve
- Focus on code health and maintainability
- Speed and quality should both matter
- A great reviewer makes the codebase better
