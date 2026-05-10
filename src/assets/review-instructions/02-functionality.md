# Functionality Review

## Overview
Does this CL do what the developer intended? Is what the developer intended good for the users of this code?

## Key Points to Check

- **Correctness**: Does the code do what it's supposed to do?
- **Edge Cases**: Are edge cases handled properly?
- **User Impact**: Is this good for end-users and developers who will use this code?
- **Concurrency**: Are there any race conditions or deadlock risks?

## What to Look For

1. **Behavior Validation**: Does the CL achieve its intended purpose?
2. **Edge Case Handling**: Are boundary conditions handled?
3. **Error Scenarios**: What happens when things go wrong?
4. **User Experience**: Will end-users be satisfied with this?
5. **Developer Experience**: Will future developers find this easy to use?
6. **Concurrency Issues**: Are there potential deadlocks or race conditions?

## Testing Strategies

- Request a demo for UI changes when code inspection is insufficient
- Carefully think through parallel programming scenarios
- Consider what happens with invalid inputs
- Test with realistic user workflows

## Red Flags

- Missing error handling
- Potential race conditions or deadlocks
- UI changes that don't match expected behavior
- Missing validation of inputs
- Assumptions about system state that may not hold

## Questions to Ask

- What happens when this fails?
- Are there any race conditions possible?
- Does this handle all user input correctly?
- Would you use this code in production?
- Are there any assumptions that might not always be true?
