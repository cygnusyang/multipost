import { extractTitle } from 'src/utils/extractTitle';

describe('extractTitle', () => {
  it('should extract title from first H1 heading', () => {
    const markdown = `# Hello World

This is some content.
`;
    const result = extractTitle(markdown);
    expect(result).toBe('Hello World');
  });

  it('should trim whitespace from title', () => {
    const markdown = `#   My Title   \n\nContent`;
    const result = extractTitle(markdown);
    expect(result).toBe('My Title');
  });

  it('should return null when no H1 heading exists', () => {
    const markdown = `## Second Level\n\nNo H1 here.`;
    const result = extractTitle(markdown);
    expect(result).toBeNull();
  });

  it('should find H1 at beginning of line with markdown content', () => {
    const markdown = `Some text before\n# Title Here\nSome text after`;
    const result = extractTitle(markdown);
    expect(result).toBe('Title Here');
  });

  it('should return null for empty string', () => {
    const result = extractTitle('');
    expect(result).toBeNull();
  });

  it('should return null for string without H1', () => {
    const markdown = 'Just some text without headings';
    const result = extractTitle(markdown);
    expect(result).toBeNull();
  });

  it('should extract title with multiple spaces after #', () => {
    const markdown = '#     Multiple Spaces\n\nContent';
    const result = extractTitle(markdown);
    expect(result).toBe('Multiple Spaces');
  });

  it('should extract title with special characters', () => {
    const markdown = '# Special Characters: @#$%^&*()\n\nContent';
    const result = extractTitle(markdown);
    expect(result).toBe('Special Characters: @#$%^&*()');
  });

  it('should extract title with Chinese characters', () => {
    const markdown = '# 中文标题\n\n内容';
    const result = extractTitle(markdown);
    expect(result).toBe('中文标题');
  });

  it('should extract title with emojis', () => {
    const markdown = '# 🎉 Emoji Title 🚀\n\nContent';
    const result = extractTitle(markdown);
    expect(result).toBe('🎉 Emoji Title 🚀');
  });

  it('should extract title that includes inline markdown', () => {
    const markdown = '# Title with **bold** and *italic*\n\nContent';
    const result = extractTitle(markdown);
    expect(result).toBe('Title with **bold** and *italic*');
  });

  it('should extract title with numbers', () => {
    const markdown = '# 123. Title with numbers\n\nContent';
    const result = extractTitle(markdown);
    expect(result).toBe('123. Title with numbers');
  });

  it('should extract title with underscores and dashes', () => {
    const markdown = '# Title_with-underscores_and-dashes\n\nContent';
    const result = extractTitle(markdown);
    expect(result).toBe('Title_with-underscores_and-dashes');
  });

  it('should return first H1 when multiple H1s exist', () => {
    const markdown = `# First Title\n\nContent\n\n# Second Title\n\nMore content`;
    const result = extractTitle(markdown);
    expect(result).toBe('First Title');
  });

  it('should ignore H2, H3, etc.', () => {
    const markdown = `## Not a H1\n\n### Also not a H1\n\nContent`;
    const result = extractTitle(markdown);
    expect(result).toBeNull();
  });

  it('should find H1 after some empty lines', () => {
    const markdown = `\n\n\n# Title after empty lines\n\nContent`;
    const result = extractTitle(markdown);
    expect(result).toBe('Title after empty lines');
  });

  it('should handle H1 at the end of markdown', () => {
    const markdown = `Content before\n\n# Title at end`;
    const result = extractTitle(markdown);
    expect(result).toBe('Title at end');
  });
});
