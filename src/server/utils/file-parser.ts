import 'server-only';
import path from 'path';
import os from 'os';
import fs from 'fs';
import TurndownService from 'turndown';
import { parseOffice } from 'officeparser';
import PDFParser from 'pdf2json';

// ---- Types ----

type FileType = 'MARKDOWN' | 'HTML' | 'TXT' | 'PDF' | 'WORD' | 'ODT' | 'RTF' | 'PPT' | 'UNKNOWN';

const EXT_TYPE_MAP: Record<string, FileType> = {
  '.md': 'MARKDOWN', '.markdown': 'MARKDOWN',
  '.html': 'HTML', '.htm': 'HTML',
  '.txt': 'TXT',
  '.pdf': 'PDF',
  '.doc': 'WORD', '.docx': 'WORD',
  '.odt': 'ODT',
  '.rtf': 'RTF',
  '.ppt': 'PPT', '.pptx': 'PPT',
};

const TEXT_EXTENSIONS = new Set(['.md', '.markdown', '.html', '.htm', '.txt']);
const MAX_TEXT_SIZE = 500 * 1024;          // 500KB
const MAX_BINARY_SIZE = 3 * 1024 * 1024;  // 3MB
export const MAX_TEXT_LENGTH = 100_000;    // 100K chars (export for MCP handler)

// ---- Magic Bytes Detection ----

const MAGIC_SIGNATURES: { bytes: number[]; type: FileType }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46], type: 'PDF' },
  { bytes: [0xD0, 0xCF, 0x11, 0xE0], type: 'WORD' },
  { bytes: [0x50, 0x4B, 0x03, 0x04], type: 'WORD' },
  { bytes: [0x7B, 0x5C, 0x72, 0x74, 0x66], type: 'RTF' },
  { bytes: [0x3C, 0x68, 0x74, 0x6D, 0x6C], type: 'HTML' },
  { bytes: [0x3C, 0x48, 0x54, 0x4D, 0x4C], type: 'HTML' },
];

function detectFileType(fileName: string, buffer: Buffer): FileType {
  const ext = path.extname(fileName).toLowerCase();
  const primaryType = EXT_TYPE_MAP[ext] || 'UNKNOWN';

  const header = buffer.slice(0, 8);
  let magicType: FileType = 'UNKNOWN';
  for (const sig of MAGIC_SIGNATURES) {
    if (sig.bytes.every((b, i) => header[i] === b)) {
      magicType = sig.type;
      break;
    }
  }

  if (magicType === 'WORD' && header[0] === 0x50 && primaryType === 'ODT') {
    const mimeStr = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
    if (mimeStr.includes('opendocument')) {
      return 'ODT';
    }
  }

  if (magicType !== 'UNKNOWN' && magicType !== primaryType && primaryType !== 'UNKNOWN') {
    console.warn(`[file-parser] Magic bytes (${magicType}) mismatch with extension ${ext}, using magic bytes`);
    return magicType;
  }
  if (magicType !== 'UNKNOWN' && primaryType === 'UNKNOWN') {
    return magicType;
  }
  return primaryType;
}

// ---- HTML → Markdown ----

export function convertHtmlToMarkdown(html: string): { markdown: string; pageTitle?: string } {
  // Extract <title> for potential title override
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch?.[1]?.trim();

  const cleaned = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '');

  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  });

  // Remove small decoration images (badges, icons)
  turndown.addRule('removeSmallImages', {
    filter(node: any) {
      if (node.nodeName === 'IMG') {
        const w = parseInt(node.getAttribute?.('width') || '999', 10);
        const h = parseInt(node.getAttribute?.('height') || '999', 10);
        if (w < 200 && h < 200) return true;
      }
      return false;
    },
    replacement() { return ''; },
  });

  let md = turndown.turndown(cleaned);

  // Fix escaped headings: \# Heading → # Heading
  md = md.replace(/^\\#\s+/gm, '# ');
  md = md.replace(/^\\##\s+/gm, '## ');

  // Remove badge/shield image lines (both escaped and unescaped brackets)
  md = md.replace(/!\\?\[[^\]]*\\?\]\(https?:\/\/img\.shields\.io[^)]*\)\s*/g, '');
  md = md.replace(/!\\?\[[^\]]*\\?\]\(https?:\/\/pandao\.github\.io[^)]*\)\s*/g, '');

  // Clean up multiple blank lines
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return { markdown: md, pageTitle };
}

// ---- PDF Parsing ----

async function parsePdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataError', (err: any) => reject(new Error(err.parserError?.parserError || 'PDF parse error')));
    parser.on('pdfParser_dataReady', (pdfData: any) => {
      let text = '';
      for (const page of pdfData.Pages || []) {
        for (const item of page.Texts || []) {
          for (const r of item.R || []) {
            text += decodeURIComponent(r.T || '') + ' ';
          }
        }
        text += '\n';
      }
      resolve(text);
    });
    parser.parseBuffer(buffer);
  });
}

// ---- Office File Parsing ----

async function parseOfficeFile(buffer: Buffer, fileName: string): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `mcp-${Date.now()}-${path.basename(fileName)}`);
  try {
    fs.writeFileSync(tmpPath, buffer);
    const ast = await parseOffice(tmpPath);
    // Recursively extract text from AST nodes
    const lines: string[] = [];
    function walk(nodes: any[]) {
      for (const node of nodes) {
        if (node.text) lines.push(node.text);
        if (node.children?.length) walk(node.children);
      }
    }
    walk(ast.content || []);
    return lines.join('\n');
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

// ---- Cover Image Extraction ----

export function extractCoverFromContent(rawContent: string, fileType: 'markdown' | 'html' | 'text', baseUrl?: string): string | null {
  if (fileType === 'html') {
    const ogMatch = rawContent.match(/<meta\s+(?:[^>]*?)property=["']og:image["'][^>]*?content=["']([^"']+)["']/i)
      || rawContent.match(/<meta\s+(?:[^>]*?)content=["']([^"']+)["'][^>]*?property=["']og:image["']/i);
    const twMatch = rawContent.match(/<meta\s+(?:[^>]*?)name=["']twitter:image["'][^>]*?content=["']([^"']+)["']/i)
      || rawContent.match(/<meta\s+(?:[^>]*?)content=["']([^"']+)["'][^>]*?name=["']twitter:image["']/i);
    const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    const rawCover = ogMatch?.[1] || twMatch?.[1] || imgMatch?.[1];
    if (rawCover) {
      if (rawCover.startsWith('data:')) return null;
      if (baseUrl) {
        try { return new URL(rawCover, baseUrl).href; } catch { return rawCover; }
      }
      return rawCover;
    }
  }

  if (fileType === 'markdown') {
    const mdImgMatch = rawContent.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdImgMatch?.[1]) {
      const url = mdImgMatch[1];
      if (url.startsWith('data:')) return null;
      return url;
    }
  }

  return null;
}

// ---- Main Entry ----

export interface ParseResult {
  text: string;
  title: string;
  isMarkdown: boolean;
  defaultSkipRewrite: boolean;
  rawContent: string;
}

const NO_REWRITE_EXTENSIONS = new Set(['.md', '.txt', '.html', '.htm']);

export async function parseFile(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const ext = path.extname(fileName).toLowerCase();
  const maxSize = TEXT_EXTENSIONS.has(ext) ? MAX_TEXT_SIZE : MAX_BINARY_SIZE;
  if (buffer.length > maxSize) {
    throw new Error(`文件过大: ${(buffer.length / 1024 / 1024).toFixed(1)}MB，${ext} 类型上限 ${maxSize === MAX_TEXT_SIZE ? '500KB' : '3MB'}`);
  }

  const type = detectFileType(fileName, buffer);
  let text = '';
  let isMarkdown = false;
  let rawContent = '';

  switch (type) {
    case 'MARKDOWN':
      text = buffer.toString('utf-8');
      isMarkdown = true;
      break;
    case 'HTML': {
      const rawHtml = buffer.toString('utf-8');
      const htmlResult = convertHtmlToMarkdown(rawHtml);
      text = htmlResult.markdown;
      if (htmlResult.pageTitle && !text.match(/^#\s+/m)) {
        text = `# ${htmlResult.pageTitle}\n\n${text}`;
      }
      rawContent = rawHtml;
      break;
    }
    case 'TXT':
      text = buffer.toString('utf-8');
      break;
    case 'PDF':
      text = await parsePdf(buffer);
      break;
    case 'WORD':
    case 'ODT':
    case 'RTF':
    case 'PPT':
      text = await parseOfficeFile(buffer, fileName);
      break;
    default:
      throw new Error(`不支持的文件类型: .${ext}，支持的格式: MD/HTML/PDF/DOC/DOCX/ODT/RTF/PPT/PPTX/TXT`);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`内容超过 ${MAX_TEXT_LENGTH} 字符上限 (当前 ${text.length})`);
  }
  if (!text.trim()) {
    throw new Error('文件解析后内容为空 (可能是图片型 PDF/扫描件)');
  }

  // Extract title: first # heading for MD, filename for others
  let title = path.parse(fileName).name;
  if (isMarkdown) {
    const headingMatch = text.match(/^#\s+(.+)$/m);
    if (headingMatch) title = headingMatch[1].trim();
  }

  const defaultSkipRewrite = NO_REWRITE_EXTENSIONS.has(ext);

  return { text, title, isMarkdown, defaultSkipRewrite, rawContent };
}
