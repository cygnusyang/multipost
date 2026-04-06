/**
 * 微信公众号URL和参数动态解析工具
 * 用于动态提取微信公众号平台的各种URL和参数，避免硬编码
 */

import type { Page } from 'puppeteer';

export interface WeChatUrlInfo {
  baseUrl: string;
  path: string;
  params: Record<string, string>;
  fullUrl: string;
}

export interface WeChatPageElements {
  titleSelector: string;
  authorSelector: string;
  digestSelector: string;
  submitSelector: string;
  editorFrameSelector: string;
}

/**
 * 从页面中动态提取微信公众号的URL模式
 */
export class WeChatUrlParser {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 获取基础URL（固定为 https://mp.weixin.qq.com）
   */
  getBaseUrl(): string {
    return 'https://mp.weixin.qq.com';
  }

  /**
   * 从页面中提取编辑草稿的URL
   * 优先从页面中的链接提取，如果没有则构建通用URL
   */
  async extractEditUrl(appMsgId?: string): Promise<string> {
    const baseUrl = this.getBaseUrl();
    
    // 尝试从页面中提取编辑链接
    const editLink = await this.page.evaluate(() => {
      // 查找包含编辑相关关键词的链接
      const possibleSelectors = [
        'a[href*="appmsg_edit"]',
        'a[href*="operate_appmsg"]',
        'a:contains("编辑")',
        'a:contains("修改")',
        'a[title*="编辑"]',
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('href')) {
          return element.getAttribute('href');
        }
      }
      return null;
    });

    if (editLink) {
      // 如果是相对路径，转换为绝对URL
      if (editLink.startsWith('/')) {
        return `${baseUrl}${editLink}`;
      }
      if (editLink.startsWith('http')) {
        return editLink;
      }
      return `${baseUrl}/${editLink}`;
    }

    // 如果没有找到链接，构建通用编辑URL
    const params = new URLSearchParams();
    params.append('t', 'media/appmsg_edit');
    params.append('action', 'edit');
    
    // 尝试从页面提取type参数
    const pageType = await this.extractPageType();
    if (pageType) {
      params.append('type', pageType);
    } else {
      // 默认值，但应该尽量避免硬编码
      params.append('type', '77');
    }
    
    // 如果有提供的appMsgId，使用它
    if (appMsgId) {
      params.append('appmsgid', appMsgId);
    } else {
      // 尝试从页面提取现有的appmsgid
      const existingId = await this.extractExistingAppMsgId();
      if (existingId) {
        params.append('appmsgid', existingId);
      }
      // 如果没有appmsgid，就不带这个参数（让平台生成新ID）
    }
    
    // 尝试提取token和lang参数
    const token = await this.extractToken();
    if (token) {
      params.append('token', token);
    }
    
    const lang = await this.extractLanguage();
    if (lang) {
      params.append('lang', lang);
    } else {
      params.append('lang', 'zh_CN');
    }
    
    return `${baseUrl}/cgi-bin/appmsg?${params.toString()}`;
  }

  /**
   * 从页面中提取草稿列表URL
   */
  async extractDraftListUrl(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    
    // 尝试从页面中提取草稿列表链接
    const draftLink = await this.page.evaluate(() => {
      const possibleSelectors = [
        'a[href*="action=draft"]',
        'a[href*="draft"]:contains("草稿")',
        'a[title*="草稿"]',
        'a:contains("草稿箱")',
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('href')) {
          return element.getAttribute('href');
        }
      }
      return null;
    });

    if (draftLink) {
      if (draftLink.startsWith('/')) {
        return `${baseUrl}${draftLink}`;
      }
      if (draftLink.startsWith('http')) {
        return draftLink;
      }
      return `${baseUrl}/${draftLink}`;
    }

    // 构建通用草稿列表URL
    const params = new URLSearchParams();
    params.append('action', 'draft');
    
    const token = await this.extractToken();
    if (token) {
      params.append('token', token);
    }
    
    const lang = await this.extractLanguage();
    if (lang) {
      params.append('lang', lang);
    }
    
    return `${baseUrl}/cgi-bin/appmsg?${params.toString()}`;
  }

  /**
   * 从页面中提取内容管理/文章列表URL
   */
  async extractContentListUrl(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    
    const contentLink = await this.page.evaluate(() => {
      const possibleSelectors = [
        'a[href*="action=list"]',
        'a[href*="content"]',
        'a:contains("内容管理")',
        'a:contains("图文消息")',
        'a[title*="内容"]',
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('href')) {
          return element.getAttribute('href');
        }
      }
      return null;
    });

    if (contentLink) {
      if (contentLink.startsWith('/')) {
        return `${baseUrl}${contentLink}`;
      }
      if (contentLink.startsWith('http')) {
        return contentLink;
      }
      return `${baseUrl}/${contentLink}`;
    }

    // 构建通用内容列表URL
    const params = new URLSearchParams();
    params.append('action', 'list');
    params.append('type', '10');
    params.append('count', '20');
    params.append('day', '7');
    
    const token = await this.extractToken();
    if (token) {
      params.append('token', token);
    }
    
    const lang = await this.extractLanguage();
    if (lang) {
      params.append('lang', lang);
    }
    
    return `${baseUrl}/cgi-bin/appmsg?${params.toString()}`;
  }

  /**
   * 从页面中提取现有的appmsgid
   */
  async extractExistingAppMsgId(): Promise<string | null> {
    return await this.page.evaluate(() => {
      // 从当前URL提取
      const urlMatch = window.location.href.match(/appmsgid=(\d+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
      
      // 从页面中的链接提取
      const links = document.querySelectorAll('a[href*="appmsgid="]');
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href');
        if (href) {
          const match = href.match(/appmsgid=(\d+)/);
          if (match) {
            return match[1];
          }
        }
      }
      
      // 从页面数据属性或隐藏字段提取
      const hiddenInput = document.querySelector('input[name="appmsgid"], input[type="hidden"][value*="1"]');
      if (hiddenInput) {
        const value = hiddenInput.getAttribute('value');
        if (value && /^\d+$/.test(value)) {
          return value;
        }
      }
      
      return null;
    });
  }

  /**
   * 从页面中提取token
   */
  async extractToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      // 从URL提取
      const urlMatch = window.location.href.match(/token=([^&]+)/);
      if (urlMatch) {
        return decodeURIComponent(urlMatch[1]);
      }
      
      // 从页面全局变量提取
      if ((window as any).global && (window as any).global.token) {
        return (window as any).global.token;
      }
      
      // 从脚本标签中的变量提取
      const scripts = document.querySelectorAll('script');
      for (const script of Array.from(scripts)) {
        const scriptText = script.textContent || '';
        const tokenMatch = scriptText.match(/token\s*[:=]\s*["']([^"']+)["']/);
        if (tokenMatch) {
          return tokenMatch[1];
        }
      }
      
      return null;
    });
  }

  /**
   * 从页面中提取语言设置
   */
  async extractLanguage(): Promise<string | null> {
    return await this.page.evaluate(() => {
      // 从URL提取
      const urlMatch = window.location.href.match(/lang=([^&]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
      
      // 从html标签的lang属性提取
      const htmlLang = document.documentElement.getAttribute('lang');
      if (htmlLang) {
        return htmlLang;
      }
      
      // 从meta标签提取
      const metaLang = document.querySelector('meta[name="lang"], meta[http-equiv="Content-Language"]');
      if (metaLang) {
        const content = metaLang.getAttribute('content');
        if (content) {
          return content;
        }
      }
      
      return null;
    });
  }

  /**
   * 从页面中提取文章类型
   */
  async extractPageType(): Promise<string | null> {
    return await this.page.evaluate(() => {
      // 从URL提取
      const urlMatch = window.location.href.match(/type=(\d+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
      
      // 从表单字段提取
      const typeInput = document.querySelector('input[name="type"], select[name="type"]');
      if (typeInput) {
        const value = typeInput.getAttribute('value') || (typeInput as HTMLSelectElement).value;
        if (value) {
          return value;
        }
      }
      
      return null;
    });
  }

  /**
   * 动态发现页面元素选择器
   */
  async discoverPageElements(): Promise<WeChatPageElements> {
    const elements = await this.page.evaluate(() => {
      const result: any = {};
      
      // 发现标题输入框
      const titleInput = document.querySelector('input[name="title"], #title, [placeholder*="标题"], [data-role="title"]');
      if (titleInput) {
        if (titleInput.id) {
          result.titleSelector = `#${titleInput.id}`;
        } else if (titleInput.getAttribute('name')) {
          result.titleSelector = `input[name="${titleInput.getAttribute('name')}"]`;
        } else {
          // 尝试其他属性
          for (const attr of ['data-testid', 'data-role', 'placeholder']) {
            const value = titleInput.getAttribute(attr);
            if (value) {
              result.titleSelector = `[${attr}="${value}"]`;
              break;
            }
          }
        }
      }
      
      // 发现作者输入框
      const authorInput = document.querySelector('input[name="author"], #author, [placeholder*="作者"]');
      if (authorInput) {
        if (authorInput.id) {
          result.authorSelector = `#${authorInput.id}`;
        } else if (authorInput.getAttribute('name')) {
          result.authorSelector = `input[name="${authorInput.getAttribute('name')}"]`;
        }
      }
      
      // 发现摘要输入框
      const digestInput = document.querySelector('textarea[name="digest"], #digest, [placeholder*="摘要"]');
      if (digestInput) {
        if (digestInput.id) {
          result.digestSelector = `#${digestInput.id}`;
        } else if (digestInput.getAttribute('name')) {
          result.digestSelector = `textarea[name="${digestInput.getAttribute('name')}"]`;
        }
      }
      
      // 发现提交按钮
      const submitButton = document.querySelector('#js_submit, button[type="submit"], button:contains("保存"), [data-role="submit"]');
      if (submitButton) {
        if (submitButton.id) {
          result.submitSelector = `#${submitButton.id}`;
        } else if (submitButton.getAttribute('data-role')) {
          result.submitSelector = `[data-role="${submitButton.getAttribute('data-role')}"]`;
        }
      }
      
      // 发现编辑器iframe
      const editorFrame = document.querySelector('#ueditor_iframe, iframe[name="ueditor"], iframe[src*="ueditor"]');
      if (editorFrame) {
        if (editorFrame.id) {
          result.editorFrameSelector = `#${editorFrame.id}`;
        } else if (editorFrame.getAttribute('name')) {
          result.editorFrameSelector = `iframe[name="${editorFrame.getAttribute('name')}"]`;
        }
      }
      
      return result;
    });
    
    // 提供默认值作为后备
    return {
      titleSelector: elements.titleSelector || '#title',
      authorSelector: elements.authorSelector || '#author',
      digestSelector: elements.digestSelector || '#digest',
      submitSelector: elements.submitSelector || '#js_submit',
      editorFrameSelector: elements.editorFrameSelector || '#ueditor_iframe',
    };
  }

  /**
   * 解析URL，提取参数信息
   */
  parseUrl(url: string): WeChatUrlInfo {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      path: urlObj.pathname,
      params,
      fullUrl: url,
    };
  }
}

/**
 * 静态工具函数：从HTML内容中提取token
 */
export function extractTokenFromHtml(html: string): string | null {
  // 多种模式尝试提取token
  const patterns = [
    /token\s*[:=]\s*["']([^"']+)["']/,
    /token["']?\s*:\s*["']([^"']+)["']/,
    /window\.global\.token\s*=\s*["']([^"']+)["']/,
    /token\s*=\s*([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * 静态工具函数：从URL中提取appmsgid
 */
export function extractAppMsgIdFromUrl(url: string): string | null {
  const match = url.match(/appmsgid=(\d+)/);
  return match ? match[1] : null;
}

/**
 * 静态工具函数：构建通用URL（尽可能不带硬编码参数）
 */
export function buildGenericUrl(baseUrl: string, endpoint: string, params?: Record<string, string>): string {
  const url = new URL(endpoint, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}