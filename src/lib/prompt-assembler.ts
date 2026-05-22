import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * User memory interface matching the SKILL.md expected format
 */
export interface UserMemory {
  profile?: string;
  decisions?: Array<{ date: string; problem: string; choice: string; considerations: string; status: string }>;
  followups?: Array<{ content: string; status: string; dueDate?: string }>;
  insights?: string[];
}

/**
 * Skill file paths relative to the advisor-companion skill directory
 */
const SKILL_FILES = [
  'SKILL.md',
  'references/frameworks.md',
  'references/style-guide.md',
  'references/conversation-patterns.md',
  'references/dispatch-routes.md',
];

/**
 * Get the absolute path to the advisor-companion skill directory
 */
function getSkillDirectory(): string {
  return join(process.cwd(), 'src', 'skills', 'advisor-companion');
}

/**
 * Read a single skill file with error handling
 */
async function readSkillFile(filename: string): Promise<string | null> {
  const filePath = join(getSkillDirectory(), filename);
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`Warning: Could not read skill file ${filename}:`, (error as Error).message);
    return null;
  }
}

/**
 * Format user memory into the Markdown structure expected by SKILL.md
 */
export function formatMemory(memory: UserMemory): string {
  const sections: string[] = ['## 当前用户记忆'];

  if (memory.profile) {
    sections.push(`### 用户画像\n${memory.profile}`);
  }

  if (memory.decisions && memory.decisions.length > 0) {
    const decisionsList = memory.decisions
      .map(d => `- **${d.date}**: ${d.problem}\n  - 选择: ${d.choice}\n  - 考虑: ${d.considerations}\n  - 状态: ${d.status}`)
      .join('\n');
    sections.push(`### 关键决策\n${decisionsList}`);
  }

  if (memory.followups && memory.followups.length > 0) {
    const followupsList = memory.followups
      .map(f => `- ${f.content} (${f.status})${f.dueDate ? ` - 到期: ${f.dueDate}` : ''}`)
      .join('\n');
    sections.push(`### 待跟进\n${followupsList}`);
  }

  if (memory.insights && memory.insights.length > 0) {
    const insightsList = memory.insights.map(i => `- ${i}`).join('\n');
    sections.push(`### 关键洞察\n${insightsList}`);
  }

  // Only return the memory section if there's actual content
  if (sections.length === 1) {
    return '';
  }

  return sections.join('\n\n');
}

/**
 * Rough token count estimate
 * - Chinese-dominant text: ~2 characters per token
 * - English-dominant text: ~4 characters per token
 * - Mixed: Uses a heuristic based on Chinese character ratio
 */
export function estimateTokenCount(prompt: string): number {
  if (!prompt) return 0;

  const chineseChars = (prompt.match(/[一-鿿]/g) || []).length;
  const totalChars = prompt.length;
  const chineseRatio = chineseChars / totalChars;

  if (chineseRatio > 0.3) {
    return Math.ceil(totalChars / 2);
  }
  return Math.ceil(totalChars / 4);
}

/**
 * Build the complete system prompt by assembling skill files and user memory
 */
export async function buildSystemPrompt(userMemory?: UserMemory): Promise<string> {
  const parts: string[] = [];

  // Read all skill files
  for (const filename of SKILL_FILES) {
    const content = await readSkillFile(filename);
    if (content) {
      parts.push(content);
    }
  }

  // Add user memory if provided
  if (userMemory) {
    const formattedMemory = formatMemory(userMemory);
    if (formattedMemory) {
      parts.push(formattedMemory);
    }
  }

  // Join with separators
  return parts.join('\n\n---\n\n');
}
