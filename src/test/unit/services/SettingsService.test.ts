import * as vscode from 'vscode';
import { SettingsService } from 'src/services/SettingsService';

jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn(),
  },
}));

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
    });
  });

  it('returns default author when configuration is empty', () => {
    const service = new SettingsService();

    expect(service.getDefaultAuthor()).toBe('');
    expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('wechatPublisher');
  });

  it('returns custom author when configured', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'defaultAuthor') {
          return 'Custom Author';
        }
        return defaultValue;
      }),
    });

    const service = new SettingsService();

    expect(service.getDefaultAuthor()).toBe('Custom Author');
  });

  it('returns settings object with defaultAuthor', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'defaultAuthor') {
          return 'Team Author';
        }
        return defaultValue;
      }),
    });

    const service = new SettingsService();

    expect(service.getSettings()).toEqual({ defaultAuthor: 'Team Author' });
  });
});
