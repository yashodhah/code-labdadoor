import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as nodefs from 'node:fs';
import * as nodepath from 'node:path';
import * as nodeos from 'node:os';

import { getContextDir } from '../orchestrator';

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
