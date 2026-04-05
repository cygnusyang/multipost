import React from 'react';
import { Button, Space, Tag } from 'antd';
import { CopyOutlined, CloudUploadOutlined } from '@ant-design/icons';

import './Toolbar.css';

interface ToolbarProps {
  isLoggedIn: boolean;
  userName: string;
  onCopy: () => void;
  onUpload: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ isLoggedIn, userName, onCopy, onUpload }) => {
  return (
    <div className="toolbar-container">
      <Space>
        <Button icon={<CopyOutlined />} onClick={onCopy}>
          Copy HTML
        </Button>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={onUpload}
          disabled={!isLoggedIn}
        >
          Upload to WeChat
        </Button>
      </Space>
      <div className="auth-status">
        {isLoggedIn ? (
          <Tag color="green">Logged in as {userName}</Tag>
        ) : (
          <Tag color="red">Not logged in</Tag>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
