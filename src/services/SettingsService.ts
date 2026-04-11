import * as vscode from 'vscode';

export interface ExtensionSettings {
  defaultAuthor: string;
}

export class SettingsService {
  getSettings(): ExtensionSettings {
    const config = vscode.workspace.getConfiguration('wechatPublisher');
    return {
      defaultAuthor: config.get('defaultAuthor', ''),
    };
  }

  getDefaultAuthor(): string {
    return this.getSettings().defaultAuthor;
  }
}
