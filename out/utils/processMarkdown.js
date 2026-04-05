"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMarkdownForUpload = processMarkdownForUpload;
const unified_1 = require("unified");
const remark_parse_1 = __importDefault(require("remark-parse"));
const remark_gfm_1 = __importDefault(require("remark-gfm"));
const remark_rehype_1 = __importDefault(require("remark-rehype"));
const rehype_highlight_1 = __importDefault(require("rehype-highlight"));
const rehype_stringify_1 = __importDefault(require("rehype-stringify"));
const mermaidRenderer_1 = require("./mermaidRenderer");
/**
 * Process markdown for upload to WeChat, including Mermaid diagram rendering
 */
async function processMarkdownForUpload(markdown, weChatService) {
    const errors = [];
    // Process mermaid blocks before unified processing
    const processedMarkdown = await processMermaidBlocks(markdown, weChatService, errors);
    const processor = (0, unified_1.unified)()
        .use(remark_parse_1.default)
        .use(remark_gfm_1.default)
        .use(remark_rehype_1.default)
        .use(rehype_highlight_1.default)
        .use(rehype_stringify_1.default);
    const file = await processor.process(processedMarkdown);
    const html = String(file);
    return { html, errors };
}
/**
 * Find and process all mermaid code blocks, render them and upload them
 */
async function processMermaidBlocks(markdown, weChatService, errors) {
    // Find all mermaid code blocks
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
    let processed = markdown;
    let match;
    while ((match = mermaidRegex.exec(markdown)) !== null) {
        const mermaidCode = match[1];
        try {
            const buffer = await (0, mermaidRenderer_1.renderMermaidToBuffer)(mermaidCode);
            const result = await weChatService.uploadImage(buffer, `mermaid-${Date.now()}.png`);
            if (result.success && result.cdnUrl) {
                // Replace code block with image
                processed = processed.replace(match[0], `![Mermaid diagram](${result.cdnUrl})`);
            }
            else {
                errors.push(`Failed to upload Mermaid diagram: ${result.error}`);
            }
        }
        catch (error) {
            errors.push(`Failed to render Mermaid diagram: ${error.message}`);
        }
    }
    return processed;
}
//# sourceMappingURL=processMarkdown.js.map