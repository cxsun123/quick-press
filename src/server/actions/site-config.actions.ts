'use server';

import { revalidatePath } from 'next/cache';
import * as siteConfigService from '@/server/services/site-config.service';
import { solveAnubisChallenge } from '@/server/utils/anubis';

export async function getSiteConfig(key: string) {
  return siteConfigService.getSiteConfig(key);
}

export async function getRegistrationMode(): Promise<'open' | 'invite' | 'closed'> {
  return siteConfigService.getRegistrationMode();
}

export async function updateSiteConfig(key: string, value: string) {
  await siteConfigService.updateSiteConfig(key, value);
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
