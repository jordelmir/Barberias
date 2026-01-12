import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global error handler for browser debugging
window.onerror = function (message, source, lineno, colno, error) {
  const errorMsg = document.createElement('div');
  errorMsg.style.position = 'fixed';
  errorMsg.style.top = '0';
  errorMsg.style.left = '0';
  errorMsg.style.width = '100%';
  errorMsg.style.background = 'red';
  errorMsg.style.color = 'white';
  errorMsg.style.padding = '10px';
  errorMsg.style.zIndex = '9999';
  errorMsg.style.fontSize = '12px';
  errorMsg.style.wordBreak = 'break-all';
  errorMsg.innerHTML = `🚨 ERROR: ${message}<br>At: ${source}:${lineno}:${colno}`;
  document.body.appendChild(errorMsg);
  console.error('Global capture:', error);
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}