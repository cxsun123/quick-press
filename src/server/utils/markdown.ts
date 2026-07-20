import 'server-only';

export function extractImages(content: string): string[] {
  const urls: string[] = [];
  const regex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1].trim();
    if (url) urls.push(url);
  }
  return urls;
}
