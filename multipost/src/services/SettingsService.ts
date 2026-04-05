import * as vscode from 'vscode';

export interface ExtensionSettings {
  defaultAuthor: string;
  autoOpenDraftAfterPublish: boolean;
}

export class SettingsService {
  constructor(private context: vscode.ExtensionContext) {}

  getSettings(): ExtensionSettings {
    const config = vscode.workspace.getConfiguration('wechatPublisher');
    return {
      defaultAuthor: config.get('defaultAuthor', ''),
      autoOpenDraftAfterPublish: config.get('autoOpenDraftAfterPublish', true),
    };
  }

  getDefaultAuthor(): string {
    return this.getSettings().defaultAuthor;
  }

  shouldAutoOpenDraft(): boolean {
    return this.getSettings().autoOpenDraftAfterPublish;
  }
}
