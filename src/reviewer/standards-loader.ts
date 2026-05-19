import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

function readSkillsDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const chunks: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const isDir =
      entry.isDirectory() || (entry.isSymbolicLink() && fs.statSync(entryPath).isDirectory());
    if (!isDir) continue;
    const skillPath = path.join(dir, entry.name, "SKILL.md");
    if (fs.existsSync(skillPath)) {
      chunks.push(fs.readFileSync(skillPath, "utf-8"));
    }
  }
  return chunks;
}

export function loadStandards(sources: string[]): Promise<string> {
  if (sources.length === 0) return Promise.resolve("");

  for (const source of sources) {
    console.log(`[standards] Installing skills from ${source}...`);
    execSync(`npx skills add ${source} --yes`, { stdio: "inherit" });
  }

  const projectSkillsDir = path.join(process.cwd(), ".claude", "skills");
  const globalSkillsDir = path.join(os.homedir(), ".claude", "skills");

  const chunks = [...readSkillsDir(projectSkillsDir), ...readSkillsDir(globalSkillsDir)];

  return Promise.resolve(chunks.join("\n\n---\n\n"));
}
