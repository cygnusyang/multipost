"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMermaidToBuffer = renderMermaidToBuffer;
const node_fetch_1 = __importDefault(require("node-fetch"));
const buffer_1 = require("buffer");
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [mermaid] ${message}`;
    if (level === 'error') {
        console.error(logMessage);
    }
    else {
        console.log(logMessage);
    }
}
/**
 * Mermaid diagram types for identification
 */
const mermaidTypes = [
    'erDiagram',
    'graph TD',
    'graph LR',
    'graph RL',
    'graph BT',
    'flowchart TD',
    'flowchart LR',
    'flowchart RL',
    'flowchart BT',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'pie title',
    'gantt'
];
/**
 * Check if the given text is a Mermaid diagram
 */
function isMermaidDiagram(text) {
    const trimmed = text.trim();
    return mermaidTypes.some(type => trimmed.startsWith(type));
}
/**
 * Render Mermaid diagram using mermaid.ink service
 */
async function renderMermaidToBuffer(code) {
    log(`Rendering mermaid diagram, code length: ${code.length} characters`);
    // Check if it's a valid Mermaid diagram
    if (!isMermaidDiagram(code)) {
        log(`Not a valid Mermaid diagram: ${code.substring(0, 30)}...`, 'error');
        throw new Error('Invalid Mermaid diagram');
    }
    try {
        // Encode Mermaid code for API call
        const encodedCode = buffer_1.Buffer.from(code).toString('base64');
        log(`Encoded Mermaid code: ${encodedCode.substring(0, 50)}...`);
        // Build the mermaid.ink URL
        const mermaidUrl = `https://mermaid.ink/img/${encodedCode}`;
        log(`Requesting Mermaid diagram from: ${mermaidUrl}`);
        // Make API call to render diagram
        const response = await (0, node_fetch_1.default)(mermaidUrl);
        if (!response) {
            log('No response received from Mermaid.ink API', 'error');
            throw new Error('No response from Mermaid API');
        }
        if (!response.ok) {
            log(`Mermaid.ink API returned error status: ${response.status}`, 'error');
            throw new Error(`Mermaid API failed with status ${response.status}`);
        }
        // Get the image data
        const arrayBuffer = await response.arrayBuffer();
        const buffer = buffer_1.Buffer.from(arrayBuffer);
        log(`Mermaid diagram rendered successfully, buffer size: ${buffer.length} bytes`);
        return buffer;
    }
    catch (error) {
        log(`Mermaid render error: ${error.message}`, 'error');
        if (error instanceof Error && error.stack) {
            log(`Stack trace: ${error.stack}`, 'error');
        }
        throw error;
    }
}
//# sourceMappingURL=mermaidRenderer.js.map