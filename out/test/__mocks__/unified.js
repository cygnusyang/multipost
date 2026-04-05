"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unified = unified;
// Simple mock for unified
function unified() {
    return {
        use: jest.fn().mockReturnThis(),
        process: jest.fn(async () => ({
            toString: () => '<html></html>',
        })),
    };
}
exports.default = unified;
//# sourceMappingURL=unified.js.map