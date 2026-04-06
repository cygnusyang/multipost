import * as vscode from 'vscode';
import { SettingsService } from 'src/services/SettingsService';

// Mock vscode workspace
jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue: any) => defaultValue),
    })),
  },
}));

describe('SettingsService', () => {
  let mockContext: Partial<vscode.ExtensionContext> = {};
  let settingsService: SettingsService;

  beforeEach(() => {
    mockContext = {};
    settingsService = new SettingsService(mockContext as vscode.ExtensionContext);
    jest.clearAllMocks();
  });

  it('should create instance without error', () => {
    expect(settingsService).toBeDefined();
  });

  it('should return default author when not configured', () => {
    const result = settingsService.getDefaultAuthor();
    expect(result).toBe('');
  });

  it('should return default autoOpenDraft setting', () => {
    const result = settingsService.shouldAutoOpenDraft();
    expect(result).toBe(true);
  });

  it('should get settings from configuration', () => {
    const mockGet = jest.spyOn(vscode.workspace, 'getConfiguration');
    settingsService.getSettings();
    expect(mockGet).toHaveBeenCalledWith('wechatPublisher');
  });

  it('should return custom author when configured', () => {
    const mockConfig = {
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === 'defaultAuthor') return 'Custom Author';
        return defaultValue;
      }),
    };
    jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig as any);

    const service = new SettingsService({} as vscode.ExtensionContext);
    const result = service.getDefaultAuthor();
    expect(result).toBe('Custom Author');
  });

  it('should return false when autoOpenDraft is disabled', () => {
    const mockConfig = {
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === 'autoOpenDraftAfterPublish') return false;
        return defaultValue;
      }),
    };
    jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig as any);

    const service = new SettingsService({} as vscode.ExtensionContext);
    const result = service.shouldAutoOpenDraft();
    expect(result).toBe(false);
  });

  it('should return empty string when defaultAuthor is empty string', () => {
    const mockConfig = {
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === 'defaultAuthor') return '';
        return defaultValue;
      }),
    };
    jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig as any);

    const service = new SettingsService({} as vscode.ExtensionContext);
    const result = service.getDefaultAuthor();
    expect(result).toBe('');
  });

  it('should return complete settings object when both settings configured', () => {
    const mockConfig = {
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === 'defaultAuthor') return 'Test Author';
        if (key === 'autoOpenDraftAfterPublish') return false;
        return defaultValue;
      }),
    };
    jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig as any);

    const service = new SettingsService({} as vscode.ExtensionContext);
    const result = service.getSettings();
    expect(result.defaultAuthor).toBe('Test Author');
    expect(result.autoOpenDraftAfterPublish).toBe(false);
  });
});
