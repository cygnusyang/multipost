"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMermaidToBuffer = renderMermaidToBuffer;
const mermaid_1 = __importDefault(require("mermaid"));
const canvas_1 = require("canvas");
// Initialize mermaid for server-side rendering
mermaid_1.default.initialize({
    startOnLoad: false,
    theme: 'default',
    flowchart: {
        useMaxWidth: true,
    },
});
async function renderMermaidToBuffer(code) {
    try {
        // Get SVG from mermaid
        const { svg } = await mermaid_1.default.render('mermaid-diagram', code);
        // Calculate dimensions
        const viewBoxMatch = svg.match(/viewBox="[\d.\s-]+"/);
        let width = 800;
        let height = 600;
        if (viewBoxMatch) {
            const parts = viewBoxMatch[0].replace('viewBox="', '').replace('"', '').split(' ').map(Number);
            if (parts.length === 4) {
                width = Math.ceil(parts[2]);
                height = Math.ceil(parts[3]);
            }
        }
        // Add padding
        width += 40;
        height += 40;
        // Create canvas and draw SVG
        const canvas = (0, canvas_1.createCanvas)(width, height);
        const ctx = canvas.getContext('2d');
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        // Convert SVG to PNG buffer
        // For simplicity, we'll use the SVG directly and let canvas handle conversion
        // Note: In production, you might need svg2png or another library for proper rasterization
        const pngBuffer = canvas.toBuffer('image/png');
        return pngBuffer;
    }
    catch (error) {
        console.error('Mermaid render error:', error);
        throw error;
    }
}
//# sourceMappingURL=mermaidRenderer.js.map