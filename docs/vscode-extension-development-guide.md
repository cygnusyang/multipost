# VSCode 插件开发官方文档

本文档整理自 Visual Studio Code 官方扩展 API 文档。

# 目录

- [Extension API 概述](#extension-api-概述)
- [开发扩展入门](#开发扩展入门)
- [第一个扩展 - Hello World](#第一个扩展---hello-world)

---

# Extension API 概述

Visual Studio Code 天生具有可扩展性。从 UI 到编辑体验，几乎每个部分都可以通过 Extension API 进行自定义和增强。事实上，许多 VS Code 的核心功能都是作为扩展构建的，并使用相同的 Extension API。

本文档描述：

- 如何构建、运行、调试、测试和发布扩展
- 如何利用 VS Code 丰富的 Extension API
- 在哪里可以找到指南和代码示例帮助你入门
- 遵循我们的 UX 指南来获得最佳实践

代码示例可在 [Microsoft/vscode-extension-samples](https://github.com/microsoft/vscode-extension-samples) 获取。

如果你正在寻找已发布的扩展，请前往 [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode)。

## 扩展可以做什么？

以下是你可以使用 Extension API 实现的一些示例：

- 使用颜色或文件图标主题更改 VS Code 的外观 - **主题化**
- 在 UI 中添加自定义组件和视图 - **扩展工作台**
- 创建 Webview 来显示使用 HTML/CSS/JS 构建的自定义网页 - **Webview 指南**
- 支持新的编程语言 - **语言扩展概述**
- 支持调试特定运行时 - **调试器扩展指南**

如果你希望对 Extension API 有更全面的了解，请参考 [Extension Capabilities Overview](https://code.visualstudio.com/api/extension-capabilities/overview) 页面。[Extension Guides Overview](https://code.visualstudio.com/api/extension-guides/overview) 还包含一个代码示例列表和指南，说明了各种 Extension API 的用法。

## 如何构建扩展？

构建一个好的扩展可能需要很多时间和精力。API 文档的每个部分都可以帮助你：

- **Get Started** 使用 Hello World 示例教授构建扩展的基本概念。
- **Extension Capabilities** 将 VS Code 庞大的 API 剖析为更小的类别，并指向更详细的主题。
- **Extension Guides** 包含指南和代码示例，解释 VS Code Extension API 的特定用法。
- **UX Guidelines** 展示了在扩展中提供出色用户体验的最佳实践。
- **Language Extensions** 说明了如何使用指南和代码示例添加对编程语言的支持。
- **Testing and Publishing** 包含有关各种扩展开发主题的深入指南，例如测试和发布扩展。
- **Advanced Topics** 解释高级概念，如 Extension Host、支持远程开发和 GitHub Codespaces 以及 Proposed API。
- **References** 包含 VS Code API、Contribution Points 等许多主题的详尽参考。

## 有什么新功能？

VS Code 每月更新一次，Extension API 也是如此。每个月都会有新的功能和 API 可用，以增加 VS Code 扩展的功能和范围。

要了解最新的 Extension API，你可以查看每月发行说明，其中有专门的部分介绍：

- 扩展创作 - 了解最新版本中有哪些新的扩展 API 可用。
- 提议的扩展 API - 查看并对即将推出的提议 API 提供反馈。

## 获取帮助

如果你对扩展开发有疑问，可以尝试在以下地方提问：

- **VS Code Discussions**: GitHub 社区，用于讨论 VS Code 的扩展平台，提问，帮助社区其他成员，并获得答案。
- **Stack Overflow**: 有数以千计标记为 `vscode-extensions` 的问题，其中超过一半已经有答案。搜索你的问题，提问，或者通过回答 VS Code 扩展开发问题来帮助你的开发者伙伴！
- **VS Code Dev Slack**: 扩展开发者的公共聊天室。VS Code 团队成员经常加入对话。

要提供有关文档的反馈，请在 [Microsoft/vscode-docs](https://github.com/microsoft/vscode-docs) 创建新 issue。如果你有扩展问题无法找到答案，或者 VS Code Extension API 有问题，请在 [Microsoft/vscode](https://github.com/microsoft/vscode) 打开新 issue。

---

# 开发扩展入门

Visual Studio Code 天生具有可扩展性。从 UI 到编辑体验，几乎每个部分都可以通过 Extension API 进行自定义和增强。事实上，许多 VS Code 的核心功能都是作为扩展构建的，并使用相同的 Extension API。

本文档描述：

- 如何构建、运行、调试、测试和发布扩展
- 如何利用 VS Code 丰富的 Extension API
- 在哪里可以找到指南和代码示例帮助你入门
- 遵循我们的 UX 指南来获得最佳实践

代码示例可在 [Microsoft/vscode-extension-samples](https://github.com/microsoft/vscode-extension-samples) 获取。

如果你正在寻找已发布的扩展，请前往 [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode)。

## 扩展可以做什么？

以下是你可以使用 Extension API 实现的一些示例：

- 更改 VS Code 的外观，使用颜色主题或文件图标主题 - 主题化
- 在 UI 中添加自定义组件和视图 - 扩展工作台
- 创建 Webview 来显示使用 HTML/CSS/JS 构建的自定义网页 - Webview 指南
- 支持新的编程语言 - 语言扩展概述
- 支持调试特定运行时 - 调试器扩展指南

如果你希望对 Extension API 有更全面的了解，请参考 Extension Capabilities Overview 页面。Extension Guides Overview 还包含一个代码示例列表和指南，说明了各种 Extension API 的用法。

## 如何构建扩展？

构建一个好的扩展可能需要很多时间和努力。以下是 API 文档每个部分可以帮助你的地方：

- **Get Started** 使用 Hello World 示例教授构建扩展的基本概念。
- **Extension Capabilities** 将 VS Code 庞大的 API 剖析为更小的类别，并指向更详细的主题。
- **Extension Guides** 包含指南和代码示例，解释 VS Code Extension API 的特定用法。
- **UX Guidelines** 展示了在扩展中提供出色用户体验的最佳实践。
- **Language Extensions** 说明了如何使用指南和代码示例添加对编程语言的支持。
- **Testing and Publishing** 包含有关各种扩展开发主题的深入指南，例如测试和发布扩展。
- **Advanced Topics** 解释高级概念，如 Extension Host、支持远程开发和 GitHub Codespaces 以及 Proposed API。
- **References** 包含 VS Code API、Contribution Points 等许多主题的详尽参考。

## 最新动态

VS Code 每月更新一次，Extension API 也是如此。每个月都会有新的功能和 API 可用，以增加 VS Code 扩展的能力和范围。

要了解最新的 Extension API，你可以查看每月发行说明，其中有专门的部分介绍：

- 扩展创作 - 了解最新版本中有哪些新的扩展 API 可用。
- 提议的扩展 API - 查看并对即将推出的提议 API 提供反馈。

## 获取帮助

如果你对扩展开发有疑问，可以尝试在以下地方提问：

- **VS Code Discussions**: GitHub 社区，用于讨论 VS Code 的扩展平台，提问，帮助社区其他成员，并获得答案。
- **Stack Overflow**: 有数以千计标记为 `vscode-extensions` 的问题，其中超过一半已经有答案。搜索你的问题，提问，或者通过回答 VS Code 扩展开发问题来帮助你的开发者伙伴！
- **VS Code Dev Slack**: 扩展开发者的公共聊天室。VS Code 团队成员经常加入对话。

要提供有关文档的反馈，请在 [Microsoft/vscode-docs](https://github.com/microsoft/vscode-docs) 创建新 issue。如果你有扩展问题无法找到答案，或者 VS Code Extension API 有问题，请在 [Microsoft/vscode](https://github.com/microsoft/vscode) 打开新 issue。

---

# 第一个扩展 - Hello World

在本主题中，我们将教你构建扩展的基本概念。确保你已经安装了 Node.js 和 Git。

首先，使用 Yeoman 和 VS Code Extension Generator 搭建一个准备开发的 TypeScript 或 JavaScript 项目。

如果你不想全局安装 Yeoman供以后使用，运行以下命令：

```bash
npx --package yo --package generator-code -- yo code
```

如果你想全局安装 Yeoman 以方便重复运行，运行以下命令：

```bash
npm install --global yo generator-code
yo code
```

对于 TypeScript 项目，填写以下字段：

```
# ? What type of extension do you want to create? New Extension (TypeScript)
# ? What's the name of your extension? HelloWorld
### Press <Enter> to choose default for all options below ###

# ? What's the identifier of your extension? helloworld
# ? What's the description of your extension? LEAVE BLANK
# ? Initialize a git repository? Y
# ? Which bundler to use? unbundled
# ? Which package manager to use? npm

# ? Do you want to open the new folder with Visual Studio Code? Open with `code`
```

在编辑器中，打开 `src/extension.ts` 并按 F5 或从命令面板（⇧⌘P (Windows, Linux Ctrl+Shift+P)）运行命令 **Debug: Start Debugging**。这将在一个新的**扩展开发主机**窗口中编译并运行扩展。

在新窗口中从命令面板（⇧⌘P (Windows, Linux Ctrl+Shift+P)）运行 Hello World 命令：

你应该会看到 `Hello World from HelloWorld!` 通知弹出。成功！

如果你在调试窗口中看不到 Hello World 命令，请检查 `package.json` 文件，确保 `engines.vscode` 版本与已安装的 VS Code 版本兼容。

## 开发扩展

让我们修改消息：

1. 在 `extension.ts` 中将消息从 "Hello World from HelloWorld!" 更改为 "Hello VS Code"。
2. 在新窗口中运行 **Developer: Reload Window**。
3. 再次运行 Hello World 命令。

你应该会看到更新后的消息显示出来。

这里有一些你可以尝试的想法：

- 在命令面板中为 Hello World 命令提供一个新名称。
- 添加另一个在信息消息中显示当前时间的命令。Contribution points 是你在 `package.json` 扩展清单中进行的静态声明，用于扩展 VSCode，例如向扩展添加命令、菜单或快捷键绑定。
- 将 `vscode.window.showInformationMessage` 替换为另一个 VS Code API 调用来显示警告消息。

## 调试扩展

VS Code 的内置调试功能使调试扩展变得容易。通过单击行旁的装订线设置断点，VS Code 会在断点处停止。你可以将鼠标悬停在编辑器中的变量上，或使用左侧的运行和调试视图检查变量的值。调试控制台允许你计算表达式。

你可以在 Node.js 调试主题中了解更多关于在 VS Code 中调试 Node.js 应用的信息。

## 下一步

在下一个主题 **Extension Anatomy** 中，我们将更仔细地查看 Hello World 示例的源代码并解释关键概念。

你可以在以下位置找到本教程的源代码：https://github.com/microsoft/vscode-extension-samples/tree/main/helloworld-sample。Extension Guides 主题包含其他示例，每个示例都说明了不同的 VS Code API 或 Contribution Point，并遵循我们的 UX 指南中的建议。

### 使用 JavaScript

在本指南中，我们主要描述如何使用 TypeScript 开发 VS Code 扩展，因为我们相信 TypeScript 为开发 VS Code 扩展提供了最佳体验。但是，如果你更喜欢 JavaScript，你仍然可以使用 helloworld-minimal-sample 跟着操作。

### UX 指南

这也是回顾我们的 UX 指南的好时机，你可以开始设计扩展用户界面以遵循 VS Code 最佳实践。

---

# 来源

- [Visual Studio Code Extension API](https://code.visualstudio.com/api)
- [Developing Extensions](https://code.visualstudio.com/docs/extensions/developing-extensions)
- [Your First Extension](https://code.visualstudio.com/docs/extensions/example-hello-world)

**下载时间**: 2026-04-05
