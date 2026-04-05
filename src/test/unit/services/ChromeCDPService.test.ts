import * as vscode from 'vscode';
import puppeteer from 'puppeteer';
import { ChromeCDPService } from 'src/services/ChromeCDPService';

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: jest.fn(),
  },
}));

describe('ChromeCDPService', () => {
  const mockOutputChannel = {
    appendLine: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn(),
  } as unknown as vscode.OutputChannel;

  const makePage = () => ({
    goto: jest.fn(),
    cookies: jest.fn(),
    url: jest.fn(() => 'https://mp.weixin.qq.com/'),
    evaluate: jest.fn(),
    setCookie: jest.fn(),
    waitForSelector: jest.fn(),
    frames: jest.fn(() => []),
    click: jest.fn(),
    waitForNavigation: jest.fn(),
  });

  const makeBrowser = (page: ReturnType<typeof makePage>) => ({
    connected: true,
    newPage: jest.fn().mockResolvedValue(page),
    close: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should start first time login and return cookies when login succeeds', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    page.cookies.mockResolvedValue([{ name: 'token', value: 'x' }]);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');
    const cookies = await service.startFirstTimeLogin();

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(page.goto).toHaveBeenCalledWith('https://mp.weixin.qq.com/', { waitUntil: 'networkidle2' });
    expect(vscode.window.showInformationMessage).toHaveBeenCalled();
    expect(cookies).toEqual([{ name: 'token', value: 'x' }]);
    expect(service.isSessionActive()).toBe(true);
  });

  it('should reuse existing authenticated session', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    page.cookies.mockResolvedValue([{ name: 'token', value: 'x' }]);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');
    await service.startFirstTimeLogin();
    await service.startAuthenticatedSession([{ name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/' }]);

    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
  });

  it('should throw if creating draft without authenticated session', async () => {
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await expect(service.createDraftInBrowser('Title', 'Author', '<p>content</p>')).rejects.toThrow(
      'No authenticated browser session. Please login first.'
    );
  });

  it('should close browser and reset session state', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    page.cookies.mockResolvedValue([{ name: 'token', value: 'x' }]);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);

    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');
    await service.startFirstTimeLogin();
    await service.close();

    expect(browser.close).toHaveBeenCalled();
    expect(service.isSessionActive()).toBe(false);
  });

  it('should start authenticated session with saved cookies', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      { name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/' },
      { name: 'user', value: 'u', domain: '.mp.weixin.qq.com', path: '/' },
    ]);

    expect(page.setCookie).toHaveBeenCalledTimes(2);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'Chrome opened, already authenticated with saved login'
    );
    expect(service.isSessionActive()).toBe(true);
  });

  it('should only inject sanitized valid cookies', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      {
        name: 'token',
        value: 'x',
        domain: '.mp.weixin.qq.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
        expires: 9999999999,
        sourcePort: 443,
      } as any,
      {
        name: 'broken',
        value: 'y',
      } as any,
    ]);

    expect(page.setCookie).toHaveBeenCalledTimes(1);
    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'token',
      value: 'x',
      domain: '.mp.weixin.qq.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
      expires: 9999999999,
    });
  });

  it('should fall back to qr login when saved cookies are not enough', async () => {
    const page = makePage();
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');
    (service as any).waitForLogin = jest.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await service.startAuthenticatedSession([
      { name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/' },
    ]);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Chrome opened. Please scan QR code to login');
    expect(service.isSessionActive()).toBe(true);
  });

  it('should timeout on first time login and close browser', async () => {
    const page = makePage();
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');
    (service as any).waitForLogin = jest.fn().mockResolvedValue(false);

    await expect(service.startFirstTimeLogin()).rejects.toThrow('Login timeout');
    expect(browser.close).toHaveBeenCalled();
  });

  it('should create draft in browser when session is active', async () => {
    const page = makePage();
    const frame = {
      url: jest.fn(() => 'https://mp.weixin.qq.com/ueditor'),
      waitForSelector: jest.fn(),
      evaluate: jest.fn(),
    };
    page.evaluate.mockResolvedValue(true);
    page.cookies.mockResolvedValue([{ name: 'token', value: 'x' }]);
    page.frames.mockReturnValue([frame] as any);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startFirstTimeLogin();
    const draftUrl = await service.createDraftInBrowser('Title', 'Author', '<p>Hello</p>', 'Digest');

    expect(page.goto).toHaveBeenCalledWith(
      'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid=100000000',
      { waitUntil: 'networkidle2' }
    );
    expect(frame.evaluate).toHaveBeenCalledWith(expect.any(Function), '<p>Hello</p>');
    expect(page.click).toHaveBeenCalledWith('#js_save');
    expect(draftUrl).toBe('https://mp.weixin.qq.com/');
  });

  it('should throw when editor iframe cannot be found', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    page.cookies.mockResolvedValue([{ name: 'token', value: 'x' }]);
    page.frames.mockReturnValue([] as any);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startFirstTimeLogin();

    await expect(service.createDraftInBrowser('Title', 'Author', '<p>Hello</p>')).rejects.toThrow(
      'Could not find editor iframe'
    );
  });

  it('should handle cookie with invalid sameSite (boolean) and omit the field', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      { name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/', sameSite: true },
    ] as any);

    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'token',
      value: 'x',
      domain: '.mp.weixin.qq.com',
      path: '/',
      // sameSite should be omitted due to invalid type
    });
  });

  it('should keep only url when cookie has both url and domain', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      {
        name: 'token',
        value: 'x',
        url: 'https://mp.weixin.qq.com/',
        domain: '.mp.weixin.qq.com',
        path: '/',
      },
    ]);

    // Should only have url, not domain/path (CDP doesn't allow both)
    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'token',
      value: 'x',
      url: 'https://mp.weixin.qq.com/',
    });
  });

  it('should omit expires when cookie has expires = 0 (session cookie)', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      { name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/', expires: 0 },
    ]);

    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'token',
      value: 'x',
      domain: '.mp.weixin.qq.com',
      path: '/',
      // expires should be omitted for session cookie
    });
  });

  it('should omit expires when cookie has negative expires', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      { name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/', expires: -12345 },
    ]);

    expect(page.setCookie).toHaveBeenCalledWith({
      name: 'token',
      value: 'x',
      domain: '.mp.weixin.qq.com',
      path: '/',
      // expires should be omitted
    });
  });

  it('should skip failed cookies but continue with successful ones', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    // First cookie fails, second succeeds
    page.setCookie
      .mockRejectedValueOnce(new Error('Protocol error: Invalid cookie fields'))
      .mockResolvedValueOnce(undefined);
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await service.startAuthenticatedSession([
      { name: 'badCookie', value: 'x', domain: '.mp.weixin.qq.com', path: '/' },
      { name: 'goodCookie', value: 'y', domain: '.mp.weixin.qq.com', path: '/' },
    ]);

    // Should have tried both cookies, one failed one succeeded
    expect(page.setCookie).toHaveBeenCalledTimes(2);
    // Should still complete successfully because at least some succeeded
    expect(service.isSessionActive()).toBe(true);
  });

  it('should throw when all cookies fail to set', async () => {
    const page = makePage();
    page.evaluate.mockResolvedValue(true);
    // All cookies fail
    page.setCookie.mockRejectedValue(new Error('Protocol error: Invalid cookie fields'));
    const browser = makeBrowser(page);
    (puppeteer.launch as jest.Mock).mockResolvedValue(browser);
    const service = new ChromeCDPService(mockOutputChannel, '/tmp/multipost');

    await expect(service.startAuthenticatedSession([
      { name: 'bad1', value: 'x', domain: '.mp.weixin.qq.com', path: '/' },
      { name: 'bad2', value: 'y', domain: '.mp.weixin.qq.com', path: '/' },
    ])).rejects.toThrow('All 2 cookies failed to set');
  });
});
