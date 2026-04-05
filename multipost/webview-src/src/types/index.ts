// Message types between extension and webview

export type MessageFromExtension =
  | { type: 'updateMarkdown'; markdown: string }
  | { type: 'wechatAuthStatus'; loggedIn: boolean; userName?: string };

export type MessageToExtension =
  | { type: 'uploadToWeChat' }
  | { type: 'copyHtml'; html: string };
