import { processMarkdownForUpload } from 'src/utils/processMarkdown';
import { WeChatService } from 'src/services/WeChatService';
import { renderMermaidToBuffer } from 'src/utils/mermaidRenderer';

// Mock all the unified/remark dependencies since they are ES modules
// and cause issues with Jest
jest.mock('unified', () => ({
  unified: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn(async (markdown) => ({
      toString: () => `<html>${String(markdown)}</html>`,
    })),
  })),
}));

jest.mock('remark-parse', () => jest.fn());
jest.mock('remark-gfm', () => jest.fn());
jest.mock('remark-rehype', () => jest.fn());
jest.mock('rehype-highlight', () => jest.fn());
jest.mock('rehype-stringify', () => jest.fn());

// Mock mermaid renderer
jest.mock('src/utils/mermaidRenderer');

describe('processMarkdownForUpload', () => {
  let mockWeChatService: jest.Mocked<WeChatService>;

  beforeEach(() => {
    mockWeChatService = {
      uploadImage: jest.fn(),
    } as unknown as jest.Mocked<WeChatService>;
    jest.clearAllMocks();
  });

  it('should process simple markdown without mermaid to HTML', async () => {
    const markdown = '# Hello World\n\nThis is **bold** text.';
    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain(markdown);
  });

  it('should leave mermaid block when upload fails', async () => {
    const markdown = '```mermaid\ngraph TD\nA[Start] --> B[End]\n```';

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: false,
      error: 'Upload failed',
      cdnUrl: undefined,
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Failed to upload Mermaid diagram');
  });

  it('should replace mermaid block with image when upload succeeds', async () => {
    const markdown = '```mermaid\ngraph TD\nA[Start] --> B[End]\n```';

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: true,
      cdnUrl: 'https://example.com/image.png',
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('![Mermaid diagram](https://example.com/image.png)');
  });

  it('should add error when mermaid rendering throws', async () => {
    const markdown = '```mermaid\ninvalid syntax\n```';

    (renderMermaidToBuffer as jest.Mock).mockRejectedValue(new Error('Invalid syntax'));

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Failed to render Mermaid diagram: Invalid syntax');
  });

  it('should process multiple mermaid blocks', async () => {
    const markdown = `
# Test

First diagram:
\`\`\`mermaid
graph TD
A --> B
\`\`\`

Second diagram:
\`\`\`mermaid
graph LR
X --> Y
\`\`\`
`;

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage
      .mockResolvedValueOnce({ success: true, cdnUrl: 'https://example.com/1.png' })
      .mockResolvedValueOnce({ success: true, cdnUrl: 'https://example.com/2.png' });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('https://example.com/1.png');
    expect(result.html).toContain('https://example.com/2.png');
    expect(mockWeChatService.uploadImage).toHaveBeenCalledTimes(2);
  });

  it('should handle mixed mermaid and markdown content', async () => {
    const markdown = `# Title

Some text before.

\`\`\`mermaid
graph TD
A --> B
\`\`\`

Some text between diagrams.

\`\`\`mermaid
graph LR
X --> Y
\`\`\`

Some text after.
`;

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage
      .mockResolvedValueOnce({ success: true, cdnUrl: 'https://example.com/1.png' })
      .mockResolvedValueOnce({ success: true, cdnUrl: 'https://example.com/2.png' });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('Some text before');
    expect(result.html).toContain('Some text between diagrams');
    expect(result.html).toContain('Some text after');
  });

  it('should handle mermaid block with complex syntax', async () => {
    const markdown = `\`\`\`mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Internal loop
    end
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
\`\`\`
`;

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: true,
      cdnUrl: 'https://example.com/sequence.png',
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('https://example.com/sequence.png');
  });

  it('should handle empty mermaid block', async () => {
    const markdown = '```mermaid\n\n```';

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: true,
      cdnUrl: 'https://example.com/empty.png',
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('https://example.com/empty.png');
  });

  it('should handle mermaid block with only whitespace', async () => {
    const markdown = '```mermaid\n   \n   \n```';

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: true,
      cdnUrl: 'https://example.com/whitespace.png',
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('https://example.com/whitespace.png');
  });

  it('should handle mermaid upload error with no error message', async () => {
    const markdown = '```mermaid\ngraph TD\nA --> B\n```';

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: false,
      error: undefined,
      cdnUrl: undefined,
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Failed to upload Mermaid diagram');
  });

  it('should process markdown without mermaid blocks', async () => {
    const markdown = `# Regular Markdown

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

[Link text](https://example.com)
`;

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('Regular Markdown');
    expect(renderMermaidToBuffer as jest.Mock).not.toHaveBeenCalled();
  });

  it('should handle mermaid at the end of markdown', async () => {
    const markdown = `# Title

Content before mermaid.

\`\`\`mermaid
graph TD
A --> B
\`\`\`
`;

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: true,
      cdnUrl: 'https://example.com/end.png',
    });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('Content before mermaid');
    expect(result.html).toContain('https://example.com/end.png');
  });

  it('should handle mermaid at the beginning of markdown', async () => {
    const markdown = `\`\`\`mermaid
graph TD
A --> B
\`\`\`

Content after mermaid.
`;

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage.mockResolvedValue({
      success: true,
      cdnUrl: 'https://example.com/beginning.png',
    });

    const result = await
processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(0);
    expect(result.html).toContain('Content after mermaid');
    expect(result.html).toContain('https://example.com/beginning.png');
  });

  it('should accumulate errors from multiple failed mermaid blocks', async () => {
    const markdown = `\`\`\`mermaid
graph TD
A --> B
\`\`\`

\`\`\`mermaid
graph LR
X --> Y
\`\`\`
`;

    (renderMermaidToBuffer as jest.Mock).mockResolvedValue(Buffer.from(''));
    mockWeChatService.uploadImage
      .mockResolvedValueOnce({ success: false, error: 'Error 1', cdnUrl: undefined })
      .mockResolvedValueOnce({ success: false, error: 'Error 2', cdnUrl: undefined });

    const result = await processMarkdownForUpload(markdown, mockWeChatService);

    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('Error 1');
    expect(result.errors[1]).toContain('Error 2');
  });
});
