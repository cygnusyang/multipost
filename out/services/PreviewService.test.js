"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const PreviewService_1 = require("./PreviewService");
const vscode = __importStar(require("vscode"));
describe('PreviewService', () => {
    let mockExtensionUri;
    beforeEach(() => {
        mockExtensionUri = vscode.Uri.file('/test/extension');
        jest.clearAllMocks();
    });
    it('should instantiate correctly', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        expect(service).toBeDefined();
        expect(service.getPanel()).toBeUndefined();
    });
    it('should open preview when no panel exists', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        const markdown = '# Test\n\nHello world';
        service.openPreview(markdown);
        expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
        expect(service.getPanel()).toBeDefined();
    });
    it('should reveal existing panel when opening preview again', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        const markdown = '# Test';
        service.openPreview(markdown);
        const panel = service.getPanel();
        const revealSpy = jest.spyOn(panel, 'reveal');
        service.openPreview(markdown);
        expect(revealSpy).toHaveBeenCalled();
        expect(service.getPanel()).toBe(panel); // Same instance
    });
    it('should clear panel reference when disposed', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        const markdown = '# Test';
        service.openPreview(markdown);
        expect(service.getPanel()).toBeDefined();
        // Get the onDidDispose callback and call it
        const panel = service.getPanel();
        const onDidDisposeSpy = panel.onDidDispose;
        const callback = onDidDisposeSpy.mock.calls[0][0];
        callback();
        expect(service.getPanel()).toBeUndefined();
    });
    it('should do nothing when updating content without panel', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        // Should not throw
        expect(() => service.updateContent('# Test')).not.toThrow();
    });
    it('should post update message when updating content with panel', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        const markdown = '# Test\n\nContent';
        service.openPreview(markdown);
        const panel = service.getPanel();
        // The postMessage is called from openPreview via updateContent
        expect(panel.webview.postMessage).toHaveBeenCalledWith({
            type: 'updateMarkdown',
            markdown,
        });
    });
    it('should do nothing when updating auth status without panel', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        // Should not throw
        expect(() => service.updateAuthStatus(true)).not.toThrow();
    });
    it('should post auth status when updating auth with panel', () => {
        const service = new PreviewService_1.PreviewService(mockExtensionUri);
        service.openPreview('# Test');
        service.updateAuthStatus(true, 'Test User');
        const panel = service.getPanel();
        expect(panel.webview.postMessage).toHaveBeenCalledWith({
            type: 'wechatAuthStatus',
            loggedIn: true,
            userName: 'Test User',
        });
    });
});
//# sourceMappingURL=PreviewService.test.js.map