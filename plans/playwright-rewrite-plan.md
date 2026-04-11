# Playwright WeChat 插件改写计划

## 目标任务
严格参考 [`test.py`](../test.py:1) 的逻辑，使用 Playwright TypeScript 版本改写当前的 WeChat 插件。

## test.py 完整流程分析

### 步骤详解

1. **导航到微信公众号主页**
   ```python
   page.goto("https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=1237902160")
   ```

2. **点击内容管理**
   ```python
   page.get_by_text("内容管理").click()
   ```

3. **点击草稿箱**
   ```python
   page.get_by_role("link", name="草稿箱").click()
   ```

4. **点击添加按钮**
   ```python
   page.locator(".weui-desktop-card__icon-add").click()
   ```

5. **点击写新文章（等待弹窗）**
   ```python
   with page.expect_popup() as page1_info:
       page.get_by_role("link", name="写新文章").click()
   page1 = page1_info.value
   ```

6. **填写标题**
   ```python
   page1.get_by_role("textbox", name="请在这里输入标题").click()
   page1.get_by_role("textbox", name="请在这里输入标题").fill("title")
   ```

7. **填写作者**
   ```python
   page1.get_by_role("textbox", name="请输入作者").click()
   page1.get_by_role("textbox", name="请输入作者").fill("author")
   ```

8. **填写正文**
   ```python
   page1.locator("section").click()
   page1.locator("div").filter(has_text=re.compile(r"^从这里开始写正文$")).nth(5).fill("AAAA")
   ```

9. **点击文章设置**
   ```python
   page1.locator("#bot_bar_left_container").get_by_text("文章设置").click()
   ```

10. **填写摘要**
    ```python
    page1.get_by_role("textbox", name="选填，不填写则默认抓取正文开头部分文字，摘要会在转发卡片和公众号会话展示。").click()
    page1.get_by_role("textbox", name="选填，不填写则默认抓取正文开头部分文字，摘要会在转发卡片和公众号会话展示。").fill("title")
    ```

11. **点击添加封面（两次）**
    ```python
    page1.locator(".icon20_common.add_cover").click()
    page1.locator(".icon20_common.add_cover").click()
    ```

12. **点击 AI 配图**
    ```python
    page1.get_by_role("link", name="AI 配图").click()
    ```

13. **输入描述**
    ```python
    page1.get_by_role("textbox", name="请描述你想要创作的内容").click()
    page1.get_by_role("textbox", name="请描述你想要创作的内容").fill("title")
    ```

14. **点击开始创作**
    ```python
    page1.get_by_role("button", name="开始创作").click()
    ```

15. **选择图片**
    ```python
    page1.locator("div:nth-child(8) > .ai-image-list > div:nth-child(4) > .ai-image-item-wrp").click()
    ```

16. **点击使用**
    ```python
    page1.get_by_role("button", name="使用").click()
    ```

17. **点击确认**
    ```python
    page1.get_by_role("button", name="确认").click()
    ```

18. **点击未声明（原创声明）**
    ```python
    page1.get_by_text("未声明").click()
    ```

19. **点击复选框**
    ```python
    page1.locator(".weui-desktop-icon-checkbox").click()
    ```

20. **点击确定**
    ```python
    page1.get_by_role("button", name="确定").click()
    ```

21. **点击不开启赞赏**
    ```python
    page1.locator("#js_reward_setting_area").get_by_text("不开启").click()
    ```

22. **点击确定**
    ```python
    page1.get_by_role("button", name="确定").click()
    ```

23. **点击未添加合集**
    ```python
    page1.locator("#js_article_tags_area").get_by_text("未添加").click()
    ```

24. **点击合集输入框**
    ```python
    page1.get_by_role("textbox", name="请选择合集").click()
    ```

25. **选择合集**
    ```python
    page1.get_by_text("智能体").click()
    ```

26. **点击确认**
    ```python
    page1.get_by_role("button", name="确认").click()
    ```

27. **点击发表**
    ```python
    page1.get_by_role("button", name="发表").click()
    ```

28. **点击发表确认**
    ```python
    page1.locator("#vue_app").get_by_role("button", name="发表").click()
    ```

29. **点击继续发表**
    ```python
    page1.get_by_role("button", name="继续发表").click()
    ```

## 当前实现与 test.py 的关键差异

| 步骤 | test.py 选择器 | PlaywrightService.ts 选择器 | 差异说明 |
|------|---------------|----------------------------|----------|
| 导航 | 带token的完整URL | 主页URL | URL不同 |
| 内容管理 | `get_by_text("内容管理")` | `getByTitle('内容管理')` | 定位方法不同 |
| 添加按钮 | `.weui-desktop-card__icon-add` | `getByText('新的创作')` | 选择器不同 |
| 正文 | `div.filter(has_text=...).nth(5)` | ProseMirror 选择器 | 选择器策略不同 |
| 文章设置 | `#bot_bar_left_container .get_by_text("文章设置")` | 未实现 | 缺失此步骤 |
| 摘要 | 长描述文本 | `getByRole('textbox', { name: '请输入摘要' })` | name 属性不同 |
| 封面 | 点击两次 | 点击一次 | 点击次数不同 |
| 开始创作 | ``get_by_role("button", name="开始创作")` | 使用 Enter 键 | 触发方式不同 |
| 选择图片 | `div:nth-child(8) > .ai-image-list > div:nth-child(4) > .` | `.style_img_wp img` | 选择器不同 |
| 发表 | `get_by_role("button", name="发表")` | 保存为草稿 | 功能不同 |

## 改写任务清单

### 1. 更新 createDraftInBrowser 方法签名
- 添加 `publish` 参数控制是保存草稿还是直接发表
- 添加 `collectionName` 参数用于指定合集名称

### 2. 重写导航流程
- 使用 `getByText("内容管理")` 替代 `getByTitle`
- 使用 `.weui-desktop-card__icon-add` 选择器
- 确保正确处理弹窗

### 3. 重写表单填写
- 标题：保持现有逻辑
- 作者：保持现有逻辑
- 正文：使用 test.py 的选择器策略

### 4. 实现文章设置流程
- 点击文章设置按钮
- 填写摘要（使用正确的 name 属性）
- 设置封面（点击两次）
- AI 配图流程（使用正确的选择器）

### 5. 实现原创声明流程
- 点击"未声明"
- 点击复选框
- 点击确定

### 6. 实现赞赏设置流程
- 点击"不开启"
- 点击确定

### 7. 实现合集设置流程
- 点击"未添加"
- 点击合集输入框
- 选择指定合集
- 点击确认

### 8. 实现发表流程
- 点击发表按钮
- 点击发表确认（在 #vue_app 内）
- 点击继续发表

## 实现细节

### TypeScript 选择器映射

```typescript
// 内容管理
page.getByText('内容管理').click()

// 添加按钮
page.locator('.weui-desktop-card__icon-add').click()

// 正文
page.locator('section').click()
page.locator('div').filter({ hasText: /^从这里开始写正文$/ }).nth(5).fill(content)

// 文章设置
page.locator('#bot_bar_left_container').getByText('文章设置').click()

// 摘要
page.getByRole('textbox', { name: '选填，不填写则默认抓取正文开头部分文字，摘要会在转发卡片和公众号会话展示。' }).fill(digest)

// 封面（点击两次）
page.locator('.icon20_common.add_cover').click()
page.locator('.icon20_common.add_cover').click()

// 开始创作
page.getByRole('button', { name: '开始创作' }).click()

// 选择图片
page.locator('div:nth-child(8) > .ai-image-list > div:nth-child(4) > .ai-image-item-wrp').click()

// 发表确认
page.locator('#vue_app').getByRole('button', { name: '发表' }).click()
```

## 注意事项

1. **等待策略**：每个操作后需要适当的等待时间
2. **错误处理**：添加 try-catch 块处理可能的失败
3. **日志记录**：保持详细的调试日志
4. **超时设置**：合理设置操作超时时间
5. **弹窗处理**：确保正确处理新窗口/弹窗

## 测试计划

1. 单元测试：测试各个独立方法
2. 集成测试：测试完整的创建草稿流程
3. 发表测试：测试完整的发表流程
4. 错误场景测试：测试各种失败情况的处理
