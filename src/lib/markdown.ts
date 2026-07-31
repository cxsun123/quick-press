import { markdownToHtml } from '@chengxinsun26/editor';

export { markdownToHtml };

export function renderMarkdown(markdown: string): string {
  let cleaned = markdown;

  // Strip backslash-escaped backticks (editor serialization artifact)
  cleaned = cleaned.replace(/\\(`)/g, '$1');

  // Strip math placeholders embedded in the content from editor round-trips.
  // When present inside fenced code blocks they'd show as visible HTML text.
  cleaned = cleaned
    .replace(/<span\s+data-type="inline-math"\s+data-latex="[^"]*"\s*><\/span>/g, '')
    .replace(/<div\s+data-type="block-math"\s+data-latex="[^"]*"\s*><\/div>/g, '');

  return markdownToHtml(cleaned);
}
