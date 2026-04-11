import re
from playwright.sync_api import Playwright, sync_playwright, expect


def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    page.goto("https://mp.weixin.qq.com/")
    page.get_by_role("img").click()
    page.goto("https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=844145069")
    page.get_by_role("link", name="首页").click()
    page.get_by_text("内容管理").click()
    page.get_by_role("link", name="草稿箱").click()
    page.locator(".weui-desktop-card__icon-add").click()
    with page.expect_popup() as page1_info:
        page.get_by_role("link", name="写新文章").click()
    page1 = page1_info.value
    page1.get_by_role("textbox", name="请在这里输入标题").click()
    page1.get_by_role("textbox", name="请在这里输入标题").click()
    page1.get_by_role("textbox", name="请在这里输入标题").fill("title")
    page1.get_by_role("textbox", name="请输入作者").click()
    page1.get_by_role("textbox", name="请输入作者").fill("author")
    page1.locator("section").click()
    page1.locator("div").filter(has_text=re.compile(r"^从这里开始写正文$")).nth(5).fill("AAA")
    page1.locator("#bot_bar_left_container").get_by_text("文章设置").click()
    page1.locator(".icon20_common.add_cover").click()
    page1.get_by_role("link", name="AI 配图").click()
    page1.get_by_role("textbox", name="请描述你想要创作的内容").click()
    page1.get_by_role("textbox", name="请描述你想要创作的内容").click()
    page1.get_by_role("textbox", name="请描述你想要创作的内容").fill("title")
    page1.get_by_role("button", name="开始创作").click()
    page1.locator("div:nth-child(11) > .ai-image-list > div:nth-child(2) > .ai-image-item-wrp").click()
    page1.get_by_role("button", name="使用").click()
    page1.get_by_role("button", name="确认").click()
    page1.get_by_text("原创").nth(2).click()
    page1.get_by_text("文字原创").click()
    page1.locator("#js_original_edit_box").get_by_role("textbox", name="请输入作者").click()
    with page1.expect_popup() as page2_info:
        page1.locator(".original_agreement").click()
    page2 = page2_info.value
    page2.close()
    page1.locator(".weui-desktop-icon-checkbox").click()
    page1.get_by_role("button", name="确定").click()
    page1.locator("#js_reward_setting_area").get_by_text("不开启").click()
    page1.get_by_role("textbox", name="选择或搜索赞赏账户").click()
    page1.get_by_text("赞赏类型").click()
    page1.locator("#vue_app").get_by_text("赞赏账户", exact=True).click()
    page1.get_by_text("赞赏自动回复").click()
    page1.locator(".weui-desktop-icon-checkbox").click()
    page1.get_by_role("button", name="确定").click()
    page1.locator("#js_article_tags_area").get_by_text("未添加").click()
    page1.get_by_role("textbox", name="请选择合集").click()
    page1.get_by_text("智能体").click()
    page1.get_by_text("每篇文章最多添加1个合集").click()
    page1.get_by_role("button", name="确认").click()
    page1.get_by_role("button", name="发表").click()
    page1.get_by_text("群发通知", exact=True).click()
    page1.get_by_text("定时发表", exact=True).click()
    page1.locator("#vue_app").get_by_role("button", name="发表").click()
    page1.get_by_text("未开启群发通知", exact=True).click()
    page1.get_by_text("内容将展示在公众号主页，若允许平台推荐，内容有可能被推荐至看一看或其他推荐场景。").click()
    page1.get_by_role("button", name="继续发表").click()
    page1.get_by_text("扫码后，请联系管理员进行验证").click()

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
