import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import { useMarkdownProcessor } from './hooks/useMarkdownProcessor';
import { MessageFromExtension, MessageToExtension } from './types';

import './styles/App.css';

declare const acquireVsCodeApi: () => {
  postMessage: (message: MessageToExtension) => void;
};

const vscode = acquireVsCodeApi();

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [isWeChatLoggedIn, setIsWeChatLoggedIn] = useState(false);
  const [weChatUserName, setWeChatUserName] = useState('');
  const { processedHtml, processMarkdown } = useMarkdownProcessor();

  useEffect(() => {
    const handler = (event: MessageEvent<MessageFromExtension>) => {
      const msg = event.data;
      if (msg.type === 'updateMarkdown') {
        setMarkdown(msg.markdown);
        processMarkdown(msg.markdown);
      } else if (msg.type === 'wechatAuthStatus') {
        setIsWeChatLoggedIn(msg.loggedIn);
        setWeChatUserName(msg.userName || '');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [processMarkdown]);

  const handleUpload = () => {
    vscode.postMessage({ type: 'uploadToWeChat' });
  };

  const handleCopy = () => {
    vscode.postMessage({ type: 'copyHtml', html: processedHtml });
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div className="app-container">
        <Toolbar
          isLoggedIn={isWeChatLoggedIn}
          userName={weChatUserName}
          onCopy={handleCopy}
          onUpload={handleUpload}
        />
        <Preview html={processedHtml} />
      </div>
    </ConfigProvider>
  );
};

export default App;
