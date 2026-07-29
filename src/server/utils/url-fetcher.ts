import 'server-only';
import { convertHtmlToMarkdown } from '@/server/utils/file-parser';

// ===== Types =====

export interface FetchResult {
  html: string;
  markdown: string;
  title?: string;
  coverUrl: string | null;
  articleImages: { url: string; alt: string; position: number }[];
}

export class BlockedError extends Error {
  public url: string;
  public attempts: number;
  public blockedReason: string;

  constructor(url: string, attempts: number, reason: string) {
    const isWeChat = isWeChatDomain(url);
    const lines = [
      `Fetch failed: ${url}`,
      `Attempts: ${attempts}`,
      `Reason: ${reason}`,
      '',
      'Suggestions:',
      '  1. Open the URL manually in a browser and copy the full text',
      '  2. Use the "text" parameter: publish({text: "pasted content"})',
    ];
    if (isWeChat) {
      lines.push('  3. WeChat article: open in WeChat browser, copy the link, use text mode');
    }
    super(lines.join('\n'));
    this.name = 'BlockedError';
    this.url = url;
    this.attempts = attempts;
    this.blockedReason = reason;
  }
}

// ===== UA Pools =====

const DESKTOP_UAS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

const MOBILE_UAS = [
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S23) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.159 Mobile Safari/537.36',
];

const WECHAT_UAS = [
  'Mozilla/5.0 (Linux; Android 13; SM-G9910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36 MicroMessenger/8.0.43.2670(0x28002B51) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.43(0x18002B2C) NetType/WIFI Language/zh_CN',
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.131 Mobile Safari/537.36 MicroMessenger/8.0.42.2660(0x28002A51) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64',
  'Mozilla/5.0 (Linux; Android 11; Redmi K30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.136 Mobile Safari/537.36 MicroMessenger/8.0.41.2600(0x28002951) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40(0x1800282C) NetType/4G Language/zh_CN',
];

const REFERERS: string[] = [
  'https://www.google.com/',
  'https://www.baidu.com/',
  'https://mp.weixin.qq.com/',
  'https://weixin.qq.com/',
];

// ===== Anti-spam detection =====

const ANTI_SPAM_KEYWORDS = [
  '访问频率过高', '验证', '请稍后', '环境异常', '验证码',
  'Too Many Requests', 'rate limit', 'captcha', 'CAPTCHA',
  'just a moment', 'please wait',
];

// ===== Image filters =====

const AD_DOMAINS = ['google-analytics', 'googletagmanager', 'doubleclick', 'facebook.com/tr', 'facebook.net', 'pixel', '1x1', 'spacer', 'blank', 'clear.gif', 'b.scorecardresearch', 'bat.bing.com', 'cm.everesttech.net'];
const SKIP_ALT = ['头像', 'avatar', 'icon', 'logo', '二维码', 'qrcode', 'qr code', '广告', 'sponsor', 'badge'];
const SKIP_URL_PATTERNS = ['mmbiz_png', 'mmbiz_jpg/4X8', 'favicon', 'icon-', 'logo.', 'avatar'];

// ===== Helpers =====

function isWeChatDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'mp.weixin.qq.com' || hostname === 'weixin.qq.com';
  } catch {
    return false;
  }
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildHeaders(url: string, attempt: number): Record<string, string> {
  const isWeChat = isWeChatDomain(url);
  const ua = isWeChat
    ? randomPick(WECHAT_UAS)
    : attempt === 0
      ? randomPick(DESKTOP_UAS)
      : randomPick([...MOBILE_UAS, ...DESKTOP_UAS]);

  const headers: Record<string, string> = {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Referer': randomPick(REFERERS),
  };

  if (isWeChat) {
    headers['Referer'] = 'https://mp.weixin.qq.com/';
    headers['X-Requested-With'] = 'com.tencent.mm';
  }

  return headers;
}

function containsAntiSpam(html: string): boolean {
  const lower = html.toLowerCase();
  return ANTI_SPAM_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function extractWeChatContent(html: string): { title?: string; bodyHtml: string } {
  const titlePatterns = [
    /<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/i,
    /<h1[^>]*id="activity-name"[^>]*>([\s\S]*?)<\/h1>/i,
    /<h2[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h2>/i,
  ];
  let title: string | undefined;
  for (const pattern of titlePatterns) {
    const m = html.match(pattern);
    if (m) {
      title = m[1].replace(/<[^>]+>/g, '').trim();
      break;
    }
  }

  const contentPatterns = [
    /<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="rich_media_content"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="rich_media_content js_underline_content"[^>]*>([\s\S]*?)<\/div>/i,
  ];
  let bodyHtml = '';
  for (const pattern of contentPatterns) {
    const m = html.match(pattern);
    if (m) {
      bodyHtml = m[1];
      break;
    }
  }

  return { title, bodyHtml: bodyHtml || html };
}

function extractGeneralContent(html: string): { bodyHtml: string } {
  const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return { bodyHtml: bodyMatch ? bodyMatch[1] : html };
}

function extractCoverImage(html: string, baseUrl: string): string | null {
  const ogMatch = html.match(/<meta\s+(?:[^>]*?)property=["']og:image["'][^>]*?content=["']([^"']+)["']/i)
    || html.match(/<meta\s+(?:[^>]*?)content=["']([^"']+)["'][^>]*?property=["']og:image["']/i);
  const twMatch = html.match(/<meta\s+(?:[^>]*?)name=["']twitter:image["'][^>]*?content=["']([^"']+)["']/i)
    || html.match(/<meta\s+(?:[^>]*?)content=["']([^"']+)["'][^>]*?name=["']twitter:image["']/i);
  const rawCover = ogMatch?.[1] || twMatch?.[1] || null;

  if (rawCover) {
    try { return new URL(rawCover, baseUrl).href; } catch { return rawCover; }
  }

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    try { return new URL(imgMatch[1], baseUrl).href; } catch { return imgMatch[1]; }
  }

  return null;
}

function extractArticleImages(bodyHtml: string, baseUrl: string): { url: string; alt: string; position: number }[] {
  const images: { url: string; alt: string; position: number }[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  let position = 0;

  while ((match = imgRegex.exec(bodyHtml)) !== null) {
    const rawSrc = match[1];
    if (rawSrc.startsWith('data:')) continue;

    const srcLower = rawSrc.toLowerCase();
    if (AD_DOMAINS.some(d => srcLower.includes(d))) continue;

    const widthMatch = match[0].match(/width=["']?(\d+)/i);
    const heightMatch = match[0].match(/height=["']?(\d+)/i);
    const w = parseInt(widthMatch?.[1] || '999', 10);
    const h = parseInt(heightMatch?.[1] || '999', 10);
    if (w < 100 || h < 100) continue;

    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    const alt = altMatch?.[1] || '';
    if (SKIP_ALT.some(k => alt.toLowerCase().includes(k))) continue;
    if (SKIP_URL_PATTERNS.some(p => srcLower.includes(p))) continue;

    let imgUrl: string;
    try { imgUrl = new URL(rawSrc, baseUrl).href; } catch { imgUrl = rawSrc; }

    images.push({ url: imgUrl, alt, position: position++ });
  }

  return images;
}

// ===== Main =====

export async function fetchUrl(url: string, timeoutMs = 30000): Promise<FetchResult> {
  const maxAttempts = 3;
  const backoffs = [2000, 5000, 15000];

  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const headers = buildHeaders(url, attempt);

    try {
      if (attempt > 0) {
        const jitter = attempt === 1
          ? Math.random() * 3000
          : Math.random() * 10000;
        await sleep(backoffs[attempt] + jitter);
      }

      const resp = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'follow',
      });

      if (resp.status === 429) {
        lastError = 'HTTP 429 (rate limited)';
        await sleep(15000 + Math.random() * 15000);
        continue;
      }

      if (resp.status === 403) {
        lastError = 'HTTP 403 (forbidden)';
        await sleep(30000 + Math.random() * 30000);
        continue;
      }

      if (resp.status === 503) {
        lastError = 'HTTP 503 (service unavailable)';
        await sleep(20000 + Math.random() * 20000);
        continue;
      }

      if (!resp.ok) {
        lastError = `HTTP ${resp.status}`;
        await sleep(5000 + Math.random() * 5000);
        continue;
      }

      const html = await resp.text();

      if (containsAntiSpam(html)) {
        lastError = 'Anti-spam page detected';
        await sleep(10000 + Math.random() * 10000);
        continue;
      }

      // Domain-specific content extraction
      const isWeChat = isWeChatDomain(url);
      const { title: weChatTitle, bodyHtml: weChatBody } = isWeChat
        ? extractWeChatContent(html)
        : { title: undefined, bodyHtml: '' };

      let bodyHtml: string;
      let pageTitle: string | undefined = weChatTitle;

      if (isWeChat) {
        bodyHtml = weChatBody;
      } else {
        const { bodyHtml: generalBody } = extractGeneralContent(html);
        bodyHtml = generalBody;
      }

      const { markdown } = convertHtmlToMarkdown(bodyHtml);

      if (markdown.length < 50) {
        lastError = `Content too short (${markdown.length} chars after extraction)`;
        await sleep(10000 + Math.random() * 10000);
        continue;
      }

      const coverUrl = extractCoverImage(html, url);
      const allImages = extractArticleImages(bodyHtml, url);
      const articleImages = coverUrl
        ? allImages.filter(img => img.url !== coverUrl)
        : allImages;

      if (!pageTitle) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        pageTitle = titleMatch?.[1]?.trim() || undefined;
      }

      return {
        html,
        markdown,
        title: pageTitle,
        coverUrl,
        articleImages,
      };
    } catch (err: any) {
      if (err instanceof BlockedError) throw err;
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        lastError = `Timeout (${timeoutMs}ms)`;
      } else {
        lastError = err.message || String(err);
      }
    }
  }

  throw new BlockedError(url, maxAttempts, lastError || 'Unknown error');
}
