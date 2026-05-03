import * as dotenv from 'dotenv';
import * as path from 'path';
import { Probot, run } from 'probot';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
import { runCodeReview } from '../reviewer/orchestrator';
import type { ReviewConfig } from '../configs/review-config';
import type { Decision } from '../reviewer/orchestrator';
import modelsConfig from '../configs/settings.json';

type GitHubReviewEvent = 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';

function toGitHubEvent(decision: Decision): GitHubReviewEvent {
  switch (decision) {
    case 'approve':   return 'APPROVE';
    case 'comment':   return 'COMMENT';
    case 'unapprove': return 'COMMENT';   // no UNAPPROVE event in GitHub API
    case 'block':     return 'REQUEST_CHANGES';
  }
}

function app(robot: Probot) {
  robot.on(
    ['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'],
    async (context) => {
      const pr    = context.payload.pull_request;
      const { owner, repo } = context.repo();

      context.log.info({ owner, repo, pr: pr.number }, 'PR event — starting review');

      // Extract installation access token for the core's GitHubVcsProvider
      const { token } = await (context.octokit.auth as Function)({ type: 'installation' }) as { token: string };

      const config: ReviewConfig = {
        vcs: {
          token,
          projectId:      `${owner}/${repo}`,
          mrIid:          pr.number,
          mrTitle:        pr.title,
          mrDescription:  pr.body ?? '',
          authorUsername: pr.user?.login ?? 'unknown',
          targetBranch:   pr.base.ref,
          sourceBranch:   pr.head.ref,
        },
        models: modelsConfig.models,
      };

      let result;
      try {
        result = await runCodeReview(config);
      } catch (err) {
        context.log.error(err as Error, 'runCodeReview failed');
        await context.octokit.rest.issues.createComment(context.issue({
          body: `**AI Reviewer error**: review pipeline failed.\n\n\`${String(err)}\``,
        }));
        return;
      }

      context.log.info({ decision: result.decision, findings: result.findings.length }, 'Review complete');

      const findingsRows = result.findings.map((f, i) =>
        `| ${i + 1} | ${f.severity} | \`${f.file}:${f.line_start}\` | ${f.title} |`
      );
      const findingsTable = findingsRows.length
        ? `\n\n### Findings\n| # | Severity | File | Title |\n|---|----------|------|-------|\n${findingsRows.join('\n')}`
        : '';

      const decisionLabel: Record<Decision, string> = {
        approve:   '**Decision: APPROVED**',
        comment:   '**Decision: COMMENT**',
        unapprove: '**Decision: UNAPPROVE** (flagging new concerns)',
        block:     '**Decision: CHANGES REQUESTED**',
      };

      await context.octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: pr.number,
        event:       toGitHubEvent(result.decision),
        body:        `${decisionLabel[result.decision]}\n\n${result.summary}${findingsTable}`,
      });
    }
  );
}

// Reads APP_ID, WEBHOOK_SECRET, PRIVATE_KEY_PATH, WEBHOOK_PROXY_URL from
// process.cwd()/.env (code-labdadoor/.env when running via npm run dev:github)
run(app);

export default app;
