import * as vscode from 'vscode';
import { WeChatService } from 'src/services/WeChatService';
import { WeChatAuthInfo } from 'src/interfaces/IWeChatService';
import type { CookieParam } from 'puppeteer';

// Mock external dependencies
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('form-data', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    append: jest.fn(),
    getHeaders: jest.fn(() => ({})),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockFetch = require('node-fetch').default as jest.Mock;

const makeCookie = (name: string, value: string): CookieParam => ({
  name,
  value,
  domain: '.mp.weixin.qq.com',
  path: '/',
  secure: true,
});

describe('WeChatService', () => {
  let mockSecretStorage: Partial<vscode.SecretStorage>;
  let weChatService: WeChatService;

  beforeEach(() => {
    mockSecretStorage = {
      get: jest.fn(),
      store: jest.fn(),
      delete: jest.fn(),
    };
    weChatService = new WeChatService(mockSecretStorage as vscode.SecretStorage);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create instance without error', () => {
    expect(weChatService).toBeDefined();
  });

  it('should return null auth info when no stored auth', async () => {
    (mockSecretStorage.get as jest.Mock).mockResolvedValue(null);
    await weChatService.loadAuthFromStorage();
    expect(weChatService.getAuthInfo()).toBeNull();
  });

  it('should load and parse stored auth correctly', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [],
    };
    (mockSecretStorage.get as jest.Mock).mockResolvedValue(JSON.stringify(mockAuth));

    await weChatService.loadAuthFromStorage();
    expect(weChatService.getAuthInfo()).toEqual(mockAuth);
  });

  it('should handle secret storage timeout gracefully', async () => {
    jest.useFakeTimers();
    (mockSecretStorage.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const pending = weChatService.loadAuthFromStorage();
    jest.advanceTimersByTime(1600);
    await pending;

    expect(weChatService.getAuthInfo()).toBeNull();
  });

  it('should handle invalid JSON gracefully', async () => {
    (mockSecretStorage.get as jest.Mock).mockResolvedValue('not valid json {');
    await weChatService.loadAuthFromStorage();
    expect(weChatService.getAuthInfo()).toBeNull();
  });

  it('should clear auth correctly', () => {
    weChatService.clearAuth();
    expect(mockSecretStorage.delete).toHaveBeenCalled();
    expect(weChatService.getAuthInfo()).toBeNull();
  });

  it('should save auth info to storage', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [],
    };

    await weChatService.saveAuthInfo(mockAuth);
    expect(mockSecretStorage.store).toHaveBeenCalled();
    expect(weChatService.getAuthInfo()).toEqual(mockAuth);
  });

  it('should return not authenticated when token not found', async () => {
    mockFetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue('<html>no token here</html>'),
      headers: {
        raw: jest.fn().mockReturnValue({ 'set-cookie': [] }),
      },
    });

    const result = await weChatService.checkAuth();
    expect(result.isAuthenticated).toBe(false);
  });

  it('should extract auth info when token found in html', async () => {
    const html = `
      <script>
        data: {
          t: "test-token",
          ticket: "test-ticket",
          user_name: "test-user",
          nick_name: "Test User",
          time: "123456",
          head_img: "https://example.com/avatar.jpg"
        }
      </script>
    `;

    mockFetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue(html),
      headers: {
        raw: jest.fn().mockReturnValue({ 'set-cookie': ['cookie1=val', 'cookie2=val'] }),
      },
    });

    const result = await weChatService.checkAuth();
    expect(result.isAuthenticated).toBe(true);
    expect(result.authInfo).toBeDefined();
    expect(result.authInfo?.token).toBe('test-token');
    expect(result.authInfo?.ticket).toBe('test-ticket');
    expect(result.authInfo?.userName).toBe('test-user');
    expect(result.authInfo?.nickName).toBe('Test User');
    expect(mockSecretStorage.store).toHaveBeenCalled();
  });

  it('should handle fetch errors gracefully in checkAuth', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await weChatService.checkAuth();
    expect(result.isAuthenticated).toBe(false);
  });

  it('should authenticate with manual cookie input and dedupe cookies', async () => {
    const html = `
      <script>
        token: "test-token",
        ticket: "test-ticket",
        user_name: "test-user",
        nick_name: "Test User",
        time: "123456",
        head_img: "https://example.com/avatar.jpg"
      </script>
    `;

    mockFetch.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue(html),
      headers: {
        raw: jest.fn().mockReturnValue({ 'set-cookie': ['cookie1=new; HttpOnly', 'cookie3=val3'] }),
      },
    });

    const result = await weChatService.checkAuthWithCookies(['cookie1=old', 'cookie2=val2']);

    expect(result.isAuthenticated).toBe(true);
    expect(result.authInfo?.cookies.map(cookie => cookie.name)).toEqual(['cookie1', 'cookie2', 'cookie3']);
    expect(mockSecretStorage.store).toHaveBeenCalled();
  });

  it('should return false when checkAuthWithCookies throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await weChatService.checkAuthWithCookies(['cookie1=old']);

    expect(result.isAuthenticated).toBe(false);
  });

  it('should return error when uploading image without authentication', async () => {
    const buffer = Buffer.from('');
    const result = await weChatService.uploadImage(buffer, 'test.png');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authenticated');
  });

  it('should handle upload errors gracefully', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const buffer = Buffer.from('');
    const result = await weChatService.uploadImage(buffer, 'test.png');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should return upload error when response indicates failure', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [makeCookie('cookie1', 'val'), makeCookie('cookie2', 'val')],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        base_resp: {
          err_msg: 'upload failed',
        },
      }),
    });

    const buffer = Buffer.from('');
    const result = await weChatService.uploadImage(buffer, 'test.png');
    expect(result.success).toBe(false);
    expect(result.error).toContain('upload failed');
  });

  it('should return error when createDraft without authentication', async () => {
    const result = await weChatService.createDraft('Title', 'Author', 'Content');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authenticated');
  });

  it('should handle createDraft errors gracefully', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await weChatService.createDraft('Title', 'Author', 'Content');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should create draft successfully', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [makeCookie('cookie1', 'val')],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({
        base_resp: { ret: 0 },
        appMsgId: 42,
      }),
    });

    const result = await weChatService.createDraft('Title', 'Author', '<p>Content</p>', 'Digest');

    expect(result.success).toBe(true);
    expect(result.appMsgId).toBe(42);
    expect(result.draftUrl).toContain('appmsgid=42');
  });

  it('should return createDraft error when response indicates failure', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [makeCookie('cookie1', 'val')],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        errmsg: 'invalid token',
      }),
    });

    const result = await weChatService.createDraft('Title', 'Author', 'Content');
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid token');
  });

  it('should convert old string[] cookies to CookieParam[] format', async () => {
    const oldFormatAuth = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: ['cookie1=val1', 'cookie2=val2'] as any,
    };

    (mockSecretStorage.get as jest.Mock).mockResolvedValue(JSON.stringify(oldFormatAuth));

    await weChatService.loadAuthFromStorage();
    const authInfo = weChatService.getAuthInfo();

    expect(authInfo).not.toBeNull();
    expect(authInfo?.cookies).toHaveLength(2);
    expect(authInfo?.cookies[0]).toMatchObject({
      name: 'cookie1',
      value: 'val1',
      domain: '.mp.weixin.qq.com',
    });
    expect(authInfo?.cookies[1]).toMatchObject({
      name: 'cookie2',
      value: 'val2',
      domain: '.mp.weixin.qq.com',
    });
  });

  it('should filter out invalid cookies during conversion', async () => {
    const oldFormatAuth = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: ['valid=val', 'invalid', '=value'] as any,
    };

    (mockSecretStorage.get as jest.Mock).mockResolvedValue(JSON.stringify(oldFormatAuth));

    await weChatService.loadAuthFromStorage();
    const authInfo = weChatService.getAuthInfo();

    expect(authInfo).not.toBeNull();
    expect(authInfo?.cookies).toHaveLength(1);
    expect(authInfo?.cookies[0].name).toBe('valid');
  });

  it('should extract auth info using different token patterns', async () => {
    const testCases = [
      { html: 'token = "test-token"', pattern: 'token = "x"' },
      { html: 'token: "test-token"', pattern: 'token: "x"' },
      { html: 't = "test-token"', pattern: 't = "x"' },
      { html: 't: "test-token"', pattern: 't: "x"' },
      { html: 'token=test-token', pattern: 'token=x' },
      { html: 'window.__TOKEN__ = "test-token"', pattern: 'window.__TOKEN__ = "x"' },
    ];

    for (const testCase of testCases) {
      mockFetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue(`${testCase.html}\nticket_val: "test-ticket"\nuser_name: "test-user"\nnick_name: "Test User"\ntime: "123456"\nhead_img: "https://example.com/avatar.jpg"`),
        headers: {
          raw: jest.fn().mockReturnValue({ 'set-cookie': [] }),
        },
      });

      const result = await weChatService.checkAuth();
      expect(result.isAuthenticated).toBe(true);
      expect(result.authInfo?.token).toBe('test-token');
    }
  });

  it('should extract auth info when appMsgId is returned differently', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [makeCookie('cookie1', 'val')],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        errmsg: 'ok',
        appmsgid: '99',
      }),
    });

    const result = await weChatService.createDraft('Title', 'Author', 'Content');
    expect(result.success).toBe(true);
    expect(result.draftUrl).toContain('appmsgid=99');
  });

  it('should handle various success response formats in createDraft', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [makeCookie('cookie1', 'val')],
    };

    await weChatService.saveAuthInfo(mockAuth);

    const successFormats = [
      { errmsg: 'ok' },
      { base_resp: { ret: 0 } },
      { base_resp: { err_msg: 'ok' } },
      { ret: 0 },
    ];

    for (const format of successFormats) {
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          ...format,
          appMsgId: '42',
        }),
      });

      const result = await weChatService.createDraft('Title', 'Author', 'Content');
      expect(result.success).toBe(true);
    }
  });

  it('should parse cookies from set-cookie headers correctly', async () => {
    mockFetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue('token: "test-token"\nticket: "test-ticket"\nuser_name: "test-user"\nnick_name: "Test User"\ntime: "123456"\nhead_img: "https://example.com/avatar.jpg"'),
      headers: {
        raw: jest.fn().mockReturnValue({
          'set-cookie': [
            'name1=value1; Path=/; Domain=.mp.weixin.qq.com; HttpOnly; Secure',
            'name2=value2; Path=/; Secure',
            'name3=value3',
          ],
        }),
      },
    });

    const result = await weChatService.checkAuth();
    expect(result.isAuthenticated).toBe(true);
    expect(result.authInfo?.cookies).toHaveLength(3);
    expect(result.authInfo?.cookies[0]).toMatchObject({
      name: 'name1',
      value: 'value1',
      httpOnly: true,
      secure: true,
    });
    expect(result.authInfo?.cookies[1]).toMatchObject({
      name: 'name2',
      value: 'value2',
      httpOnly: false,
      secure: true,
    });
    expect(result.authInfo?.cookies[2]).toMatchObject({
      name: 'name3',
      value: 'value3',
      httpOnly: false,
      secure: false,
    });
  });

  it('should handle empty set-cookie headers', async () => {
    mockFetch.mockResolvedValue({
      text: jest.fn().mockResolvedValue('token: "test-token"\nticket: "test-ticket"\nuser_name: "test-user"\nnick_name: "Test User"\ntime: "123456"\nhead_img: "https://example.com/avatar.jpg"'),
      headers: {
        raw: jest.fn().mockReturnValue({}),
      },
    });

    const result = await weChatService.checkAuth();
    expect(result.isAuthenticated).toBe(true);
    expect(result.authInfo?.cookies).toHaveLength(0);
  });

  it('should deduplicate cookies by name when combining', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue('token: "test-token"\nticket: "test-ticket"\nuser_name: "test-user"\nnick_name: "Test User"\ntime: "123456"\nhead_img: "https://example.com/avatar.jpg"'),
      headers: {
        raw: jest.fn().mockReturnValue({ 'set-cookie': ['cookie1=new; HttpOnly', 'cookie2=val2'] }),
      },
    });

    const result = await weChatService.checkAuthWithCookies(['cookie1=old', 'cookie2=val2', 'cookie3=val3']);

    expect(result.isAuthenticated).toBe(true);
    expect(result.authInfo?.cookies).toHaveLength(3);
    expect(result.authInfo?.cookies.find(c => c.name === 'cookie1')?.value).toBe('new');
  });

});

describe('WeChatService uploadImage', () => {
  let mockSecretStorage: Partial<vscode.SecretStorage>;
  let weChatService: WeChatService;

  beforeEach(() => {
    mockSecretStorage = {
      get: jest.fn(),
      store: jest.fn(),
      delete: jest.fn(),
    };
    weChatService = new WeChatService(mockSecretStorage as vscode.SecretStorage);
    jest.clearAllMocks();
  });

  it('should successfully upload image', async () => {
    const mockAuth: WeChatAuthInfo = {
      token: 'test-token',
      ticket: 'test-ticket',
      userName: 'test-user',
      nickName: 'Test User',
      svrTime: 123456,
      avatar: 'avatar-url',
      cookies: [],
    };

    await weChatService.saveAuthInfo(mockAuth);
    mockFetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({
        base_resp: { err_msg: 'ok' },
        cdn_url: 'https://cdn.example.com/image.jpg',
      }),
    });

    const buffer = Buffer.from('fake image data');
    const result = await weChatService.uploadImage(buffer, 'test.jpg');

    expect(result.success).toBe(true);
    expect(result.cdnUrl).toBe('https://cdn.example.com/image.jpg');
  });
});
