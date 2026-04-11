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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const SettingsService_1 = require("./services/SettingsService");
const PlaywrightService_1 = require("./services/PlaywrightService");
const extractTitle_1 = require("./utils/extractTitle");
let settingsService;
let playwrightService;
let outputChannel;
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (outputChannel) {
        outputChannel.appendLine(logMessage);
    }
    if (level === 'error') {
        console.error(logMessage);
    }
    else {
        console.log(logMessage);
    }
}
async function activate(context) {
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
        settingsService = new SettingsService_1.SettingsService();
        playwrightService = new PlaywrightService_1.PlaywrightService(outputChannel);
        log('Services initialized successfully');
        log('Step 2: Registering commands...');
        log(`Available vscode.commands: ${typeof vscode.commands}`);
        // Register commands
        let disposable = vscode.commands.registerCommand('multipost.logoutWeChat', async () => {
            log('Command invoked: multipost.logoutWeChat');
            await playwrightService.close();
            vscode.window.showInformationMessage('Logged out from MultiPost');
            log('User logged out successfully');
        });
        context.subscriptions.push(disposable);
        log('Command registered: multipost.logoutWeChat');
        // Register Playwright-based upload command as the main command
        disposable = vscode.commands.registerCommand('multipost.uploadToWeChat', async () => {
            log('Command invoked: multipost.uploadToWeChat (Playwright Automated Upload)');
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                log('Error: No active editor', 'error');
                return;
            }
            const markdown = editor.document.getText();
            const fileName = editor.document.fileName;
            const title = (0, extractTitle_1.extractTitle)(markdown) || fileName.split('/').pop()?.replace(/\.md$/, '') || 'Untitled';
            log(`Extracted title: "${title}", markdown length: ${markdown.length} characters`);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Starting Playwright automated upload...',
                cancellable: false,
            }, async (progress) => {
                await handlePlaywrightFullAutomatedUpload(markdown, title, progress);
            });
        });
        context.subscriptions.push(disposable);
        log('Command registered: multipost.uploadToWeChat');
        log('All commands registered successfully');
        log('=== MultiPost extension activation completed successfully ===');
    }
    catch (error) {
        const errorMsg = error.message;
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
 * Handle fully automated Playwright upload workflow:
 * - Ensure authenticated (login if needed)
 * - Create draft in browser via Playwright automation
 */
async function handlePlaywrightFullAutomatedUpload(markdown, title, progress) {
    try {
        log('Starting Playwright upload workflow');
        // Step 1: Check if we need to login
        if (!playwrightService.isSessionActive()) {
            // Check if we have a saved login state
            const hasSavedLogin = await playwrightService.hasSavedLogin();
            if (hasSavedLogin) {
                progress.report({ message: 'Restoring saved login session...' });
                await playwrightService.restoreLogin();
            }
            else {
                progress.report({ message: 'Waiting for QR code scan...' });
                await playwrightService.startFirstTimeLogin();
            }
        }
        // Step 2: Create draft with full options
        const draftUrl = await playwrightService.createDraftInBrowser(title, settingsService.getDefaultAuthor() || 'Unknown', markdown, // 传递原始 markdown 而不是 HTML
        markdown.slice(0, 120), // 提取前120个字符作为摘要
        true, // 原创声明
        true, // 赞赏功能
        '智能体' // 默认合集
        );
        vscode.window.showInformationMessage('Draft created successfully in Chrome via Playwright!');
        log(`Draft created successfully via Playwright: ${draftUrl}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Playwright upload failed: ${error.message}`);
        log(`Unexpected error during Playwright upload: ${error.message}`, 'error');
        if (error instanceof Error && error.stack) {
            log(`Stack trace: ${error.stack}`, 'error');
        }
    }
}
function deactivate() {
    if (playwrightService) {
        playwrightService.close();
    }
}
//# sourceMappingURL=extension.js.map