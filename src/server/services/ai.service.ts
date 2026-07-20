import 'server-only';
import * as configService from './site-config.service';

const PROMPT_TEMPLATE = `Extract the summary and keywords from the article below.

Article:
---
CONTENT_PLACEHOLDER
---

Output Requirements:
- Return ONLY a JSON object containing summary and keywords.
- Summary: A single sentence of around 100 characters, no less than 50 characters.
- Keywords: 3\u20135 keywords.
- Output Language: Chinese.
- Strict Output Schema:
    {
      "summary": "...",
      "keywords": ["...", "..."]
    }
- Do not include any text, explanation, or markdown formatting outside the JSON.`;

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')           // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')      // links
    .replace(/[#*`\[\]()>|\\_~]/g, ' ')         // markdown syntax
    .replace(/\s+/g, ' ')                       // collapse whitespace
    .trim();
}

export async function extractSummary(content: string): Promise<{ summary: string; keywords: string[] }> {
  const plain = stripMarkdown(content);

  // If plain text is short (<300 chars), just use first 100 chars, no AI needed
  if (plain.length < 300) {
    return {
      summary: plain.slice(0, 100).trim(),
      keywords: [],
    };
  }

  const url = await configService.getSiteConfig('ai_provider_url');
  const apiKey = await configService.getSiteConfig('ai_api_key');
  const model = (await configService.getSiteConfig('ai_model')) || 'gpt-4o-mini';
  const maxLenStr = (await configService.getSiteConfig('ai_max_content_length')) || '100000';
  const maxLen = Math.max(1000, parseInt(maxLenStr, 10) || 100000);

  if (!url || !apiKey) throw new Error('AI Provider 未配置，请在设置中配置 AI 相关参数');

  // Truncate content to configured limit to avoid exceeding model context window
  const truncated = content.length > maxLen ? content.slice(0, maxLen) + '...' : content;
  const prompt = PROMPT_TEMPLATE.replace('CONTENT_PLACEHOLDER', truncated);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI API 返回错误 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();

  // Handle different response formats (OpenAI, DeepSeek, etc.)
  let text = '';
  const msg = data.choices?.[0]?.message;
  if (msg?.content) {
    text = msg.content;
  } else if (msg?.reasoning_content) {
    // DeepSeek R1-style: reasoning content is the actual response when content is empty
    text = msg.reasoning_content;
  } else if (data.choices?.[0]?.text) {
    text = data.choices[0].text;
  } else if (data.response) {
    text = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
  }

  if (!text) {
    console.error('[AI Debug] Raw response:', JSON.stringify(data).slice(0, 500));
    throw new Error('AI 返回为空，请检查模型配置');
  }

  // Extract JSON from response - handle potential markdown code blocks or reasoning content
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`AI 返回格式异常，请检查模型是否支持。响应: ${text.slice(0, 100)}...`);
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  let result: any;
  try {
    result = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI 返回 JSON 解析失败。响应: ${text.slice(0, 100)}...`);
  }

  return {
    summary: (result.summary || '').trim(),
    keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5).map((k: string) => k.trim()).filter(Boolean) : [],
  };
}
