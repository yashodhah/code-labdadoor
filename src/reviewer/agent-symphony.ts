import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { CopilotClient, approveAll } from '@github/copilot-sdk';
import type { ReviewConfig } from './review-config';
import { AGENT_REGISTRY } from './agent-registry';
import type { AgentScope, Category, Confidence, Severity, SpecialistFinding } from '../types';

const VALID_SEVERITIES: readonly Severity[] = ['critical', 'warning', 'suggestion'];
const VALID_CATEGORIES: readonly Category[] = ['security', 'quality', 'performance', 'docs', 'release'];
const VALID_CONFIDENCES: readonly Confidence[] = ['high', 'medium', 'low'];
const DEFAULT_ORCHESTRATOR_TIMEOUT_MS = 300_000;

// ─── XML Parsing ──────────────────────────────────────────────────────────────

function extractXmlTagContent(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(xml);
  return match ? match[1].trim() : '';
}

function toNumber(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseXmlFinding(findingXml: string, agentName: string, fallbackCategory: Category, index: number): SpecialistFinding | null {
  const severity = extractXmlTagContent(findingXml, 'severity') as Severity;
  const category = extractXmlTagContent(findingXml, 'category') as Category;
  const confidence = extractXmlTagContent(findingXml, 'confidence') as Confidence;
  const file = extractXmlTagContent(findingXml, 'file');
  const lineStartRaw = extractXmlTagContent(findingXml, 'line_start');
  const lineEndRaw = extractXmlTagContent(findingXml, 'line_end');
  const title = extractXmlTagContent(findingXml, 'title');
  const description = extractXmlTagContent(findingXml, 'description');
  const suggestion = extractXmlTagContent(findingXml, 'suggestion');
  const id = extractXmlTagContent(findingXml, 'id');

  const resolvedSeverity: Severity = VALID_SEVERITIES.includes(severity) ? severity : 'warning';
  const resolvedCategory: Category = VALID_CATEGORIES.includes(category) ? category : fallbackCategory;
  const resolvedConfidence: Confidence = VALID_CONFIDENCES.includes(confidence) ? confidence : 'medium';
  const resolvedFile = file.length > 0 ? file : 'unknown';
  const lineStart = toNumber(lineStartRaw) ?? 1;
  const lineEnd = Math.max(lineStart, toNumber(lineEndRaw) ?? lineStart);
  const resolvedTitle = title.length > 0 ? title : 'Untitled finding';

  return {
    id: id.length > 0 ? id : `${agentName}-${index + 1}`,
    agent: agentName,
    severity: resolvedSeverity,
    category: resolvedCategory,
    file: resolvedFile,
    line_start: lineStart,
    line_end: lineEnd,
    title: resolvedTitle,
    description,
    suggestion,
    confidence: resolvedConfidence,
  };
}

export function parseXmlFindings(raw: string, agentName: string, fallbackCategory: Category): SpecialistFinding[] {
  const findingsBlock = extractXmlTagContent(raw, 'findings');
  if (!findingsBlock.trim()) {
    return [];
  }

  const findingMatches = [...findingsBlock.matchAll(/<finding>([\s\S]*?)<\/finding>/gi)];
  return findingMatches
    .map((match, index) => parseXmlFinding(match[1], agentName, fallbackCategory, index))
    .filter((f): f is SpecialistFinding => f !== null);
}

// ─── Orchestration ────────────────────────────────────────────────────────────

function getTimeoutMs(): number {
  const raw = process.env.REVIEW_AGENT_TIMEOUT_MS;
  if (!raw) return DEFAULT_ORCHESTRATOR_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ORCHESTRATOR_TIMEOUT_MS;
}

async function readOptionalFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

async function loadAgentInstructions(instructionFiles: string[]): Promise<string> {
  const chunks = await Promise.all(
    instructionFiles.map(async (instructionPath) => {
      const absolutePath = path.resolve(process.cwd(), instructionPath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      return `# ${instructionPath}\n${content}`;
    })
  );
  return chunks.join('\n\n');
}

function buildOrchestratorSystemPrompt(scopes: AgentScope[], agentInstructions: Map<string, string>): string {
  const agentDescriptions = scopes.map((scope) => {
    const instructions = agentInstructions.get(scope.agentName) ?? '';
    return `## Agent: ${scope.agentName}\n${instructions}`;
  }).join('\n\n---\n\n');

  return [
    'You are a code review orchestrator. Your job is to dispatch specialist review agents',
    'and collect their findings in XML format.',
    '',
    'Each specialist agent you spawn MUST return findings in this exact XML format:',
    '<findings>',
    '  <finding>',
    '    <id>agent-N</id>',
    '    <severity>critical|warning|suggestion</severity>',
    '    <category>security|quality|performance|docs|release</category>',
    '    <file>path/to/file</file>',
    '    <line_start>N</line_start>',
    '    <line_end>N</line_end>',
    '    <title>Short title</title>',
    '    <description>Full description</description>',
    '    <suggestion>Actionable fix</suggestion>',
    '    <confidence>high|medium|low</confidence>',
    '  </finding>',
    '</findings>',
    '',
    'If an agent finds no issues, it returns <findings/>',
    '',
    'After all agents complete, merge all their <finding> elements into one <findings> block and return it.',
    '',
    '## Specialist Agent Instructions',
    '',
    agentDescriptions,
  ].join('\n');
}

async function buildOrchestratorUserPrompt(scopes: AgentScope[]): Promise<string> {
  const agentNames = scopes.map((s) => s.agentName).join(', ');
  const sharedContextPath = scopes[0]?.sharedContextPath ?? '';
  const sharedContext = sharedContextPath ? await readOptionalFile(sharedContextPath) : '';

  const agentSections = await Promise.all(
    scopes.map(async (scope) => {
      const patchBlocks = await Promise.all(
        scope.patchFiles.map(async (file) => {
          await scope.ensurePatch(file);
          const content = await readOptionalFile(file.patchPath);
          return `### PATCH: ${file.filename}\n${content}`;
        })
      );

      return [
        `## AGENT: ${scope.agentName}`,
        ...patchBlocks,
      ].join('\n');
    })
  );

  return [
    `Spawn exactly these agents: [${agentNames}].`,
    'For each agent, pass its scoped patch content and the shared context below.',
    'Instruct each agent to return XML findings. After all agents complete, merge the XML.',
    '',
    '## SHARED CONTEXT',
    sharedContext,
    '',
    ...agentSections,
  ].join('\n');
}

export async function orchestrateAgentsImpl(
  scopes: AgentScope[],
  config: ReviewConfig
): Promise<SpecialistFinding[][]> {
  if (scopes.length === 0) {
    return [];
  }

  const agentInstructions = new Map<string, string>();
  for (const scope of scopes) {
    const agent = AGENT_REGISTRY.find((a) => a.name === scope.agentName);
    if (agent) {
      agentInstructions.set(scope.agentName, await loadAgentInstructions(agent.instructionFiles));
    }
  }

  const orchestratorModelId = config.models.standard.id;
  const systemPrompt = buildOrchestratorSystemPrompt(scopes, agentInstructions);
  const userPrompt = await buildOrchestratorUserPrompt(scopes);

  const client = new CopilotClient({ gitHubToken: process.env.GITHUB_TOKEN });
  await client.start();

  try {
    const session = await client.createSession({
      model: orchestratorModelId,
      onPermissionRequest: approveAll,
      systemMessage: { content: systemPrompt },
    });

    try {
      const response = await session.sendAndWait({ prompt: userPrompt }, getTimeoutMs());
      const rawOutput = response?.data.content ?? '';

      const findingsByAgent: SpecialistFinding[][] = scopes.map((scope) => {
        const agent = AGENT_REGISTRY.find((a) => a.name === scope.agentName);
        const fallbackCategory = agent?.category ?? 'quality';
        return parseXmlFindings(rawOutput, scope.agentName, fallbackCategory);
      });

      return findingsByAgent;
    } finally {
      await session.disconnect().catch(() => undefined);
    }
  } finally {
    const shutdownErrors = await client.stop();
    if (shutdownErrors.length > 0) {
      console.warn('[orchestration] Client shutdown reported errors:', shutdownErrors.length);
    }
  }
}

export async function orchestrateAgents(
  scopes: AgentScope[],
  config: ReviewConfig
): Promise<SpecialistFinding[][]> {
  return orchestrateAgentsImpl(scopes, config);
}
