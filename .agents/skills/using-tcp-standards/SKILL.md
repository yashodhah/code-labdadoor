---
name: using-tcp-standards
description: Use when starting any development task — scans files in scope and loads the correct TCP coding standards before any code is written.
---

# Using TCP Standards

## Overview

Before writing any code, identify which TCP standards skills apply to the files in scope and invoke them. One set of rules shapes writing (feedforward) and is cited by the review layer (feedback).

## Standards Map

| Files in scope                             | Invoke                               |
| ------------------------------------------ | ------------------------------------ |
| Any `.ts` or `.tsx` file                   | `tcp-standards:typescript-standards` |
| Routes, controllers, handlers, `api/` dirs | `tcp-standards:api-design-standards` |

## How to Apply

During **brainstorming** or **writing-plans**, before any implementation action:

1. Identify which files will be created or modified.
2. For each matching trigger above, invoke the standards skill via the Skill tool.
3. Apply the loaded rules throughout the implementation.

## Citing Violations

Always reference violations by rule code: `TCP-TS-003`, `TCP-API-002`. This is how the review layer traces findings back to the rule that was broken.

## Adding More Standards

When new standard skills are added to this plugin, add a row to the standards map above.
