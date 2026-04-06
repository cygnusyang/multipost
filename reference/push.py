import re
from playwright.sync_api import Playwright, sync_playwright, expect


def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    page.goto("https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=765061702")
    page.get_by_title("内容管理").click()
    page.get_by_role("link", name="草稿箱").click()
    page.get_by_text("新的创作").click()
    with page.expect_popup() as page1_info:
        page.get_by_role("link", name="写新文章").click()
    page1 = page1_info.value
    page1.get_by_role("textbox", name="请在这里输入标题").click()
    page1.get_by_role("textbox", name="请在这里输入标题").click()
    page1.get_by_role("textbox", name="请在这里输入标题").fill("")
    page1.get_by_role("textbox", name="请在这里输入标题").press("CapsLock")
    page1.get_by_role("textbox", name="请在这里输入标题").fill("文章题目")
    page1.get_by_role("textbox", name="请在这里输入标题").press("Tab")
    page1.get_by_role("textbox", name="请输入作者").press("ArrowDown")
    page1.get_by_role("textbox", name="请输入作者").press("ArrowDown")
    page1.get_by_text("Cygnus Yang").click()
    page1.locator("section").click()
    page1.locator("div").filter(has_text=re.compile(r"^从这里开始写正文$")).nth(5).fill("文章正文")
    page1.goto("https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&reprint_confirm=0&timestamp=1775460615225&type=77&appmsgid=100000367&token=765061702&lang=zh_CN")
    page1.get_by_role("button", name="保存为草稿").click()
    page1.get_by_role("button", name="发表").click()
    page1.locator(".icon20_common.add_cover").click()
    page1.get_by_role("link", name="AI 配图").click()
    page1.get_by_role("textbox", name="请描述你想要创作的内容").click()
    page1.get_by_role("textbox", name="请描述你想要创作的内容").fill("智能体\n")
    page1.get_by_role("img").nth(4).click()
    page1.locator("div:nth-child(2) > .style_img_wp").click()
    page1.get_by_role("button", name="使用").click()
    page1.get_by_role("button", name="确认").click()
    page1.get_by_text("未声明").click()
    page1.locator(".weui-desktop-icon-checkbox").click()
    page1.get_by_role("button", name="确定").click()
    page1.locator("#js_reward_setting_area").get_by_text("不开启").click()
    page1.get_by_text("西格里斯").nth(2).click()
    page1.locator(".weui-desktop-icon-checkbox").click()
    page1.get_by_role("button", name="确定").click()
    page1.locator("#js_article_tags_area").get_by_text("未添加").click()
    page1.get_by_role("textbox", name="请选择合集").click()
    page1.get_by_text("智能体").click()
    page1.get_by_role("button", name="确认").click()
    page1.get_by_role("button", name="保存为草稿").click()
    page1.get_by_role("button", name="发表").click()
    page1.locator("#vue_app").get_by_role("button", name="发表").click()
    page1.get_by_role("button", name="继续发表").click()
    page1.goto("https://mp.weixin.qq.com/cgi-bin/home?t=home/index&token=765061702&lang=zh_CN")
    page1.locator(".menu-folder").first.click()
    page1.get_by_role("link", name="发表记录").click()

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
