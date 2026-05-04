import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as nodefs from 'node:fs';
import * as nodepath from 'node:path';
import * as nodeos from 'node:os';

import { getContextDir, parseDiffIntoFiles, writeSharedContext, writePatches, prepareContext } from '../orchestrator';
import { AGENT_REGISTRY } from '../agents';
import type { DiffContext } from '../../configs/review-config';

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

// ─── Task 3: writeSharedContext ───────────────────────────────────────────────

function makeTestDir(): { base: string; contextDir: string } {
  const base = nodefs.mkdtempSync(nodepath.join(nodeos.tmpdir(), 'lb-test-'));
  return { base, contextDir: nodepath.join(base, 'labdadoor', 'test-run') };
}

function setEnvToDir(base: string): void {
  process.env.RUNNER_TEMP   = base;
  process.env.GITHUB_RUN_ID = 'test-run';
}

describe('writeSharedContext', () => {
  let base: string;
  let contextDir: string;
  let savedRunnerTemp: string | undefined;
  let savedRunId: string | undefined;

  beforeEach(() => {
    savedRunnerTemp = process.env.RUNNER_TEMP;
    savedRunId      = process.env.GITHUB_RUN_ID;
    ({ base, contextDir } = makeTestDir());
    setEnvToDir(base);
    nodefs.mkdirSync(nodepath.join(contextDir, 'patches'), { recursive: true });
  });

  afterEach(() => {
    if (savedRunnerTemp === undefined) delete process.env.RUNNER_TEMP;
    else process.env.RUNNER_TEMP = savedRunnerTemp;
    if (savedRunId === undefined) delete process.env.GITHUB_RUN_ID;
    else process.env.GITHUB_RUN_ID = savedRunId;
    nodefs.rmSync(base, { recursive: true, force: true });
  });

  it('writes context.json inside CONTEXT_DIR', () => {
    const ctx = {
      pr: { number: 1, title: 'T', author: 'a', description: 'd' },
      stats: { additions: 10, deletions: 2, filesChanged: 1 },
      files: [{ filename: 'src/foo.ts', status: 'modified', patch: '+x' }],
    };
    const result = writeSharedContext(ctx);
    expect(result).toBe(nodepath.join(contextDir, 'context.json'));
    expect(nodefs.existsSync(result)).toBe(true);
  });

  it('serializes pr and stats fields correctly', () => {
    const ctx = {
      pr: { number: 42, title: 'Fix bug', author: 'alice', description: 'desc' },
      stats: { additions: 5, deletions: 3, filesChanged: 2 },
      files: [],
    };
    writeSharedContext(ctx);
    const written = JSON.parse(nodefs.readFileSync(nodepath.join(contextDir, 'context.json'), 'utf-8'));
    expect(written.pr.number).toBe(42);
    expect(written.pr.author).toBe('alice');
    expect(written.stats.additions).toBe(5);
    expect(written.stats.deletions).toBe(3);
  });

  it('includes absolute patchPath for each file with slashes replaced', () => {
    const ctx = {
      pr: { number: 1, title: 'T', author: 'a', description: '' },
      stats: { additions: 1, deletions: 0, filesChanged: 1 },
      files: [{ filename: 'src/a/b.ts', status: 'added', patch: '+x' }],
    };
    writeSharedContext(ctx);
    const written = JSON.parse(nodefs.readFileSync(nodepath.join(contextDir, 'context.json'), 'utf-8'));
    expect(written.files[0].patchPath).toContain('src__a__b.ts.diff');
    expect(nodepath.isAbsolute(written.files[0].patchPath)).toBe(true);
  });

  it('does not include raw patch content in context.json', () => {
    const ctx = {
      pr: { number: 1, title: 'T', author: 'a', description: '' },
      stats: { additions: 1, deletions: 0, filesChanged: 1 },
      files: [{ filename: 'src/foo.ts', status: 'modified', patch: 'SECRET_PATCH_CONTENT' }],
    };
    writeSharedContext(ctx);
    const raw = nodefs.readFileSync(nodepath.join(contextDir, 'context.json'), 'utf-8');
    expect(raw).not.toContain('SECRET_PATCH_CONTENT');
  });

  it('produces valid JSON', () => {
    const ctx = {
      pr: { number: 1, title: 'T', author: 'a', description: '' },
      stats: { additions: 0, deletions: 0, filesChanged: 0 },
      files: [],
    };
    writeSharedContext(ctx);
    expect(() => JSON.parse(nodefs.readFileSync(nodepath.join(contextDir, 'context.json'), 'utf-8'))).not.toThrow();
  });
});

// ─── Task 3: writePatches ─────────────────────────────────────────────────────

describe('writePatches', () => {
  let base: string;
  let contextDir: string;
  let savedRunnerTemp: string | undefined;
  let savedRunId: string | undefined;

  beforeEach(() => {
    savedRunnerTemp = process.env.RUNNER_TEMP;
    savedRunId      = process.env.GITHUB_RUN_ID;
    ({ base, contextDir } = makeTestDir());
    setEnvToDir(base);
    nodefs.mkdirSync(contextDir, { recursive: true });
  });

  afterEach(() => {
    if (savedRunnerTemp === undefined) delete process.env.RUNNER_TEMP;
    else process.env.RUNNER_TEMP = savedRunnerTemp;
    if (savedRunId === undefined) delete process.env.GITHUB_RUN_ID;
    else process.env.GITHUB_RUN_ID = savedRunId;
    nodefs.rmSync(base, { recursive: true, force: true });
  });

  it('creates the patches subdirectory', () => {
    writePatches([]);
    expect(nodefs.existsSync(nodepath.join(contextDir, 'patches'))).toBe(true);
  });

  it('writes one .diff file per file with patch content', () => {
    const files = [
      { filename: 'src/foo.ts', status: 'modified', patch: '@@ diff @@\n+x' },
      { filename: 'src/bar.ts', status: 'added',    patch: '@@ diff @@\n+y' },
    ];
    writePatches(files);
    expect(nodefs.existsSync(nodepath.join(contextDir, 'patches', 'src__foo.ts.diff'))).toBe(true);
    expect(nodefs.existsSync(nodepath.join(contextDir, 'patches', 'src__bar.ts.diff'))).toBe(true);
  });

  it('sanitizes forward slashes to double underscores', () => {
    writePatches([{ filename: 'a/b/c.ts', status: 'modified', patch: '+x' }]);
    expect(nodefs.existsSync(nodepath.join(contextDir, 'patches', 'a__b__c.ts.diff'))).toBe(true);
  });

  it('skips files with empty patch', () => {
    writePatches([{ filename: 'src/empty.ts', status: 'modified', patch: '' }]);
    expect(nodefs.existsSync(nodepath.join(contextDir, 'patches', 'src__empty.ts.diff'))).toBe(false);
  });

  it('returns a Map from filename to absolute patch path', () => {
    const files = [{ filename: 'src/foo.ts', status: 'modified', patch: '+x' }];
    const map = writePatches(files);
    expect(map.has('src/foo.ts')).toBe(true);
    expect(nodepath.isAbsolute(map.get('src/foo.ts')!)).toBe(true);
  });

  it('writes the patch content to disk', () => {
    writePatches([{ filename: 'src/foo.ts', status: 'modified', patch: '+actual content' }]);
    const content = nodefs.readFileSync(nodepath.join(contextDir, 'patches', 'src__foo.ts.diff'), 'utf-8');
    expect(content).toBe('+actual content');
  });
});

// ─── Task 4: prepareContext ───────────────────────────────────────────────────

describe('prepareContext', () => {
  let base: string;
  let savedRunnerTemp: string | undefined;
  let savedRunId: string | undefined;

  const sampleDiff = [
    'PR #5: Add auth',
    '',
    '--- src/index.ts (modified) ---',
    '@@ -1,2 +1,3 @@',
    ' import x',
    '+import y',
    '',
    '--- auth/login.ts (added) ---',
    '@@ -0,0 +1,5 @@',
    '+export function login() {}',
  ].join('\n');

  const sampleCtx: DiffContext = {
    prNumber: 5, title: 'Add auth', author: 'dev',
    description: '', files: [], additions: 6, deletions: 0,
  };

  beforeEach(() => {
    savedRunnerTemp = process.env.RUNNER_TEMP;
    savedRunId      = process.env.GITHUB_RUN_ID;
    base = nodefs.mkdtempSync(nodepath.join(nodeos.tmpdir(), 'lb-test-'));
    setEnvToDir(base);
  });

  afterEach(() => {
    if (savedRunnerTemp === undefined) delete process.env.RUNNER_TEMP;
    else process.env.RUNNER_TEMP = savedRunnerTemp;
    if (savedRunId === undefined) delete process.env.GITHUB_RUN_ID;
    else process.env.GITHUB_RUN_ID = savedRunId;
    nodefs.rmSync(base, { recursive: true, force: true });
  });

  it('returns one AgentScope per agent in AGENT_REGISTRY', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    expect(scopes).toHaveLength(AGENT_REGISTRY.length);
  });

  it('all AgentScopes share the same sharedContextPath', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    const paths = new Set(scopes.map(s => s.sharedContextPath));
    expect(paths.size).toBe(1);
  });

  it('sharedContextPath file exists on disk after call', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    expect(nodefs.existsSync(scopes[0].sharedContextPath)).toBe(true);
  });

  it('quality agent (always:true) receives all patch paths', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    const quality = scopes.find(s => s.agentName === 'quality')!;
    expect(quality.patchPaths).toHaveLength(2);
  });

  it('security agent receives only auth/* file paths', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    const security = scopes.find(s => s.agentName === 'security')!;
    expect(security.patchPaths).toHaveLength(1);
    expect(security.patchPaths[0]).toContain('auth__login.ts.diff');
  });

  it('each patchPath file exists on disk', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    const quality = scopes.find(s => s.agentName === 'quality')!;
    for (const p of quality.patchPaths) {
      expect(nodefs.existsSync(p)).toBe(true);
    }
  });

  it('context.json contains pr metadata', () => {
    const scopes = prepareContext(sampleDiff, sampleCtx);
    const ctxFile = JSON.parse(nodefs.readFileSync(scopes[0].sharedContextPath, 'utf-8'));
    expect(ctxFile.pr.number).toBe(5);
    expect(ctxFile.pr.title).toBe('Add auth');
    expect(ctxFile.pr.author).toBe('dev');
  });
});
