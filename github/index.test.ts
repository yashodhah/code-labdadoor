import { describe, test, expect } from "bun:test";
import { isLabdadoorCommand, toGitHubEvent, formatReviewBody } from "./index";

describe("isLabdadoorCommand", () => {
  test("matches /labdadoor at start", () =>
    expect(isLabdadoorCommand("/labdadoor please review")).toBe(true));
  test("matches /lb shorthand", () => expect(isLabdadoorCommand("/lb")).toBe(true));
  test("matches /lb mid-sentence", () =>
    expect(isLabdadoorCommand("hey /lb can you check?")).toBe(true));
  test("rejects /labdadoorx", () => expect(isLabdadoorCommand("/labdadoorx")).toBe(false));
  test("rejects unrelated comment", () =>
    expect(isLabdadoorCommand("looks good to me")).toBe(false));
});

describe("toGitHubEvent", () => {
  test("approve  -> APPROVE", () => expect(toGitHubEvent("approve")).toBe("APPROVE"));
  test("comment  -> COMMENT", () => expect(toGitHubEvent("comment")).toBe("COMMENT"));
  test("unapprove-> COMMENT", () => expect(toGitHubEvent("unapprove")).toBe("COMMENT"));
  test("block    -> REQUEST_CHANGES", () => expect(toGitHubEvent("block")).toBe("REQUEST_CHANGES"));
});

describe("formatReviewBody", () => {
  test("includes decision label and summary", () => {
    const body = formatReviewBody({ decision: "approve", summary: "All good.", findings: [] });
    expect(body).toContain("**Decision: APPROVED**");
    expect(body).toContain("All good.");
  });
  test("includes findings table when present", () => {
    const body = formatReviewBody({
      decision: "block",
      summary: "Issues found.",
      findings: [
        {
          id: "1",
          severity: "critical",
          category: "security",
          file: "src/auth.ts",
          line_start: 10,
          line_end: 12,
          title: "SQL injection",
          description: "Unsanitized input.",
          suggestion: "Use parameterized queries.",
        },
      ],
    });
    expect(body).toContain("### Findings");
    expect(body).toContain("src/auth.ts:10");
    expect(body).toContain("SQL injection");
  });
  test("no findings table when empty", () => {
    const body = formatReviewBody({ decision: "comment", summary: "Minor notes.", findings: [] });
    expect(body).not.toContain("### Findings");
  });
});
