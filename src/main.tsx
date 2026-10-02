import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 見出し用フォント（ロゴが日本語なので日本語も読み込み。使う文字のファイルだけが読み込まれます）
import '@fontsource/dela-gothic-one/latin.css';
import '@fontsource/dela-gothic-one/japanese.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
