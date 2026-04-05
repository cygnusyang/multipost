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
exports.PreviewService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PreviewService {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.findAssetFiles();
    }
    openPreview(markdown) {
        if (this.panel) {
            this.panel.reveal();
        }
        else {
            this.panel = vscode.window.createWebviewPanel('wechatPreview', 'WeChat Preview', vscode.ViewColumn.Beside, {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media', 'webview')],
            });
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
        this.panel.webview.html = this.getWebviewContent();
        this.updateContent(markdown);
    }
    updateContent(markdown) {
        if (!this.panel) {
            return;
        }
        this.panel.webview.postMessage({
            type: 'updateMarkdown',
            markdown: markdown,
        });
    }
    updateAuthStatus(isLoggedIn, userName) {
        if (!this.panel) {
            return;
        }
        this.panel.webview.postMessage({
            type: 'wechatAuthStatus',
            loggedIn: isLoggedIn,
            userName: userName,
        });
    }
    getPanel() {
        return this.panel;
    }
    findAssetFiles() {
        const assetsPath = path.join(this.extensionUri.fsPath, 'media', 'webview', 'assets');
        if (fs.existsSync(assetsPath)) {
            const files = fs.readdirSync(assetsPath);
            this.jsFileName = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
            this.cssFileName = files.find(f => f.startsWith('main-') && f.endsWith('.css'));
        }
    }
    getWebviewContent() {
        const webview = this.panel.webview;
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'assets', this.jsFileName || 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'assets', this.cssFileName || 'main.css'));
        return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WeChat Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${scriptUri}"></script>
  </body>
</html>`;
    }
}
exports.PreviewService = PreviewService;
//# sourceMappingURL=PreviewService.js.map