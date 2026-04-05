import { Processor, Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

interface MermaidNode extends Node {
  type: 'code';
  lang?: string;
  value: string;
}

interface Options {
  renderInPreview: boolean;
}

export const remarkMermaid: Plugin<[Options?]> = (options = { renderInPreview: true }) => {
  return (tree: Node) => {
    visit(tree, 'code', (node: MermaidNode) => {
      if (node.lang === 'mermaid' && options.renderInPreview) {
        // For preview, we'll keep it as a code block
        // In the extension backend, we render to PNG and upload
        node.type = 'paragraph';
        node.children = [{
          type: 'text',
          value: `[Mermaid diagram: ${node.value.slice(0, 30)}...]`
        }];
      }
    });
  };
};
