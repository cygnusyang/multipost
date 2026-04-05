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
`;
