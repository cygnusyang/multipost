"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultTheme_1 = require("./defaultTheme");
describe('defaultWechatTheme', () => {
    it('should export the default theme CSS', () => {
        expect(defaultTheme_1.defaultWechatTheme).toBeDefined();
        expect(typeof defaultTheme_1.defaultWechatTheme).toBe('string');
        expect(defaultTheme_1.defaultWechatTheme.length).toBeGreaterThan(0);
        expect(defaultTheme_1.defaultWechatTheme).toContain('body');
        expect(defaultTheme_1.defaultWechatTheme).toContain('Headings');
    });
});
//# sourceMappingURL=defaultTheme.test.js.map