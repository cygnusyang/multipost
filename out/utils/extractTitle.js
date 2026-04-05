"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTitle = extractTitle;
/**
 * Extract the first H1 heading as title from markdown
 */
function extractTitle(markdown) {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
}
//# sourceMappingURL=extractTitle.js.map