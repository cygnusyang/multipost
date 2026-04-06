import * as vscode from 'vscode';
import { WeChatService } from './services/WeChatService';
import { SettingsService } from './services/SettingsService';
import { PlaywrightService } from './services/PlaywrightService';
import { extractTitle } from './utils/extractTitle';

let weChatService: WeChatService;
let settingsService: SettingsService;
let playwrightService: PlaywrightService;
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
  log(`Extension context: ${JSON.stringify({
    extensionPath: context.extensionPath,
    subscriptionsCount: context.subscriptions.length,
    extensionUri: context.extensionUri.toString()
  })}`);

  try {
    log('Step 1: Initializing services...');
    // Initialize services
    weChatService = new WeChatService(context.secrets, outputChannel);
    settingsService = new SettingsService(context);
    const storagePath = context.globalStorageUri?.fsPath || context.extensionPath;
    playwrightService = new PlaywrightService(outputChannel, storagePath);
    log('Services initialized successfully');

    log('Step 2: Registering commands...');
    log(`Available vscode.commands: ${typeof vscode.commands}`);
    
    // Register commands
    let disposable = vscode.commands.registerCommand(
      'multipost.logoutWeChat',
      async () => {
        log('Command invoked: multipost.logoutWeChat');
        weChatService.clearAuth();
        vscode.window.showInformationMessage('Logged out from MultiPost');
        log('User logged out successfully');
      }
    );
    context.subscriptions.push(disposable);
    log('Command registered: multipost.logoutWeChat');

    // Register Playwright-based upload command as the main command
    disposable = vscode.commands.registerCommand(
      'multipost.uploadToWeChat',
      async () => {
        log('Command invoked: multipost.uploadToWeChat (Playwright Automated Upload)');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage('No active editor');
          log('Error: No active editor', 'error');
          return;
        }

        const markdown = editor.document.getText();
        const fileName = editor.document.fileName;
        const title = extractTitle(markdown) || fileName.split('/').pop()?.replace(/\.md$/, '') || 'Untitled';
        log(`Extracted title: "${title}", markdown length: ${markdown.length} characters`);

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Starting Playwright automated upload...',
            cancellable: false,
          },
          async (progress) => {
            await handlePlaywrightFullAutomatedUpload(markdown, title, progress);
          }
        );
      }
    );
    context.subscriptions.push(disposable);
    log('Command registered: multipost.uploadToWeChatPlaywright');

    log('All commands registered successfully');

    log('Step 3: Loading saved authentication from storage in background...');
    void weChatService.loadAuthFromStorage().then(() => {
      log('Saved auth loaded');
    }).catch((error) => {
      log(`Background auth load failed: ${(error as Error).message}`, 'warn');
    });

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


/**
 * Process markdown content and get HTML ready for upload
 * Handles mermaid diagram rendering and image uploading
 */
async function processMarkdownContent(
  markdown: string
): Promise<{ html: string; errors: string[] }> {
  log('Starting markdown processing...');
  const processMarkdownModule = await import('./utils/processMarkdown');
  const { processMarkdownForUpload } = processMarkdownModule;
  const result = await processMarkdownForUpload(markdown, weChatService);

  if (result.errors.length > 0) {
    vscode.window.showWarningMessage(`Processing completed with ${result.errors.length} errors: ${result.errors[0]}`);
    log(`Warnings during processing: ${result.errors.length} errors`, 'warn');
    result.errors.forEach(err => log(`  - ${err}`, 'warn'));
  }

  return result;
}

/**
 * Handle fully automated Playwright upload workflow:
 * - Ensure authenticated (login if needed)
 * - Process markdown (render mermaid, upload images)
 * - Create draft in browser via Playwright automation
 */
async function handlePlaywrightFullAutomatedUpload(
  markdown: string,
  title: string,
  progress: vscode.Progress<{ message?: string }>
): Promise<void> {
  try {
    log('Starting Playwright upload workflow');

    // Step 1: Process markdown (render mermaid, upload images)
    progress.report({ message: 'Processing markdown...' });
    const { html } = await processMarkdownContent(markdown);

    // Step 2: Create draft directly in browser via Playwright automation
    progress.report({ message: 'Creating draft in Chrome (Playwright)...' });

    // Check if we need to login
    if (!playwrightService.isSessionActive()) {
      progress.report({ message: 'Waiting for QR code scan...' });
      await playwrightService.startFirstTimeLogin();
    }

    // Create draft
    const draftUrl = await playwrightService.createDraftInBrowser(
      title,
      settingsService.getDefaultAuthor() || 'Unknown',
      html,
      html.replace(/<[^>]*>/g, '').slice(0, 120) // 提取前120个字符作为摘要
    );

    vscode.window.showInformationMessage('Draft created successfully in Chrome via Playwright!');
    log(`Draft created successfully via Playwright: ${draftUrl}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Playwright upload failed: ${(error as Error).message}`);
    log(`Unexpected error during Playwright upload: ${(error as Error).message}`, 'error');
    if (error instanceof Error && error.stack) {
      log(`Stack trace: ${error.stack}`, 'error');
    }
  }
}


export function deactivate() {}
