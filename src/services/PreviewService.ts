import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class PreviewService {
  private jsFileName: string | undefined;
  private cssFileName: string | undefined;
  private panel: vscode.WebviewPanel | undefined;
  private extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
    this.findAssetFiles();
  }

  openPreview(markdown: string): void {
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'wechatPreview',
        'WeChat Preview',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media', 'webview')],
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.panel.webview.html = this.getWebviewContent();
    this.updateContent(markdown);
  }

  updateContent(markdown: string): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.postMessage({
      type: 'updateMarkdown',
      markdown: markdown,
    });
  }

  updateAuthStatus(isLoggedIn: boolean, userName?: string): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.postMessage({
      type: 'wechatAuthStatus',
      loggedIn: isLoggedIn,
      userName: userName,
    });
  }

  getPanel(): vscode.WebviewPanel | undefined {
    return this.panel;
  }

  private findAssetFiles(): void {
    const assetsPath = path.join(
      this.extensionUri.fsPath,
      'media',
      'webview',
      'assets'
    );

    if (fs.existsSync(assetsPath)) {
      const files = fs.readdirSync(assetsPath);
      this.jsFileName = files.find(f => f.startsWith('main-') && f.endsWith('.js'));
      this.cssFileName = files.find(f => f.startsWith('main-') && f.endsWith('.css'));
    }
  }

  private getWebviewContent(): string {
    const webview = this.panel!.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'assets', this.jsFileName || 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'assets', this.cssFileName || 'main.css')
    );

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
