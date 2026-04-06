import fetch from 'node-fetch';
import { Buffer } from 'buffer';

function log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [mermaid] ${message}`;
  if (level === 'error') {
    console.error(logMessage);
  } else {
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
function isMermaidDiagram(text: string): boolean {
  const trimmed = text.trim();
  return mermaidTypes.some(type => trimmed.startsWith(type));
}

/**
 * Render Mermaid diagram using mermaid.ink service
 */
export async function renderMermaidToBuffer(code: string): Promise<Buffer> {
  log(`Rendering mermaid diagram, code length: ${code.length} characters`);

  // Check if it's a valid Mermaid diagram
  if (!isMermaidDiagram(code)) {
    log(`Not a valid Mermaid diagram: ${code.substring(0, 30)}...`, 'error');
    throw new Error('Invalid Mermaid diagram');
  }

  try {
    // Encode Mermaid code for API call
    const encodedCode = Buffer.from(code).toString('base64');
    log(`Encoded Mermaid code: ${encodedCode.substring(0, 50)}...`);

    // Build the mermaid.ink URL
    const mermaidUrl = `https://mermaid.ink/img/${encodedCode}`;
    log(`Requesting Mermaid diagram from: ${mermaidUrl}`);

    // Make API call to render diagram
    const response = await fetch(mermaidUrl);

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
    const buffer = Buffer.from(arrayBuffer);
    log(`Mermaid diagram rendered successfully, buffer size: ${buffer.length} bytes`);

    return buffer;
  } catch (error) {
    log(`Mermaid render error: ${(error as Error).message}`, 'error');
    if (error instanceof Error && error.stack) {
      log(`Stack trace: ${error.stack}`, 'error');
    }
    throw error;
  }
}
