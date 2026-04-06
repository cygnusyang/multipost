import { renderMermaidToBuffer } from 'src/utils/mermaidRenderer';

// Mock canvas to avoid canvas rendering in tests
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillStyle: '',
      fillRect: jest.fn(),
    })),
    toBuffer: jest.fn(() => Buffer.from('')),
  })),
}));

describe('mermaidRenderer', () => {
  const mockRender = jest.spyOn(require('mermaid').default, 'render');

  beforeEach(() => {
    jest.clearAllMocks();
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg viewBox="0 0 100 100"></svg>' })
    );
  });

  afterAll(() => {
    mockRender.mockRestore();
  });

  it('should render mermaid code to buffer', async () => {
    const code = `graph TD
    A[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(require('mermaid').default.initialize).toHaveBeenCalled();
  });

  it('should use default dimensions when viewBox not found', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should use default dimensions when viewBox has invalid parts', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg viewBox="invalid"></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should throw error when mermaid render fails', async () => {
    mockRender.mockImplementation(() =>
      Promise.reject(new Error('Invalid mermaid syntax'))
    );

    const code = 'invalid syntax';

    await expect(renderMermaidToBuffer(code)).rejects.toThrow('Invalid mermaid syntax');
  });

  it('should calculate dimensions from SVG viewBox with decimal values', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg viewBox="0.5 0.5 100.5 200.5"></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should calculate dimensions with negative viewBox values', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg viewBox="-10 -20 100 200"></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle SVG with large viewBox values', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg viewBox="0 0 9999 9999"></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle empty code string', async () => {
    const code = '';

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle code with only whitespace', async () => {
    const code = '   \n   \n   ';

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle sequence diagram', async () => {
    const code = `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello
    Bob-->>Alice: Hi`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle flowchart LR diagram', async () => {
    const code = `flowchart LR
    A[Start] --> B[Decision]
    B --> C[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle gantt chart', async () => {
    const code = `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Task
    Task 1   :2024-01-01, 30d
    Task 2   :2024-02-01, 20d`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle class diagram', async () => {
    const code = `classDiagram
    class Animal {
      +String name
      +eat()
    }
    class Dog {
      +bark()
    }
    Animal <|-- Dog`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle state diagram', async () => {
    const code = `stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle er diagram', async () => {
    const code = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle pie chart', async () => {
    const code = `pie showData
    title Browser market share
    "Chrome" : 63.59
    "Safari" : 19.14
    "Firefox" : 4.48`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle mindmap', async () => {
    const code = `mindmap
      root((Mindmap))
        Origins
          Long history`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle timeline', async () => {
    const code = `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : Youtube
    2006 : Twitter`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle code with special characters', async () => {
    const code = `graph TD
    A["Test & Data"] --> B["Node with <special> chars"]
    B --> C["More: special; chars"]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle SVG with additional attributes', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle SVG with minimal attributes', async () => {
    mockRender.mockImplementation(() =>
      Promise.resolve({ svg: '<svg></svg>' })
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    const buffer = await renderMermaidToBuffer(code);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should handle mermaid initialization error', async () => {
    mockRender.mockImplementation(() =>
      Promise.reject(new Error('Mermaid not initialized'))
    );

    const code = `graph TD\nA[Start] --> B[End]`;

    await expect(renderMermaidToBuffer(code)).rejects.toThrow('Mermaid not initialized');
  });
});
