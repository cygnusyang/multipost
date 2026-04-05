import * as vscode from 'vscode';
import { WeChatService } from './services/WeChatService';
import { PreviewService } from './services/PreviewService';
import { SettingsService } from './services/SettingsService';
import { extractTitle } from './utils/extractTitle';
import { processMarkdownForUpload } from './utils/processMarkdown';

let weChatService: WeChatService;
let previewService: PreviewService;
let settingsService: SettingsService;
let outputChannel: vscode.OutputChannel;

function log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (outputChannel) {
    outputChannel.appendLine(logMessage);
  }

  if (level === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('MultiPost');
  context.subscriptions.push(outputChannel);

  log('=== Starting MultiPost extension activation ===');

  try {
    log('Step 1: Initializing services...');
    // Initialize services
    weChatService = new WeChatService(context.secrets);
    previewService = new PreviewService(context.extensionUri);
    settingsService = new SettingsService(context);
    log('Services initialized successfully');

    // Load saved auth
    log('Step 2: Loading saved authentication from storage...');
    await weChatService.loadAuthFromStorage();
    log('Saved auth loaded');

    log('Step 3: Registering commands...');
    // Register commands
    let disposable = vscode.commands.registerCommand(
      'wechat-publisher.preview',
      () => {
        log('Command invoked: wechat-publisher.preview');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage('No active editor');
          log('Error: No active editor', 'error');
          return;
        }
        const markdown = editor.document.getText();
        log(`Got markdown from editor: ${markdown.length} characters`);
        previewService.openPreview(markdown);
        updatePreviewAuthStatus();
        log('Preview opened successfully');
      }
    );
    context.subscriptions.push(disposable);
    log('Command registered: wechat-publisher.preview');

    disposable = vscode.commands.registerCommand(
      'wechat-publisher.loginWeChat',
      async () => {
        log('Command invoked: wechat-publisher.loginWeChat');
        const panel = vscode.window.createWebviewPanel(
          'wechatLogin',
          'WeChat Login',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
          }
        );

        panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WeChat Login</title>
  <style>
    body { margin: 0; padding: 16px; }
    .container { max-width: 400px; margin: 0 auto; text-align: center; }
    h2 { margin-bottom: 16px; }
    p { color: #666; }
    iframe { width: 100%; height: 600px; border: 1px solid #eee; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Scan QR Code to Login</h2>
    <p>Please scan the QR code below using WeChat to login</p>
    <iframe src="https://mp.weixin.qq.com/"></iframe>
  </div>
</body>
</html>
      `;

        // After login, check auth
        panel.onDidDispose(async () => {
          log('Login window closed, checking authentication...');
          const result = await weChatService.checkAuth();
          if (result.isAuthenticated) {
            vscode.window.showInformationMessage(`Logged in as ${result.authInfo?.nickName}`);
            log(`Login successful for user: ${result.authInfo?.nickName}`);
            updatePreviewAuthStatus();
          } else {
            vscode.window.showErrorMessage('Login failed. Please try again.');
            log('Login check failed', 'error');
          }
        });
      }
    );
    context.subscriptions.push(disposable);
    log('Command registered: wechat-publisher.loginWeChat');

    disposable = vscode.commands.registerCommand(
      'wechat-publisher.logoutWeChat',
      async () => {
        log('Command invoked: wechat-publisher.logoutWeChat');
        weChatService.clearAuth();
        vscode.window.showInformationMessage('Logged out from WeChat');
        updatePreviewAuthStatus();
        log('User logged out successfully');
      }
    );
    context.subscriptions.push(disposable);
    log('Command registered: wechat-publisher.logoutWeChat');

    disposable = vscode.commands.registerCommand(
      'wechat-publisher.uploadToWeChat',
      async () => {
        log('Command invoked: wechat-publisher.uploadToWeChat');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage('No active editor');
          log('Error: No active editor', 'error');
          return;
        }

        const authInfo = weChatService.getAuthInfo();
        if (!authInfo) {
          vscode.window.showErrorMessage('Not logged in. Please login first.');
          log('Error: Not authenticated, prompting login', 'error');
          await vscode.commands.executeCommand('wechat-publisher.loginWeChat');
          return;
        }

        log(`User authenticated: ${authInfo.nickName}`);

        // Check auth is still valid
        log('Checking if authentication is still valid...');
        const authCheck = await weChatService.checkAuth();
        if (!authCheck.isAuthenticated) {
          vscode.window.showErrorMessage('Authentication expired. Please login again.');
          log('Error: Authentication expired', 'error');
          return;
        }

        const markdown = editor.document.getText();
        const fileName = editor.document.fileName;
        const title = extractTitle(markdown) || fileName.split('/').pop()?.replace(/\.md$/, '') || 'Untitled';
        log(`Extracted title: "${title}", markdown length: ${markdown.length} characters`);

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Uploading to WeChat...',
            cancellable: false,
          },
          async () => {
            try {
              log('Starting markdown processing and upload...');
              const { html, errors } = await processMarkdownForUpload(markdown, weChatService);
              if (errors.length > 0) {
                vscode.window.showWarningMessage(`Upload completed with ${errors.length} errors: ${errors[0]}`);
                log(`Warnings during processing: ${errors.length} errors`, 'warn');
                errors.forEach(err => log(`  - ${err}`, 'warn'));
              }

              const author = settingsService.getDefaultAuthor() || authInfo.nickName || '';
              const digest = html.replace(/<[^>]*>/g, '').slice(0, 120);
              log(`Processing complete: HTML length = ${html.length} characters, author = "${author}"`);

              const result = await weChatService.createDraft(title, author, html, digest);

              if (result.success && result.draftUrl) {
                vscode.window.showInformationMessage('Draft created successfully!');
                log(`Draft created successfully: ${result.draftUrl}`);
                if (settingsService.shouldAutoOpenDraft()) {
                  await vscode.env.openExternal(vscode.Uri.parse(result.draftUrl));
                  log('Opening draft in browser');
                }
              } else {
                vscode.window.showErrorMessage(`Upload failed: ${result.error}`);
                log(`Upload failed: ${result.error}`, 'error');
              }
            } catch (error) {
              vscode.window.showErrorMessage(`Upload failed: ${(error as Error).message}`);
              log(`Unexpected error during upload: ${(error as Error).message}`, 'error');
              if (error instanceof Error && error.stack) {
                log(`Stack trace: ${error.stack}`, 'error');
              }
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);
    log('Command registered: wechat-publisher.uploadToWeChat');

    log('All commands registered successfully');

    // Listen for messages from webview
    const panel = previewService.getPanel();
    if (panel) {
      panel.webview.onDidReceiveMessage(
        async (message) => {
          log(`Received message from preview webview: ${message.type}`);
          if (message.type === 'uploadToWeChat') {
            await vscode.commands.executeCommand('wechat-publisher.uploadToWeChat');
          } else if (message.type === 'copyHtml') {
            await vscode.env.clipboard.writeText(message.html);
            vscode.window.showInformationMessage('HTML copied to clipboard');
            log('HTML copied to clipboard');
          }
        },
        undefined,
        context.subscriptions
      );
    }

    log('=== MultiPost extension activation completed successfully ===');
  } catch (error) {
    const errorMsg = (error as Error).message;
    const errorStack = error instanceof Error && error.stack ? error.stack : 'No stack trace';

    log(`=== MultiPost extension activation FAILED ===`, 'error');
    log(`Error message: ${errorMsg}`, 'error');
    log(`Stack trace: ${errorStack}`, 'error');

    console.error('Failed to activate extension:', error);
    vscode.window.showErrorMessage(`Failed to activate MultiPost: ${errorMsg}`);
    outputChannel.show(true);
    throw error;
  }
}

function updatePreviewAuthStatus(): void {
  const authInfo = weChatService.getAuthInfo();
  previewService.updateAuthStatus(!!authInfo, authInfo?.nickName);
}

export function deactivate() {}
