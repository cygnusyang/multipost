"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const processMarkdown_1 = require("./processMarkdown");
const mermaidRenderer_1 = require("./mermaidRenderer");
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
jest.mock('./mermaidRenderer');
describe('processMarkdownForUpload', () => {
    let mockWeChatService;
    beforeEach(() => {
        mockWeChatService = {
            uploadImage: jest.fn(),
        };
        jest.clearAllMocks();
    });
    it('should process simple markdown without mermaid to HTML', async () => {
        const markdown = '# Hello World\n\nThis is **bold** text.';
        const result = await (0, processMarkdown_1.processMarkdownForUpload)(markdown, mockWeChatService);
        expect(result.errors).toHaveLength(0);
        expect(result.html).toContain(markdown);
    });
    it('should leave mermaid block when upload fails', async () => {
        const markdown = '```mermaid\ngraph TD\nA[Start] --> B[End]\n```';
        mermaidRenderer_1.renderMermaidToBuffer.mockResolvedValue(Buffer.from(''));
        mockWeChatService.uploadImage.mockResolvedValue({
            success: false,
            error: 'Upload failed',
            cdnUrl: undefined,
        });
        const result = await (0, processMarkdown_1.processMarkdownForUpload)(markdown, mockWeChatService);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Failed to upload Mermaid diagram');
    });
    it('should replace mermaid block with image when upload succeeds', async () => {
        const markdown = '```mermaid\ngraph TD\nA[Start] --> B[End]\n```';
        mermaidRenderer_1.renderMermaidToBuffer.mockResolvedValue(Buffer.from(''));
        mockWeChatService.uploadImage.mockResolvedValue({
            success: true,
            cdnUrl: 'https://example.com/image.png',
        });
        const result = await (0, processMarkdown_1.processMarkdownForUpload)(markdown, mockWeChatService);
        expect(result.errors).toHaveLength(0);
        expect(result.html).toContain('![Mermaid diagram](https://example.com/image.png)');
    });
    it('should add error when mermaid rendering throws', async () => {
        const markdown = '```mermaid\ninvalid syntax\n```';
        mermaidRenderer_1.renderMermaidToBuffer.mockRejectedValue(new Error('Invalid syntax'));
        const result = await (0, processMarkdown_1.processMarkdownForUpload)(markdown, mockWeChatService);
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
        mermaidRenderer_1.renderMermaidToBuffer.mockResolvedValue(Buffer.from(''));
        mockWeChatService.uploadImage
            .mockResolvedValueOnce({ success: true, cdnUrl: 'https://example.com/1.png' })
            .mockResolvedValueOnce({ success: true, cdnUrl: 'https://example.com/2.png' });
        const result = await (0, processMarkdown_1.processMarkdownForUpload)(markdown, mockWeChatService);
        expect(result.errors).toHaveLength(0);
        expect(result.html).toContain('https://example.com/1.png');
        expect(result.html).toContain('https://example.com/2.png');
        expect(mockWeChatService.uploadImage).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=processMarkdown.test.js.map