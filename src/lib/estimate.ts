// 書き出す前に「だいたいのファイルサイズ」を見積もります。
// 小さく縮めた見本フレームを実際に圧縮してみて、その結果から全体を推定します。
import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { Frame, Settings, TimelineStep } from '../types';
import { createCanvas, drawFrame, type Size } from './drawFrame';
import { buildMp4Timeline, getMp4Bitrate } from './encodeMp4';
import { QUALITY_VALUES } from './quality';
import { getTotalDurationMs } from './timeline';

const SAMPLE_LONG_SIDE = 240;

export function estimateFileSize(
  frames: Frame[],
  timeline: TimelineStep[],
  size: Size,
  settings: Settings,
): number {
  if (frames.length === 0 || timeline.length === 0) return 0;
  const pixels = size.width * size.height;

  if (settings.format === 'mp4') {
    const duration = getTotalDurationMs(buildMp4Timeline(timeline, settings.loop)) / 1000;
    return Math.round((getMp4Bitrate(size, settings) * duration) / 8) + 2000;
  }

  // 見本にする画像（最大3枚）
  const sampleIndexes = [...new Set([0, Math.floor(frames.length / 2), frames.length - 1])];
  const scale = Math.min(1, SAMPLE_LONG_SIDE / Math.max(size.width, size.height));
  const sampleSize = {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
  const { canvas, ctx } = createCanvas(sampleSize, true);
  const quality = QUALITY_VALUES[settings.quality];

  let bytesPerPixel = 0;
  for (const index of sampleIndexes) {
    drawFrame(ctx, frames[index], sampleSize, settings.background, settings.fit);
    let bytes: number;
    if (settings.format === 'gif') {
      const { data } = ctx.getImageData(0, 0, sampleSize.width, sampleSize.height);
      const palette = quantize(data, quality.gifColors, { format: quality.gifColorFormat });
      const encoder = GIFEncoder();
      encoder.writeFrame(applyPalette(data, palette, quality.gifColorFormat), sampleSize.width, sampleSize.height, { palette });
      bytes = encoder.bytes().length;
    } else {
      const dataUrl = canvas.toDataURL('image/webp', quality.webpQuality);
      bytes = Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);
    }
    bytesPerPixel += bytes / (sampleSize.width * sampleSize.height);
  }
  bytesPerPixel /= sampleIndexes.length;

  // 縮小した見本はピクセルあたりの情報量が多めなので、大きい画像向けに少し割り引く
  const sizeFactor = scale < 1 ? 0.75 : 1;
  // Ping-Pong などで同じ画像が何度出てきても、GIF / WebP ではコマごとにデータが入ります
  return Math.round(bytesPerPixel * sizeFactor * pixels * timeline.length) + 1000;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
