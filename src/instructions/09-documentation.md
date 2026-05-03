# Documentation Review

## Overview
If a CL changes how users build, test, interact with, or release code, it should also update associated documentation. Missing documentation should be requested.

## Key Points to Check

- **Scope of Changes**: Does the CL affect user-facing behavior?
- **Documentation Updates**: Are all affected documentation updated?
- **Deprecations**: Is deprecated code properly documented?
- **New Features**: Is new functionality documented?

## Documentation Types to Check

1. **README Files**: Project setup, overview, and basic usage
2. **API Documentation**: Function signatures, parameters, return values
3. **Architecture Documentation**: System design and component interactions
4. **User Guides**: How to use features or the system
5. **Installation Guides**: Setup and deployment instructions
6. **Configuration Documentation**: Available options and defaults
7. **Troubleshooting Guides**: Common issues and solutions
8. **Migration Guides**: How to upgrade from older versions
9. **Generated Reference Docs**: Auto-generated API reference

## What to Look For

1. **Building/Testing Changes**:
   - Updated build instructions
   - New build requirements noted
   - Updated test running procedures

2. **User-Facing Changes**:
   - UI changes documented
   - New user features explained
   - Workflow changes clarified

3. **API Changes**:
   - Function/method documentation updated
   - Parameter changes documented
   - Return value changes noted
   - Breaking changes clearly marked

4. **Release/Deployment Changes**:
   - Release procedures updated
   - Deployment changes documented
   - New environment variables or configs listed

5. **Code Deletion/Deprecation**:
   - Deprecation notices added
   - Migration path documented
   - Old documentation removed or archived

## Red Flags

- No documentation update for user-facing changes
- Incomplete documentation of new features
- Missing deprecation notices
- Outdated or contradictory documentation
- Broken links in documentation
- Unclear examples or instructions

## Best Practices

- Keep documentation close to code
- Use code examples to illustrate features
- Make documentation easy to find and search
- Maintain documentation as code (in version control)
- Update documentation in same CL as code changes
- Review documentation for clarity and accuracy

## Documentation Quality Criteria

1. **Completeness**: Are all necessary topics covered?
2. **Accuracy**: Does documentation match actual behavior?
3. **Clarity**: Can readers understand without domain expertise?
4. **Currency**: Is documentation up to date?
5. **Accessibility**: Is documentation easy to find?

## Questions to Ask

- Are users told how to use this feature?
- Is this a breaking change that needs migration guide?
- Are configuration options documented?
- Is the documentation clear enough for new users?
- Have we removed documentation for removed features?
