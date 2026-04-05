"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeChatService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_data_1 = __importDefault(require("form-data"));
const STORAGE_KEY = 'wechat-publisher.auth';
class WeChatService {
    constructor(secretStorage) {
        this.authInfo = null;
        this.secretStorage = secretStorage;
    }
    async loadAuthFromStorage() {
        const stored = await this.secretStorage.get(STORAGE_KEY);
        if (stored) {
            try {
                this.authInfo = JSON.parse(stored);
            }
            catch (e) {
                this.authInfo = null;
            }
        }
    }
    getAuthInfo() {
        return this.authInfo;
    }
    clearAuth() {
        this.authInfo = null;
        this.secretStorage.delete(STORAGE_KEY);
    }
    async saveAuthInfo(authInfo) {
        this.authInfo = authInfo;
        await this.secretStorage.store(STORAGE_KEY, JSON.stringify(authInfo));
    }
    async checkAuth() {
        try {
            const headers = this.getRequestHeaders();
            const response = await (0, node_fetch_1.default)('https://mp.weixin.qq.com/', {
                method: 'GET',
                headers: headers,
                redirect: 'follow',
            });
            const html = await response.text();
            // Extract tokens using regex from HTML
            const tokenMatch = html.match(/data:\s*\{[\s\S]*?t:\s*["']([^"']+)["']/);
            if (!tokenMatch) {
                return { isAuthenticated: false };
            }
            const ticketMatch = html.match(/ticket:\s*["']([^"']+)["']/);
            const userNameMatch = html.match(/user_name:\s*["']([^"']+)["']/);
            const nickNameMatch = html.match(/nick_name:\s*["']([^"']+)["']/);
            const timeMatch = html.match(/time:\s*["'](\d+)["']/);
            const avatarMatch = html.match(/head_img:\s*['"]([^'"]+)['"]/);
            const cookies = response.headers.raw()['set-cookie'] || [];
            const newAuthInfo = {
                token: tokenMatch[1],
                ticket: ticketMatch ? ticketMatch[1] : '',
                userName: userNameMatch ? userNameMatch[1] : '',
                nickName: nickNameMatch ? nickNameMatch[1] : '',
                svrTime: timeMatch ? Number(timeMatch[1]) : Date.now() / 1000,
                avatar: avatarMatch ? avatarMatch[1] : '',
                cookies: cookies,
            };
            this.authInfo = newAuthInfo;
            await this.saveAuthInfo(newAuthInfo);
            return { isAuthenticated: true, authInfo: newAuthInfo };
        }
        catch (error) {
            console.error('WeChat auth check error:', error);
            return { isAuthenticated: false };
        }
    }
    async uploadImage(buffer, filename) {
        if (!this.authInfo) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const random = Math.random();
            const params = new URLSearchParams({
                action: 'upload_material',
                f: 'json',
                scene: '8',
                writetype: 'doublewrite',
                groupid: '1',
                ticket_id: this.authInfo.userName,
                ticket: this.authInfo.ticket,
                svr_time: String(this.authInfo.svrTime),
                token: this.authInfo.token,
                lang: 'zh_CN',
                seq: String(timestamp),
                t: String(random),
            });
            const url = `https://mp.weixin.qq.com/cgi-bin/filetransfer?${params.toString()}`;
            const form = new form_data_1.default();
            form.append('type', 'image/jpeg');
            form.append('id', String(timestamp));
            form.append('name', filename);
            form.append('lastModifiedDate', new Date().toUTCString());
            form.append('size', String(buffer.length));
            form.append('file', buffer, { filename: filename, contentType: 'image/jpeg' });
            const headers = this.getRequestHeaders();
            headers['Origin'] = 'https://mp.weixin.qq.com';
            headers['Referer'] = 'https://mp.weixin.qq.com/';
            // Combine form headers with our headers
            const formHeaders = form.getHeaders();
            const allHeaders = { ...headers, ...formHeaders };
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: allHeaders,
                body: form,
            });
            const result = await response.json();
            if (result.base_resp && result.base_resp.err_msg === 'ok') {
                return { success: true, cdnUrl: result.cdn_url };
            }
            else {
                return {
                    success: false,
                    error: result.base_resp?.err_msg || 'Upload failed',
                };
            }
        }
        catch (error) {
            console.error('Image upload error:', error);
            return { success: false, error: String(error) };
        }
    }
    async createDraft(title, author, content, digest) {
        if (!this.authInfo) {
            return { success: false, error: 'Not authenticated' };
        }
        try {
            const params = new URLSearchParams({
                t: 'ajax-response',
                sub: 'create',
                type: '77',
                token: this.authInfo.token,
                lang: 'zh_CN',
            });
            const url = `https://mp.weixin.qq.com/cgi-bin/operate_appmsg?${params.toString()}`;
            // Build form data with all required fields
            const form = new URLSearchParams();
            form.append('token', this.authInfo.token);
            form.append('lang', 'zh_CN');
            form.append('f', 'json');
            // Article content
            form.append(`title0`, title);
            form.append(`author0`, author);
            form.append(`content0`, content);
            form.append(`digest0`, digest || '');
            form.append(`show_cover_pic0`, '0');
            form.append(`need_open_comment0`, '1');
            form.append(`only_fans_can_comment0`, '0');
            const headers = this.getRequestHeaders();
            headers['Origin'] = 'https://mp.weixin.qq.com';
            headers['Referer'] = 'https://mp.weixin.qq.com/';
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: headers,
                body: form.toString(),
            });
            const result = await response.json();
            if (result.errmsg === 'ok' || result.base_resp?.err_msg === 'ok') {
                const appMsgId = result.appMsgId || result.appmsgid;
                const draftUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid=${appMsgId}&token=${this.authInfo.token}&lang=zh_CN`;
                return { success: true, appMsgId, draftUrl };
            }
            else {
                const errMsg = result.errmsg || result.base_resp?.err_msg || 'Create draft failed';
                return { success: false, error: errMsg };
            }
        }
        catch (error) {
            console.error('Create draft error:', error);
            return { success: false, error: String(error) };
        }
    }
    getRequestHeaders() {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        if (this.authInfo?.cookies) {
            headers['Cookie'] = this.authInfo.cookies
                .map(cookie => cookie.split(';')[0])
                .join('; ');
        }
        return headers;
    }
}
exports.WeChatService = WeChatService;
//# sourceMappingURL=WeChatService.js.map