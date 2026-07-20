import { registerPlugin } from './registry';

registerPlugin({
  id: 'reading-time',
  name: '阅读时间',
  description: '显示文章预计阅读时间',
  version: '1.0.0',

  onPostDisplay: (post) => {
    const wordsPerMinute = 300;
    const wordCount = post.content.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    const timeStr = `预计阅读时间：${minutes} 分钟`;

    return {
      ...post,
      content: `<!-- ${timeStr} -->\n\n${post.content}`,
    };
  },
});
