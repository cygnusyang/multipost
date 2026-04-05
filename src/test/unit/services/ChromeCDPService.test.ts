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

    const service = new ChromeCDPService(mockOutputChannel);
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

    const service = new ChromeCDPService(mockOutputChannel);
    await service.startFirstTimeLogin();
    await service.startAuthenticatedSession([{ name: 'token', value: 'x', domain: '.mp.weixin.qq.com', path: '/' }]);

    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
  });

  it('should throw if creating draft without authenticated session', async () => {
    const service = new ChromeCDPService(mockOutputChannel);

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

    const service = new ChromeCDPService(mockOutputChannel);
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
    const service = new ChromeCDPService(mockOutputChannel);

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
    const service = new ChromeCDPService(mockOutputChannel);

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
    const service = new ChromeCDPService(mockOutputChannel);
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
    const service = new ChromeCDPService(mockOutputChannel);
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
    const service = new ChromeCDPService(mockOutputChannel);

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
    const service = new ChromeCDPService(mockOutputChannel);

    await service.startFirstTimeLogin();

    await expect(service.createDraftInBrowser('Title', 'Author', '<p>Hello</p>')).rejects.toThrow(
      'Could not find editor iframe'
    );
  });
});
