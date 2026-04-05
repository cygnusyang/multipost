"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSDOM = void 0;
exports.JSDOM = jest.fn(() => ({
    window: {},
    document: {
        createElement: jest.fn(),
    },
    navigator: {},
}));
//# sourceMappingURL=jsdom.js.map