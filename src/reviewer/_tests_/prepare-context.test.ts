import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as nodefs from 'node:fs';
import * as nodepath from 'node:path';
import * as nodeos from 'node:os';

import { getContextDir, parseDiffIntoFiles } from '../orchestrator';

// ─── Task 1: getContextDir ────────────────────────────────────────────────────

describe('getContextDir', () => {
  let savedRunnerTemp: string | undefined;
  let savedRunId: string | undefined;

  beforeEach(() => {
    savedRunnerTemp = process.env.RUNNER_TEMP;
    savedRunId      = process.env.GITHUB_RUN_ID;
  });

  afterEach(() => {
    if (savedRunnerTemp === undefined) delete process.env.RUNNER_TEMP;
    else process.env.RUNNER_TEMP = savedRunnerTemp;
    if (savedRunId === undefined) delete process.env.GITHUB_RUN_ID;
    else process.env.GITHUB_RUN_ID = savedRunId;
  });

  it('returns a string path', () => {
    expect(typeof getContextDir()).toBe('string');
  });

  it('uses RUNNER_TEMP when set', () => {
    process.env.RUNNER_TEMP  = '/custom/tmp';
    process.env.GITHUB_RUN_ID = '42';
    expect(getContextDir()).toBe('/custom/tmp/labdadoor/42');
  });

  it('falls back to os.tmpdir() when RUNNER_TEMP is not set', () => {
    delete process.env.RUNNER_TEMP;
    process.env.GITHUB_RUN_ID = 'local-test';
    const result = getContextDir();
    expect(result).toContain(nodeos.tmpdir());
    expect(result).toContain('labdadoor');
  });
});

// ─── Task 2: parseDiffIntoFiles ───────────────────────────────────────────────

describe('parseDiffIntoFiles', () => {
  it('returns empty array for empty diff', () => {
    expect(parseDiffIntoFiles('')).toEqual([]);
  });

  it('returns empty array when no file sections exist', () => {
    expect(parseDiffIntoFiles('PR #1: Title\nBase: abc → Head: def')).toEqual([]);
  });

  it('parses a single file', () => {
    const diff = 'PR #1: Title\n\n--- src/foo.ts (modified) ---\n@@ -1,2 +1,3 @@\n line1\n+line2\n line3';
    const result = parseDiffIntoFiles(diff);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('src/foo.ts');
    expect(result[0].status).toBe('modified');
    expect(result[0].patch).toContain('@@ -1,2 +1,3 @@');
  });

  it('parses multiple files', () => {
    const diff = [
      'PR #2: Title',
      '',
      '--- src/a.ts (added) ---',
      '@@ -0,0 +1,2 @@',
      '+line1',
      '+line2',
      '',
      '--- src/b.ts (removed) ---',
      '@@ -1,3 +0,0 @@',
      '-old line',
    ].join('\n');
    const result = parseDiffIntoFiles(diff);
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('src/a.ts');
    expect(result[1].filename).toBe('src/b.ts');
    expect(result[1].status).toBe('removed');
  });

  it('does not confuse unified diff --- headers with file separators', () => {
    // Real diff: the separator ends with " ---" which unified diff headers never do
    const diff = [
      'PR header',
      '--- src/foo.ts (modified) ---',
      '--- a/src/foo.ts',
      '+++ b/src/foo.ts',
      '@@ -1 +1 @@',
      '-old',
      '+new',
    ].join('\n');
    const result = parseDiffIntoFiles(diff);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('src/foo.ts');
  });

  it('extracts patch content between boundaries', () => {
    const diff = [
      'PR #3: Title',
      '',
      '--- auth/login.ts (added) ---',
      '@@ -0,0 +1,3 @@',
      '+export function login() {}',
      '',
      '--- src/index.ts (modified) ---',
      '@@ -1 +1,2 @@',
      ' existing',
      '+new line',
    ].join('\n');
    const result = parseDiffIntoFiles(diff);
    expect(result[0].patch).toContain('login');
    expect(result[0].patch).not.toContain('existing');
    expect(result[1].patch).toContain('existing');
    expect(result[1].patch).not.toContain('login');
  });
});
