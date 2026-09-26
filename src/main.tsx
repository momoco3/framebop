import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 見出し用フォント（英字のみ読み込み。日本語はシステムフォントで表示）
import '@fontsource/dela-gothic-one/latin.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
