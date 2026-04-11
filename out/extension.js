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
        disposable = vscode.commands.registerCommand('multipost.configurePublishOptions', async () => {
            log('Command invoked: multipost.configurePublishOptions');
            await configurePublishOptions();
        });
        context.subscriptions.push(disposable);
        log('Command registered: multipost.configurePublishOptions');
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
async function promptBoolean(title, currentValue) {
    const picked = await vscode.window.showQuickPick([
        { label: '是', value: true },
        { label: '否', value: false },
    ], {
        title,
        placeHolder: currentValue ? '当前: 是' : '当前: 否',
        ignoreFocusOut: true,
    });
    return picked?.value;
}
async function configurePublishOptions() {
    const current = settingsService.getSettings();
    const defaultAuthor = await vscode.window.showInputBox({
        title: 'MultiPost 配置',
        prompt: '默认作者名',
        value: current.defaultAuthor,
        ignoreFocusOut: true,
    });
    if (defaultAuthor === undefined) {
        return;
    }
    const defaultCollection = await vscode.window.showInputBox({
        title: 'MultiPost 配置',
        prompt: '默认合集名',
        value: current.defaultCollection,
        ignoreFocusOut: true,
    });
    if (defaultCollection === undefined) {
        return;
    }
    const digestLengthInput = await vscode.window.showInputBox({
        title: 'MultiPost 配置',
        prompt: '摘要长度（字符数）',
        value: String(current.digestLength),
        ignoreFocusOut: true,
        validateInput: (value) => {
            const parsed = Number(value);
            if (!Number.isInteger(parsed) || parsed < 0) {
                return '请输入大于等于 0 的整数';
            }
            return undefined;
        },
    });
    if (digestLengthInput === undefined) {
        return;
    }
    const declareOriginal = await promptBoolean('默认开启原创声明', current.declareOriginal);
    if (declareOriginal === undefined) {
        return;
    }
    const enableAppreciation = await promptBoolean('默认开启赞赏', current.enableAppreciation);
    if (enableAppreciation === undefined) {
        return;
    }
    const publishDirectly = await promptBoolean('默认直接发布（否则保存草稿）', current.publishDirectly);
    if (publishDirectly === undefined) {
        return;
    }
    const updated = {
        defaultAuthor: defaultAuthor.trim(),
        defaultCollection: defaultCollection.trim(),
        digestLength: Number(digestLengthInput),
        declareOriginal,
        enableAppreciation,
        publishDirectly,
    };
    await settingsService.updateSettings(updated);
    vscode.window.showInformationMessage('MultiPost 发布选项已保存');
}
/**
 * Handle fully automated Playwright upload workflow:
 * - Ensure authenticated (login if needed)
 * - Create draft in browser via Playwright automation
 */
async function handlePlaywrightFullAutomatedUpload(markdown, title, progress) {
    try {
        log('Starting Playwright upload workflow');
        const publishSettings = settingsService.getSettings();
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
        const draftUrl = await playwrightService.createDraftInBrowser(title, publishSettings.defaultAuthor || 'Unknown', markdown, // 传递原始 markdown 而不是 HTML
        markdown.slice(0, publishSettings.digestLength), // 提取前N个字符作为摘要
        publishSettings.declareOriginal, publishSettings.enableAppreciation, publishSettings.defaultCollection, publishSettings.publishDirectly);
        const successMessage = publishSettings.publishDirectly
            ? 'Article published successfully in Chrome via Playwright!'
            : 'Draft created successfully in Chrome via Playwright!';
        vscode.window.showInformationMessage(successMessage);
        log(`${successMessage} URL: ${draftUrl}`);
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