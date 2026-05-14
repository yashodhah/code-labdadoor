# Comments Review

## Overview

Comments should explain **why** code exists, not **what** it does. If code isn't clear enough to explain itself, the code should be simplified instead.

## Key Points to Check

- **Necessity**: Is each comment actually needed?
- **Purpose**: Does the comment explain why, not what?
- **Clarity**: Is the comment written in clear, understandable English?
- **Accuracy**: Does the comment match the code it describes?

## When Comments Are Useful

1. **Design Decisions**: Why was this approach chosen?
2. **Non-Obvious Logic**: Complex algorithms or regular expressions
3. **Workarounds**: Why is this hack necessary?
4. **External Context**: Links to issues, specifications, or documentation
5. **Future Maintenance**: Known limitations or things to watch for

## What to Look For

1. **Over-Documentation**: Redundant comments that repeat the code
   - Bad: `x = x + 1;  // increment x`
   - Good: `currentRetries++;  // retry until max attempts reached`

2. **Code Clarity**: If the code is unclear, improve the code not the comment
   - Instead of: `// Check if buffer size exceeds limit`
   - Write: `if (buffer.size() > MAX_BUFFER_SIZE)`

3. **TODO Comments**: Can they be removed or addressed now?

4. **Outdated Comments**: Do they match current behavior?

5. **License/Copyright**: Are headers up to date?

## Documentation vs Comments

- **Comments**: Explain why code exists, reasoning behind decisions
- **Documentation**: Purpose, usage, and behavior of classes/functions/modules
- **Docstrings**: Should be kept separate and more formal

## Red Flags

- Comments that contradict the code
- Commented-out code without explanation
- Comments that repeat obvious code
- Spelling errors or grammatical issues in comments
- Comments that are more confusing than helpful

## Best Practices

- Write code that documents itself through clarity
- Use meaningful variable and function names
- Add comments for non-obvious behavior
- Keep comments close to the code they describe
- Update comments when code changes

## Questions to Ask

- Why does this code exist, not what does it do?
- Is this comment necessary given the code's clarity?
- Would someone understand this in 6 months without this comment?
- Is this comment accurate?
- Should I improve the code to reduce comment need?
