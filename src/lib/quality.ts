// 画質プリセット（High / Medium / Small File）の中身です。
// 数字を変えると画質とファイルサイズのバランスを調整できます。
import type { Quality } from '../types';

export type QualityValues = {
  label: string;
  description: string;
  /** GIF の最大色数（最大256） */
  gifColors: number;
  /** GIF の減色の細かさ。rgb444 のほうがファイルが小さくなりやすい */
  gifColorFormat: 'rgb565' | 'rgb444';
  /** WebP の画質（0〜1） */
  webpQuality: number;
  /** MP4 のビットレート係数（1ピクセルあたり bps） */
  mp4BitsPerPixel: number;
};

export const QUALITY_VALUES: Record<Quality, QualityValues> = {
  high: {
    label: 'High',
    description: 'きれい優先',
    gifColors: 256,
    gifColorFormat: 'rgb565',
    webpQuality: 0.9,
    mp4BitsPerPixel: 6,
  },
  medium: {
    label: 'Medium',
    description: 'バランス',
    gifColors: 128,
    gifColorFormat: 'rgb565',
    webpQuality: 0.78,
    mp4BitsPerPixel: 3,
  },
  small: {
    label: 'Small File',
    description: '軽さ優先',
    gifColors: 48,
    gifColorFormat: 'rgb444',
    webpQuality: 0.6,
    mp4BitsPerPixel: 1.5,
  },
};
