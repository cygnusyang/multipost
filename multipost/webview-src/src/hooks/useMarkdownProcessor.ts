import { useState, useCallback } from 'react';
import { unified } from 'unified';
import parse from 'remark-parse';
import gfm from 'remark-gfm';
import { remarkMermaid } from '../plugins/remarkMermaid';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { defaultWechatTheme } from '../themes/default';

export const useMarkdownProcessor = () => {
  const [processedHtml, setProcessedHtml] = useState('');

  const processMarkdown = useCallback(async (markdown: string) => {
    try {
      const file = await unified()
        .use(parse)
        .use(gfm)
        .use(remarkMermaid, {
          // Mermaid will be processed in extension backend for upload
          // For preview, we'll keep it as code
          renderInPreview: true
        })
        .use(remarkRehype)
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .process(markdown);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${defaultWechatTheme}
</style>
</head>
<body>
${String(file)}
</body>
</html>
      `;

      setProcessedHtml(htmlContent.trim());
    } catch (error) {
      console.error('Failed to process markdown:', error);
      setProcessedHtml(`<pre>Error processing markdown: ${(error as Error).message}</pre>`);
    }
  }, []);

  return { processedHtml, processMarkdown };
};
