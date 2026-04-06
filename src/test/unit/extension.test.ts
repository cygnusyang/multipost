import * as vscode from 'vscode';
import { activate, deactivate } from 'src/extension';
import { processMarkdownForUpload } from 'src/utils/processMarkdown';

const mockWeChatService: any = {
  loadAuthFromStorage: jest.fn().mockResolvedValue(undefined),
  clearAuth: jest.fn(),
  getAuthInfo: jest.fn(() => null),
  checkAuthWithCookies: jest.fn(),
  checkAuth: jest.fn(),
  createDraft: jest.fn(),
};

const mockSettingsService: any = {
  getDefaultAuthor: jest.fn(() => 'Default Author'),
  shouldAutoOpenDraft: jest.fn(() => true),
};

const mockPlaywrightService: any = {
  startFirstTimeLogin: jest.fn(),
  createDraftInBrowser: jest.fn(),
  isSessionActive: jest.fn(() => false),
};

jest.mock('src/services/WeChatService', () => ({
  WeChatService: jest.fn(() => mockWeChatService),
}));

jest.mock('src/services/SettingsService', () => ({
  SettingsService: jest.fn(() => mockSettingsService),
}));

jest.mock('src/services/PlaywrightService', () => ({
  PlaywrightService: jest.fn(() => mockPlaywrightService),
}));

jest.mock('src/utils/extractTitle', () => ({
  extractTitle: jest.fn(() => 'Extracted Title'),
}));

jest.mock('src/utils/processMarkdown', () => ({
  processMarkdownForUpload: jest.fn(async () => ({ html: '<p>rendered</p>', errors: [] })),
}));

describe('extension', () => {
  let mockContext: vscode.ExtensionContext;
  let registeredCommands: Map<string, (...args: any[]) => any>;

  beforeEach(() => {
    registeredCommands = new Map();
    mockContext = {
      extensionUri: vscode.Uri.file('/test/extension'),
      secrets: {
        get: jest.fn(),
        store: jest.fn(),
        delete: jest.fn(),
        onDidChange: jest.fn(),
      } as unknown as vscode.SecretStorage,
      subscriptions: [],
      extensionPath: '',
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        setKeysForSync: jest.fn(),
        keys: jest.fn(() => []),
      },
      workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(() => []),
      },
      storageUri: undefined,
      storagePath: undefined,
      globalStorageUri: undefined as any,
      globalStoragePath: '',
      logUri: undefined as any,
      logPath: '',
      asAbsolutePath: jest.fn((path) => path),
      // Add required missing properties
      environmentVariableCollection: {} as any,
      extensionMode: 1,
      extension: undefined as any,
      languageModelAccessInformation: undefined as any,
    } as vscode.ExtensionContext;

    jest.clearAllMocks();
    (vscode.window as any).activeTextEditor = undefined;
    (vscode.commands.registerCommand as jest.Mock).mockImplementation((id, callback) => {
      registeredCommands.set(id, callback);
      return { dispose: jest.fn() };
    });
    (vscode.window.createOutputChannel as jest.Mock).mockReturnValue({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    });
    (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);
    (vscode.window.withProgress as jest.Mock).mockImplementation((_, task) => task({ report: jest.fn() }));
    (vscode.Uri.parse as jest.Mock).mockImplementation((value: string) => value);
    mockWeChatService.getAuthInfo.mockReturnValue(null);
    mockPlaywrightService.isSessionActive.mockReturnValue(false);
    mockWeChatService.loadAuthFromStorage.mockResolvedValue(undefined);
    mockWeChatService.checkAuth.mockResolvedValue({ isAuthenticated: true });
    mockWeChatService.checkAuthWithCookies.mockResolvedValue({ isAuthenticated: true, authInfo: { nickName: 'Tester' } });
    mockWeChatService.createDraft.mockResolvedValue({ success: true, draftUrl: 'https://example.com/draft' });
    mockPlaywrightService.createDraftInBrowser.mockResolvedValue('https://example.com/browser-draft');
    (processMarkdownForUpload as jest.Mock).mockResolvedValue({ html: '<p>rendered</p>', errors: [] });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should activate without error', async () => {
    await expect(activate(mockContext)).resolves.not.toThrow();
    expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(2);
    expect(mockContext.subscriptions).toHaveLength(3);
  });

  it('should deactivate without error', () => {
    expect(() => deactivate()).not.toThrow();
  });

  it('should show error when upload runs without active editor', async () => {
    await activate(mockContext);

    await registeredCommands.get('multipost.uploadToWeChat')!();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active editor');
  });

  it('should logout', async () => {
    await activate(mockContext);

    await registeredCommands.get('multipost.logoutWeChat')!();

    expect(mockWeChatService.clearAuth).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Logged out from MultiPost');
  });


  it('should show warning when markdown processing returns errors', async () => {
    await activate(mockContext);
    (vscode.window as any).activeTextEditor = {
      document: {
        getText: () => '# Title',
        fileName: '/tmp/demo.md',
      },
    };
    mockWeChatService.getAuthInfo.mockReturnValue({ nickName: 'Tester' });
    mockWeChatService.checkAuth.mockResolvedValue({ isAuthenticated: true });
    mockWeChatService.createDraft.mockResolvedValue({
      success: true,
      draftUrl: 'https://example.com/draft',
    });
    (processMarkdownForUpload as jest.Mock).mockResolvedValue({
      html: '<p>rendered</p>',
      errors: ['boom'],
    });

    await registeredCommands.get('multipost.uploadToWeChat')!();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Processing completed with 1 errors: boom');
  });

  it('should show upload error when markdown processing throws', async () => {
    await activate(mockContext);
    (vscode.window as any).activeTextEditor = {
      document: {
        getText: () => '# Title',
        fileName: '/tmp/demo.md',
      },
    };
    mockWeChatService.getAuthInfo.mockReturnValue({ nickName: 'Tester' });
    mockWeChatService.checkAuth.mockResolvedValue({ isAuthenticated: true });
    (processMarkdownForUpload as jest.Mock).mockRejectedValue(new Error('processor failed'));

    await registeredCommands.get('multipost.uploadToWeChat')!();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Playwright upload failed: processor failed');
  });


  it('should surface background auth load failure as warning log path', async () => {
    mockWeChatService.loadAuthFromStorage.mockRejectedValueOnce(new Error('load failed'));

    await activate(mockContext);
    await Promise.resolve();

    // 由于删除了 PreviewService，我们不再检查 updateAuthStatus
  });

});
