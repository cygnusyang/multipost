import * as vscode from 'vscode';

export interface MockVSCodeOptions {
  showErrorMessage?: jest.Mock;
  showInformationMessage?: jest.Mock;
  showWarningMessage?: jest.Mock;
  showInputBox?: jest.Mock;
  createOutputChannel?: jest.Mock;
  withProgress?: jest.Mock;
  createWebviewPanel?: jest.Mock;
  registerCommand?: jest.Mock;
  executeCommand?: jest.Mock;
  openExternal?: jest.Mock;
  writeText?: jest.Mock;
}

export function createMockVSCode(options: MockVSCodeOptions = {}) {
  const mockVSCode = {
    window: {
      showErrorMessage: options.showErrorMessage || jest.fn(),
      showInformationMessage: options.showInformationMessage || jest.fn(),
      showWarningMessage: options.showWarningMessage || jest.fn(),
      showInputBox: options.showInputBox || jest.fn().mockResolvedValue(undefined),
      createOutputChannel: options.createOutputChannel || jest.fn(),
      withProgress: options.withProgress || jest.fn((_, cb) => cb()),
      createWebviewPanel: options.createWebviewPanel || jest.fn(),
    },
    commands: {
      registerCommand: options.registerCommand || jest.fn(),
      executeCommand: options.executeCommand || jest.fn(),
    },
    env: {
      openExternal: options.openExternal || jest.fn(),
      clipboard: {
        writeText: options.writeText || jest.fn(),
      },
    },
    Uri: {
      file: jest.fn((path) => ({ path })),
      parse: jest.fn(),
    },
    workspace: {
      getConfiguration: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
      })),
    },
  };

  return mockVSCode as unknown as typeof vscode;
}

export function mockModule(modulePath: string, mockImplementation: any) {
  jest.doMock(modulePath, () => mockImplementation, { virtual: true });
}

export function resetAllMocks() {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
}

export function createMockResponse(data: any, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: jest.fn((name) => headers[name as keyof typeof headers]),
    },
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  };
}

export function createMockFileContent(content: string, language = 'markdown') {
  return {
    languageId: language,
    getText: jest.fn().mockReturnValue(content),
    fileName: 'test.md',
    uri: { fsPath: '/test.md' },
  };
}

export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}