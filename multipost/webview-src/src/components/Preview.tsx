import React from 'react';
import './Preview.css';

interface PreviewProps {
  html: string;
}

const Preview: React.FC<PreviewProps> = ({ html }) => {
  return (
    <div className="preview-container">
      <iframe
        className="preview-iframe"
        srcDoc={html}
        title="WeChat Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export default Preview;
