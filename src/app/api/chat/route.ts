import { streamText, convertToModelMessages, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { buildSystemPrompt } from '@/lib/prompt-assembler';
import {
  loadMemory,
  saveMessages,
  upsertFollowup,
  addInsight,
  updateProfile,
} from '@/lib/memory-manager';
import type { UIMessage } from 'ai';

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const LLM_API_KEY = process.env.LLM_API_KEY || 'sk-placeholder';
const MODEL = process.env.LLM_MODEL || 'deepseek-v3-250324';

const volcengine = createOpenAI({
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
});

function getMessageText(msg: { role: string; parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  if (msg.content) return msg.content;
  if (msg.parts) {
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n');
  }
  return '';
}

async function extractAndSaveMemory(
  userMessages: UIMessage[],
  assistantText: string,
): Promise<void> {
  // Build a compact conversation summary
  const recentMessages = userMessages.slice(-6);
  const conversationText = recentMessages
    .map((m) => {
      const text = getMessageText(m);
      return text ? `${m.role === 'user' ? '用户' : '赛老师'}: ${text}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const extractionPrompt = `你是赛老师的内部记忆系统。根据以下对话，提取用户信息并返回 JSON。

对话：
${conversationText}
赛老师: ${assistantText}

只提取以下内容（没有的字段填 null）：
- profile_update: 用户的关注点、人生阶段、思维偏好、沟通偏好（如有新发现才填，否则 null）
- insight: 关键洞察——用户没说但对话中浮现的深层模式（1句话，没有则 null）
- followup: 需要后续跟进的事项（1句话，没有则 null）

返回纯 JSON：{"profile_update": "...", "insight": "...", "followup": "..."}`;

  try {
    const result = await generateText({
      model: volcengine.chat(MODEL),
      prompt: extractionPrompt,
      temperature: 0.3,
      maxOutputTokens: 300,
    });

    const json = JSON.parse(result.text.trim());

    if (json.profile_update) {
      await updateProfile(json.profile_update);
    }
    if (json.insight) {
      await addInsight(json.insight);
    }
    if (json.followup) {
      await upsertFollowup({ content: json.followup, status: 'pending' });
    }
  } catch (err) {
    console.error('Memory extraction failed:', err);
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const modelMessages = await convertToModelMessages(messages);

    const memory = await loadMemory();
    const systemPrompt = await buildSystemPrompt(memory);

    const result = streamText({
      model: volcengine.chat(MODEL),
      system: systemPrompt,
      messages: modelMessages.slice(-20),
      temperature: 0.7,
      maxOutputTokens: 4096,
      onFinish: async ({ text }) => {
        // Save conversation log
        const lastUserMsg = messages[messages.length - 1];
        const userText = getMessageText(lastUserMsg);
        if (userText || text) {
          saveMessages([
            { role: 'user', content: userText },
            { role: 'assistant', content: text },
          ]).catch((e) => console.error('Save messages failed:', e));
        }

        // Extract and save memory (fire-and-forget)
        if (text && text.length > 20) {
          extractAndSaveMemory(messages, text).catch((e) =>
            console.error('Memory extraction failed:', e),
          );
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred during the chat',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }
}