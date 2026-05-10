# Every Line Review

## Overview
In the general case, review every line of code you've been assigned to review. Understand what all the code is doing, being more careful with some code than others based on risk and complexity.

## Key Points to Check

- **Complete Review**: Review every line (with exceptions for generated code and data files)
- **Understanding**: Make sure you understand what the code is doing
- **Risk Assessment**: Scrutinize risky code more carefully
- **Code Clarity**: Ask for clarification if code is hard to understand

## Review Depth Guidelines

### Review Thoroughly

- Core business logic
- Security-sensitive code
- Concurrency and synchronization
- Error handling and edge cases
- External API calls
- Database queries
- Authentication/authorization logic

### Can Scan More Lightly

- Data files
- Generated code
- Configuration files (but verify accuracy)
- Build files
- Documentation files

## What to Look For

1. **Comprehension**: Do you understand every line?
   - If not, ask for clarification
   - Don't skip hard-to-understand code

2. **Context**: Does the code make sense in its context?
   - Look at surrounding code
   - Check the whole function/class
   - Consider system-wide implications

3. **Correctness**: Is the code doing the right thing?
   - Verify logic
   - Check data flow
   - Validate assumptions

4. **Quality**: Does the code meet quality standards?
   - Appropriate error handling
   - Proper resource management
   - Good performance

## Exceptions to Full Review

### When You're One of Multiple Reviewers

- Note which parts you reviewed in a comment
- Example: "I reviewed the authentication logic and API changes"
- Ensure other parts are reviewed by qualified reviewers
- Use LGTM with comments when appropriate

### Specialized Review Areas

- **Security**: Require specialized security reviewer
- **Privacy**: Require privacy specialist if data handling changes
- **Concurrency**: Require expert review of parallel programming
- **Accessibility**: Require accessibility specialist for UI changes
- **Internationalization**: Require i18n expert for language/locale changes

## Red Flags for Skipping Review

- Pressure to approve code quickly
- Code you don't understand (ask for clarity instead)
- Assuming code is correct because author is experienced
- Skipping hard-to-read code

## Best Practices

1. **Ask for Clarity**: If code is too hard to understand, ask developer to clarify or simplify
2. **Verify Assumptions**: Don't assume code is correct without checking
3. **Delegate Specialty Areas**: Ensure specialists review specialized concerns
4. **Take Your Time**: Don't rush through difficult code
5. **Document Scope**: Note what parts of CL you reviewed

## When Code is Hard to Understand

1. **Ask developer for clarification**: Code should be clear to readers
2. **Request code simplification**: Complex code suggests it needs refactoring
3. **Get explanation**: Ask for code walk-through or detailed comments
4. **Consider broader review**: Involve others if it's genuinely complex

## Context Matters

- Review entire file, not just changed lines
- Consider how changes affect other components
- Look for code smells beyond the changed code
- Evaluate impact on overall system health

## Questions to Ask

- Do I understand every line of this code?
- If not, can I ask for clarification?
- Is there risky code that needs careful review?
- Are there specialists needed for this area?
- What's the context around this code?
