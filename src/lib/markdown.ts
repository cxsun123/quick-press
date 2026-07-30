import { markdownToHtml } from '@chengxinsun26/editor';

export { markdownToHtml };

export function renderMarkdown(markdown: string): string {
  const fixed = markdown.replace(/\\(`)/g, '$1');
  return markdownToHtml(fixed);
}
