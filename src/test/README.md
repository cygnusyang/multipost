# 单元测试指南

## 目录结构

```
src/test/
├── __mocks__/          # Jest模拟模块
├── helpers/            # 测试辅助函数和工具
│   └── test-utils.ts   # 通用测试工具
├── unit/               # 单元测试
│   ├── extension.test.ts
│   ├── services/       # 服务层测试
│   │   ├── PreviewService.test.ts
│   │   ├── SettingsService.test.ts
│   │   ├── WeChatService.test.ts
│   │   └── defaultTheme.test.ts
│   └── utils/          # 工具函数测试
│       ├── extractTitle.test.ts
│       ├── mermaidRenderer.test.ts
│       └── processMarkdown.test.ts
└── README.md           # 本文件
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试
```bash
npm test -- --testPathPattern=WeChatService
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

### 监视模式（开发时使用）
```bash
npm test -- --watch
```

## 测试工具

### test-utils.ts
提供了常用的测试辅助函数：

```typescript
import { createMockVSCode, createMockResponse, createMockFileContent } from './helpers/test-utils';

// 创建模拟的VSCode API
const mockVSCode = createMockVSCode({
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
});

// 创建模拟的HTTP响应
const mockResponse = createMockResponse({ success: true }, 200);

// 创建模拟的文件内容
const mockFile = createMockFileContent('# Test Title\n\nContent');
```

## 测试规范

### 命名约定
- 测试文件：`*.test.ts`
- 测试描述：使用`describe()`函数分组
- 测试用例：使用`it()`或`test()`函数

### 模拟策略
- 外部依赖（如VSCode API）使用Jest模拟
- HTTP请求使用`node-fetch`模拟
- 文件系统操作使用内存模拟

### 覆盖率要求
项目配置了80%的覆盖率阈值：
- 分支覆盖率：80%
- 函数覆盖率：80%
- 行覆盖率：80%
- 语句覆盖率：80%

## 编写新测试

### 1. 创建测试文件
在适当的目录中创建`*.test.ts`文件。

### 2. 导入依赖
```typescript
import { MyService } from '../../services/MyService';
import { createMockVSCode } from '../helpers/test-utils';
```

### 3. 编写测试
```typescript
describe('MyService', () => {
  let service: MyService;
  let mockVSCode: any;

  beforeEach(() => {
    mockVSCode = createMockVSCode();
    service = new MyService(mockVSCode);
  });

  it('should do something', () => {
    // 测试逻辑
    expect(service.doSomething()).toBe(true);
  });
});
```

### 4. 运行测试
确保测试通过并满足覆盖率要求。

## 常见问题

### 1. 模块找不到错误
确保导入路径正确，使用相对路径从测试文件到源文件。

### 2. 模拟问题
检查`src/test/__mocks__/`目录中的模拟文件是否正确配置。

### 3. 覆盖率不足
运行`npm run test:coverage`查看具体哪些代码没有被测试覆盖。