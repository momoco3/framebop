// 1フレームをキャンバスに描く処理です。プレビューと書き出しで共通です。
import type { FitMode, Frame, Resolution } from '../types';

export type Size = { width: number; height: number };

/**
 * 出力サイズを決めます。
 * 基準は1枚目の画像。Resolution は「長辺のピクセル数」で、元画像より大きくはしません。
 * MP4 は縦横とも偶数である必要があるので evenSize で調整します。
 */
export function getOutputSize(frames: Frame[], resolution: Resolution, evenSize = false): Size {
  if (frames.length === 0) return { width: 0, height: 0 };
  const { width, height } = frames[0];
  const longSide = Math.max(width, height);
  const target = resolution === 'original' ? longSide : Math.min(resolution, longSide);
  const scale = target / longSide;
  let w = Math.max(1, Math.round(width * scale));
  let h = Math.max(1, Math.round(height * scale));
  if (evenSize) {
    w = Math.max(2, w - (w % 2));
    h = Math.max(2, h - (h % 2));
  }
  return { width: w, height: h };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  size: Size,
  background: string,
  fit: FitMode,
) {
  const { width, height } = size;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const scale =
    fit === 'contain'
      ? Math.min(width / frame.width, height / frame.height)
      : Math.max(width / frame.width, height / frame.height);
  const drawWidth = frame.width * scale;
  const drawHeight = frame.height * scale;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    frame.image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

export function createCanvas(size: Size, willReadFrequently = false) {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d', { willReadFrequently });
  if (!ctx) throw new Error('Canvas を作成できませんでした');
  return { canvas, ctx };
}
