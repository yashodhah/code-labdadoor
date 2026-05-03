---
name: copilot-sdk
description: Use when building or modifying review/src/agents/ using @github/copilot-sdk, or migrating from @opencode-ai/sdk, or asking how to run parallel agent sessions, get structured JSON output, configure custom OpenAI providers, use hooks, MCP servers, custom agents/skills, session persistence, observability, or troubleshoot SDK issues.
---

# @github/copilot-sdk — Documentation Index

> Public preview. `npm install @github/copilot-sdk`. Requires Node.js ≥ 18 and GitHub Copilot CLI in PATH (or `COPILOT_CLI_PATH` env var).
> Official docs root: https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk

---

## Getting Started

**[Getting started with Copilot SDK](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/sdk-getting-started)**
Install the SDK, send your first message, and add streaming. Covers `CopilotClient`, `createSession({ model })`, `sendAndWait({ prompt })`, and streaming via `assistant.message_delta` / `session.idle` events. Auth via Copilot CLI.

---

## Set Up (Deployment & Configuration)

**[Set up Copilot SDK — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk)**
Index of all setup guides. Start here to pick the right path.

- **[Choosing a setup path](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/choosing-a-setup-path)** — Find the right setup guide that matches how you plan to use Copilot SDK (local dev, backend service, bundled CLI, OAuth, Azure).

- **[Local CLI](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/local-cli)** — Use the CLI already signed in on your machine—the simplest configuration, with no auth code or infrastructure required.

- **[GitHub OAuth](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/github-oauth)** — Let users authenticate with their GitHub accounts to use GitHub Copilot through your application.

- **[Bundled CLI](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/bundled-cli)** — Package Copilot CLI alongside your application so that users do not need to install or configure anything separately.

- **[Backend services](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/backend-services)** — Run GitHub Copilot SDK in server-side applications such as APIs, web backends, microservices, and background workers.

- **[Azure Managed Identity](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/azure-managed-identity)** — Use Azure Managed Identity (Entra ID) to authenticate with Azure AI Foundry models instead of static API keys.

- **[Scaling deployments](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/scaling)** — Design your deployment to serve multiple users, handle concurrent sessions, and scale horizontally across infrastructure.

---

## Authentication

**[Authenticating with Copilot SDK — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/authenticate-copilot-sdk)**
Index of authentication options.

- **[Authenticating with Copilot SDK](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/authenticate-copilot-sdk/authenticate-copilot-sdk)** — Choose the authentication method that best fits your deployment scenario (local, OAuth, service account, BYOK).

- **[Bring your own key (BYOK)](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/authenticate-copilot-sdk/bring-your-own-key)** — Use your own API keys from different model providers (OpenAI, Azure OpenAI, etc.), bypassing GitHub Copilot authentication entirely. Set `provider: { type, baseUrl, apiKey }` in `createSession`.

---

## Using the SDK (Capabilities)

**[Use Copilot SDK — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk)**
Index of all capability guides.

- **[Custom agents & sub-agent orchestration](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/custom-agents)** — Define specialized agents with scoped tools and prompts; let Copilot orchestrate them as sub-agents within a single session. Use for multi-agent workflows.

- **[Working with hooks](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/working-with-hooks)** — Use hooks to customize the behavior of your Copilot SDK sessions at lifecycle points (pre/post tool use, prompt submitted, session start/end, errors).

- **[Image input](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/image-input)** — Send images to Copilot SDK sessions as file or blob attachments.

- **[MCP servers](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/mcp-servers)** — Integrate MCP (Model Context Protocol) servers with the Copilot SDK to extend your application's capabilities with external tools.

- **[Session persistence](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/session-persistence)** — Pause, resume, and manage Copilot SDK sessions across restarts and deployments.

- **[Custom skills](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/custom-skills)** — Use skills to extend Copilot's capabilities with reusable prompt modules; attach skills to sessions.

- **[Steering and queueing messages](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/steering-and-queueing)** — Send messages to an active Copilot SDK session to redirect it mid-turn or queue follow-up tasks.

- **[Streaming events reference](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-copilot-sdk/streaming-events)** — Full reference of all session events emitted by the SDK and the data fields each contains (e.g. `assistant.message_delta`, `session.idle`, tool events).

---

## Hooks (Conversation Lifecycle)

**[Use hooks — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks)**
Hooks let you intercept and customize session behavior at key points.

- **[Hooks quickstart](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks/quickstart)** — Get started with hooks to control tool execution, transform results, add context, handle errors, and audit interactions.

- **[`onPreToolUse`](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks/pre-tool-use)** — Use to control tool execution, modify arguments, and add context before a tool runs.

- **[`onPostToolUse`](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks/post-tool-use)** — Use to transform tool results, log tool execution, and add context after a tool runs.

- **[`onUserPromptSubmitted`](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks/user-prompt-submitted)** — Use to modify prompts, add context, and filter user input when a prompt is submitted.

- **[`onSessionStart` / `onSessionEnd`](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks/session-lifecycle)** — Use to initialize context and resources at session start; clean up and track metrics at session end.

- **[`onErrorOccurred`](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/use-hooks/error-handling)** — Implement custom error logging, track error patterns, and provide user-friendly error messages.

---

## Observability

**[Observability for Copilot SDK — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/observability)**

- **[OpenTelemetry instrumentation](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/observability/opentelemetry)** — Add distributed tracing to your Copilot SDK applications using OpenTelemetry.

---

## Integrations

**[Copilot SDK integrations — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/integrations)**

- **[Microsoft Agent Framework](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/integrations/microsoft-agent-framework)** — Use Copilot SDK as an agent provider inside Microsoft Agent Framework to build and orchestrate multi-agent workflows alongside other AI providers.

---

## Troubleshooting

**[Troubleshooting Copilot SDK — index](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/troubleshooting)**

- **[SDK and CLI compatibility](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/troubleshooting/sdk-and-cli-compatibility)** — Compare which Copilot CLI features are available through the SDK, identify CLI-only features, and find programmatic workarounds.

- **[Debugging Copilot SDK](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/troubleshooting/debug-copilot-sdk)** — Enable debug logging and resolve common connection, authentication, and tool execution issues.

- **[Debugging MCP servers](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-sdk/troubleshooting/debug-mcp-servers)** — Diagnose and fix issues with MCP servers, including server startup failures, tool discovery problems, and protocol errors.

---

## This Project's Quick-Reference Patterns

> Code patterns used in `src/reviewer/` for this project. See docs above for full API reference.

### Core Lifecycle

```typescript
import { CopilotClient, approveAll } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();

// One client hosts all sessions — createSession() can be called multiple times
const session = await client.createSession({
    model: "gpt-4o",
    onPermissionRequest: approveAll,   // required on every createSession
    provider: {
        type: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY,
    },
    systemMessage: { content: AGENT_SYSTEM_PROMPT },
});

const result = await session.sendAndWait({ prompt: userMessage });
const text = result?.data.content ?? "";

await session.disconnect();
await client.stop();
```

### Structured JSON Output

No native `format: { type: 'json_schema' }` — enforce via system prompt:

```typescript
const systemPrompt = `${SECURITY_PROMPT}

Respond ONLY with a valid JSON array matching this schema — no markdown, no explanation:
${JSON.stringify(findingSchema, null, 2)}`;

const raw = result?.data.content ?? "";
const json = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
const findings = JSON.parse(json) as Finding[];
```

### Parallel Sessions

```typescript
const [secRaw, qualRaw] = await Promise.all([
    runAgentSession(client, SECURITY_PROMPT, diff, findingSchema),
    runAgentSession(client, QUALITY_PROMPT, diff, findingSchema),
]);
```

### BYOK / Custom Provider

```typescript
provider: { type: "openai", baseUrl: "https://api.openai.com/v1", apiKey: process.env.OPENAI_API_KEY }
// model is REQUIRED when using a custom provider
// For Azure: type: "azure", baseUrl = host only (no /openai/v1)
```

### Timeout Pattern

`sendAndWait` accepts an optional timeout in ms:

```typescript
const result = await session.sendAndWait({ prompt }, 5 * 60 * 1000); // 5 min
```

Or wrap at a higher level:

```typescript
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
}
```

## Migration from @opencode-ai/sdk

| @opencode-ai/sdk | @github/copilot-sdk |
|---|---|
| `createOpencode({ config: { model } })` | `new CopilotClient(); await client.start()` |
| `client.session.create()` | `await client.createSession({ model, onPermissionRequest, provider })` |
| `client.session.prompt({ id, prompt, format })` | `await session.sendAndWait({ prompt })` |
| `pollUntilIdle(client, sessionId)` | built into `sendAndWait` |
| `server.close()` | `await client.stop()` (or `client.forceStop()` for forced) |
| `format: { type: 'json_schema', schema }` | enforce JSON in system prompt + `JSON.parse` |

## Full Agent Session Helper

```typescript
async function runAgentSession(
    client: CopilotClient,
    systemPrompt: string,
    userMessage: string,
    schema: object
): Promise<string> {
    const prompt = `${systemPrompt}

Respond ONLY with valid JSON matching this schema — no markdown fences:
${JSON.stringify(schema, null, 2)}`;

    const session = await client.createSession({
        model: "gpt-4o",
        onPermissionRequest: approveAll,
        provider: {
            type: "openai",
            baseUrl: "https://api.openai.com/v1",
            apiKey: process.env.OPENAI_API_KEY,
        },
        systemMessage: { content: prompt },
    });

    try {
        const result = await session.sendAndWait({ prompt: userMessage }, 5 * 60 * 1000);
        const raw = result?.data.content ?? "";
        return raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    } finally {
        await session.disconnect();
    }
}
```

## Cleanup: stop() vs forceStop()

`client.stop()` is a graceful shutdown — returns `Promise<Error[]>` (errors from the shutdown process, not thrown). Use it in `finally` blocks:

```typescript
} finally {
    const errors = await client.stop();
    if (errors.length) console.error("shutdown errors:", errors);
}
```

`client.forceStop()` kills the CLI process immediately without cleanup — use only when `stop()` hangs or as a fallback in a catch.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Missing `onPermissionRequest` | Always required — use `approveAll` |
| Custom provider without `model` | `model` is required with `provider` |
| Expecting JSON without schema in system prompt | No native structured output — must instruct via prompt |
| Calling `server.close()` (opencode pattern) | Use `await client.stop()` |
| Creating a new `CopilotClient` per session | Create once, call `createSession` multiple times |
| `try { await client.stop() } catch` — wrapping stop() in try/catch | `stop()` returns errors in an array, it doesn't throw |
