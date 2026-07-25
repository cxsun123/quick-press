'use server';

import { revalidatePath } from 'next/cache';
import * as siteConfigService from '@/server/services/site-config.service';
import { solveAnubisChallenge } from '@/server/utils/anubis';
import { aiRequest } from '@/server/utils/ai-client';

export async function getSiteConfig(key: string) {
  return siteConfigService.getSiteConfig(key);
}

export async function getRegistrationMode(): Promise<'open' | 'invite' | 'closed'> {
  return siteConfigService.getRegistrationMode();
}

export async function updateSiteConfig(key: string, value: string) {
  await siteConfigService.updateSiteConfig(key, value);
}

export async function updateSiteConfigs(data: Record<string, string>) {
  await siteConfigService.updateSiteConfigs(data);
  revalidatePath('/', 'layout');
}

export async function getAllSiteConfigs(): Promise<Record<string, string>> {
  return siteConfigService.getAllSiteConfigs();
}

export async function getSiteTheme(): Promise<{ mode: string; theme: string }> {
  return siteConfigService.getSiteTheme();
}

export async function saveSiteTheme(mode: string, theme: string) {
  await siteConfigService.saveSiteTheme(mode, theme);
  revalidatePath('/', 'layout');
}

export interface ImageSearchTestResult {
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  message: string;
  needsAnubis: boolean;
}

export interface AiTestResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  status: number | null;
}

export async function testAiConnection(url: string, apiKey: string, model: string): Promise<AiTestResult> {
  try {
    const testText = '人工智能正在改变世界。深度学习让计算机能够识别图像和理解语言，自动驾驶汽车已经上路测试。';

    const prompt = `You are a blog metadata extractor. Extract metadata from the article below. Do NOT rewrite the content.

## Article Content
---
${testText}
---

## Existing Categories (pick up to 3 best matches first; if none fit, suggest new names)
(none - suggest new)

## Existing Tags (pick up to 5 best matches first; if none fit, suggest new names)
(none - suggest new)

## Requirements
1. summary: One-sentence summary (~100 Chinese characters)
2. keywords: Extract exactly 5 core keywords
3. categories: Prefer matching existing categories above. Max 3.
4. tags: Prefer matching existing tags above. Max 5.

## Output Format
Return ONLY a valid JSON object. No markdown fences, no extra text.
Example: {"summary":"...","keywords":["k1","k2","k3","k4","k5"],"categories":["Cat1"],"tags":["Tag1"]}`;

    const { text: content, latencyMs } = await aiRequest(url, apiKey, model, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      reasoning_effort: 'high',
      stream: false,
      thinking: { type: 'disabled' },
    }, AbortSignal.timeout(30000));

    if (!content) {
      return { ok: false, latencyMs, message: '结果解析失败', status: null };
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch {}
      }
    }

    if (parsed && (parsed.summary || parsed.keywords || parsed.categories || parsed.tags)) {
      return { ok: true, latencyMs, message: '连接正常', status: null };
    }

    return { ok: false, latencyMs, message: '结果解析失败', status: null };
  } catch (e: any) {
    const latencyMs = typeof e.latencyMs === 'number' ? e.latencyMs : 0;
    const status = typeof e.status === 'number' ? e.status : null;
    const message = e.name === 'TimeoutError' || e.message?.includes('timeout')
      ? '连接超时'
      : e.message || 'AI 连接不通';
    return { ok: false, latencyMs, message, status };
  }
}

export async function testImageSearchUrls(urls: string[]): Promise<ImageSearchTestResult[]> {
  const results: ImageSearchTestResult[] = [];

  for (const rawUrl of urls) {
    const url = rawUrl.replace(/\/+$/, '');
    const start = Date.now();
    let status: number | null = null;
    let ok = false;
    let needsAnubis = false;
    let message = '';

    try {
      const testUrl = `${url}/search?q=test&format=json`;
      const resp = await fetch(testUrl, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        },
      });
      status = resp.status;

      if (resp.ok) {
        const text = await resp.text();
        const isHtml = text.trimStart().startsWith('<!') || text.includes('<html');
        if (isHtml && text.includes('anubis')) {
          ok = true;
          needsAnubis = true;
          message = '连接正常（需 Anubis 验证）';
        } else {
          try {
            const data = JSON.parse(text);
            if (data.results) {
              ok = true;
              message = '连接正常';
            } else {
              message = '响应格式异常（无 results 字段）';
            }
          } catch {
            message = '响应非 JSON 格式';
          }
        }
      } else if (resp.status === 429) {
        message = '被限流 (429)';
      } else if (resp.status === 202) {
        const text = await resp.text();
        if (text.includes('bot') || text.includes('anubis')) {
          ok = true;
          needsAnubis = true;
          message = '连接正常（需 Anubis 验证）';
        } else {
          message = '被反机器人拦截 (202)';
        }
      } else {
        message = `HTTP ${resp.status}`;
      }
    } catch (e: any) {
      if (e.name === 'TimeoutError' || e.message?.includes('timeout')) {
        message = '连接超时';
      } else {
        message = e.message || '网络错误';
      }
    }

    const latencyMs = Date.now() - start;
    results.push({ url, ok, status, latencyMs, message, needsAnubis });
  }

  return results;
}
