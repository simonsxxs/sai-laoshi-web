import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { UserMemory } from './prompt-assembler';

/**
 * Default user ID for single-user MVP
 */
const DEFAULT_USER_ID = 'default';

/**
 * Get the absolute path to the memory directory
 */
function getMemoryDirectory(): string {
  return join(process.cwd(), 'data', 'memory');
}

/**
 * Get the absolute path to a specific memory file
 */
function getMemoryFilePath(filename: string, userId: string = DEFAULT_USER_ID): string {
  // For single-user MVP, we ignore userId in the file path
  return join(getMemoryDirectory(), filename);
}

/**
 * Ensure the memory directory exists
 */
async function ensureMemoryDirectory(): Promise<void> {
  await mkdir(getMemoryDirectory(), { recursive: true });
}

/**
 * Read a JSON file, returning defaultValue if it doesn't exist or is invalid
 */
async function readJsonFile<T>(filename: string, defaultValue: T, userId?: string): Promise<T> {
  const filePath = getMemoryFilePath(filename, userId);
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    // If file doesn't exist or is invalid JSON, return default
    return defaultValue;
  }
}

/**
 * Write a JSON file, ensuring the directory exists first
 */
async function writeJsonFile<T>(filename: string, data: T, userId?: string): Promise<void> {
  await ensureMemoryDirectory();
  const filePath = getMemoryFilePath(filename, userId);
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Load all memory for a user
 */
export async function loadMemory(userId?: string): Promise<UserMemory> {
  const [profile, decisions, followups, insights] = await Promise.all([
    readJsonFile<string>('profile.json', '', userId),
    readJsonFile<UserMemory['decisions']>('decisions.json', [], userId),
    readJsonFile<UserMemory['followups']>('followups.json', [], userId),
    readJsonFile<UserMemory['insights']>('insights.json', [], userId),
  ]);

  return {
    profile: profile || undefined,
    decisions: decisions && decisions.length > 0 ? decisions : undefined,
    followups: followups && followups.length > 0 ? followups : undefined,
    insights: insights && insights.length > 0 ? insights : undefined,
  };
}

/**
 * Save/update user profile
 */
export async function saveProfile(profile: string, userId?: string): Promise<void> {
  await writeJsonFile('profile.json', profile, userId);
}

/**
 * Append a decision to the decisions list
 */
export async function addDecision(
  decision: { date: string; problem: string; choice: string; considerations: string; status: string },
  userId?: string
): Promise<void> {
  const decisions = await readJsonFile<UserMemory['decisions']>('decisions.json', [], userId);
  decisions?.push(decision);
  await writeJsonFile('decisions.json', decisions, userId);
}

/**
 * Add or update a followup
 * If a followup with the same content exists, it will be replaced
 */
export async function upsertFollowup(
  followup: { content: string; status: string; dueDate?: string },
  userId?: string
): Promise<void> {
  const followups = await readJsonFile<UserMemory['followups']>('followups.json', [], userId);

  // Find existing followup with the same content
  const existingIndex = followups?.findIndex(f => f.content === followup.content) ?? -1;

  if (existingIndex >= 0 && followups) {
    followups[existingIndex] = followup;
  } else {
    followups?.push(followup);
  }

  await writeJsonFile('followups.json', followups, userId);
}

/**
 * Add an insight to the insights list
 */
export async function addInsight(insight: string, userId?: string): Promise<void> {
  const insights = await readJsonFile<UserMemory['insights']>('insights.json', [], userId);
  insights?.push(insight);
  await writeJsonFile('insights.json', insights, userId);
}

/**
 * Save conversation messages to the log file
 */
export async function saveMessages(
  messages: Array<{ role: string; content: string }>,
  userId?: string,
): Promise<void> {
  const log = await readJsonFile<Array<{ role: string; content: string; timestamp: string }>>(
    'messages.json',
    [],
    userId,
  );
  const timestamp = new Date().toISOString();
  for (const msg of messages) {
    if (msg.content) {
      log.push({ ...msg, timestamp });
    }
  }
  // Keep only last 500 messages
  const trimmed = log.length > 500 ? log.slice(-500) : log;
  await writeJsonFile('messages.json', trimmed, userId);
}

/**
 * Update user profile — append new observation
 */
export async function updateProfile(observation: string, userId?: string): Promise<void> {
  const existing = await readJsonFile<string>('profile.json', '', userId);
  const timestamp = new Date().toISOString().slice(0, 10);
  const entry = `[${timestamp}] ${observation}`;
  const updated = existing ? `${existing}\n${entry}` : entry;
  await writeJsonFile('profile.json', updated, userId);
}

/**
 * Clear all memory for a user
 */
export async function clearMemory(userId?: string): Promise<void> {
  // Write empty/default values to all memory files
  await Promise.all([
    writeJsonFile('profile.json', '', userId),
    writeJsonFile('decisions.json', [], userId),
    writeJsonFile('followups.json', [], userId),
    writeJsonFile('insights.json', [], userId),
  ]);
}
