// Default WeChat theme CSS
export const defaultWechatTheme = `
/* Base styles */
body {
  margin: 0;
  padding: 16px;
  background-color: #ffffff;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  word-wrap: break-word;
}

/* Headings */
h1 {
  font-size: 22px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #000000;
  font-weight: bold;
}

h2 {
  font-size: 20px;
  margin-top: 32px;
  margin-bottom: 16px;
  color: #000000;
  font-weight: bold;
}

h3 {
  font-size: 18px;
  margin-top: 24px;
  margin-bottom: 12px;
  color: #000000;
  font-weight: bold;
}

/* Paragraph */
p {
  margin-top: 0;
  margin-bottom: 16px;
}

/* Lists */
ul, ol {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

li {
  margin-bottom: 4px;
}

/* Code blocks */
pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow-x: auto;
  margin-top: 0;
  margin-bottom: 16px;
}

code {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 85%;
}

pre code {
  background-color: transparent;
  padding: 0;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding-left: 16px;
  margin-left: 0;
  margin-right: 0;
  margin-top: 0;
  margin-bottom: 16px;
}

/* Tables */
table {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

thead {
  background-color: #f6f8fa;
}

th, td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 4px;
}

/* Horizontal rule */
hr {
  background-color: #dfe2e5;
  border: 0;
  height: 1px;
  margin: 24px 0;
}

/* Links */
a {
  color: #0366d6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Highlight.js */
.hljs {
  display: block;
  overflow-x: auto;
  padding: 0;
  background: transparent;
}

.hljs-comment,
.hljs-quote {
  color: #6a737d;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #d73a49;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
  color: #22863a;
}

.hljs-literal {
  color: #005cc5;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta-string {
  color: #032f62;
}

.hljs-built_in,
.hljs-class .hljs-title {
  color: #6f42c1;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #005cc5;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #005cc5;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}
`;
