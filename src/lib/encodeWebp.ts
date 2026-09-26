// アニメーション WebP を作ります。
// 1枚ずつブラウザ標準の WebP 変換で静止画にしてから、
// アニメーション WebP の形式（RIFF / ANIM / ANMF）に自前で組み立てています。
// そのため追加ライブラリは不要です。
// 仕様: https://developers.google.com/speed/webp/docs/riff_container
import type { Frame, Settings, TimelineStep } from '../types';
import { createCanvas, drawFrame, type Size } from './drawFrame';
import { QUALITY_VALUES } from './quality';

/** このブラウザが WebP で書き出せるか（Safari は非対応のことが多い） */
export function canEncodeWebp(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

export async function encodeWebp(
  frames: Frame[],
  timeline: TimelineStep[],
  size: Size,
  settings: Settings,
  onProgress: (ratio: number) => void,
): Promise<Blob> {
  const { canvas, ctx } = createCanvas(size);
  const quality = QUALITY_VALUES[settings.quality].webpQuality;

  // 同じフレームが何度も出てくる（Ping-Pong など）場合は変換結果を使い回します
  const cache = new Map<number, Uint8Array[]>();
  const animationFrames: Uint8Array[] = [];
  let hasAlpha = false;

  for (let i = 0; i < timeline.length; i++) {
    const step = timeline[i];
    let imageChunks = cache.get(step.frameIndex);
    if (!imageChunks) {
      drawFrame(ctx, frames[step.frameIndex], size, settings.background, settings.fit);
      const blob = await canvasToBlob(canvas, 'image/webp', quality);
      imageChunks = extractImageChunks(new Uint8Array(await blob.arrayBuffer()));
      cache.set(step.frameIndex, imageChunks);
    }
    if (imageChunks.some((chunk) => readFourCC(chunk, 0) === 'ALPH')) hasAlpha = true;
    animationFrames.push(makeChunk('ANMF', concat([animationFrameHeader(size, step.durationMs), ...imageChunks])));
    onProgress((i + 1) / timeline.length);
  }

  const vp8x = new Uint8Array(10);
  vp8x[0] = 0x02 | (hasAlpha ? 0x10 : 0); // アニメーションあり（＋透明あり）
  writeUint24(vp8x, 4, size.width - 1);
  writeUint24(vp8x, 7, size.height - 1);

  const anim = new Uint8Array(6);
  // 背景色（BGRA）は 0 のまま。ループ回数: 0 = 無限
  writeUint16(anim, 4, settings.loop ? 0 : 1);

  const body = concat([
    new TextEncoder().encode('WEBP'),
    makeChunk('VP8X', vp8x),
    makeChunk('ANIM', anim),
    ...animationFrames,
  ]);
  const header = new Uint8Array(8);
  header.set(new TextEncoder().encode('RIFF'), 0);
  new DataView(header.buffer).setUint32(4, body.length, true);

  return new Blob([header, body] as BlobPart[], { type: 'image/webp' });
}

function animationFrameHeader(size: Size, durationMs: number): Uint8Array {
  const header = new Uint8Array(16);
  // X, Y 座標は 0。幅・高さは「値 - 1」で記録する決まり
  writeUint24(header, 6, size.width - 1);
  writeUint24(header, 9, size.height - 1);
  writeUint24(header, 12, Math.round(durationMs));
  header[15] = 0x02; // 前のフレームと合成しない（毎回まるごと描き直す）
  return header;
}

/** 静止画 WebP から画像データ部分（ALPH / VP8 / VP8L）だけ取り出します */
function extractImageChunks(file: Uint8Array): Uint8Array[] {
  if (readFourCC(file, 0) !== 'RIFF' || readFourCC(file, 8) !== 'WEBP') {
    throw new Error('このブラウザは WebP の書き出しに対応していません');
  }
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const chunks: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= file.length) {
    const type = readFourCC(file, offset);
    const length = view.getUint32(offset + 4, true);
    const paddedEnd = offset + 8 + length + (length % 2);
    if (type === 'ALPH' || type === 'VP8 ' || type === 'VP8L') {
      chunks.push(file.slice(offset, Math.min(paddedEnd, file.length)));
    }
    offset = paddedEnd;
  }
  if (chunks.length === 0) throw new Error('WebP の画像データが見つかりませんでした');
  return chunks;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const padding = data.length % 2;
  const chunk = new Uint8Array(8 + data.length + padding);
  chunk.set(new TextEncoder().encode(type), 0);
  new DataView(chunk.buffer).setUint32(4, data.length, true);
  chunk.set(data, 8);
  return chunk;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function readFourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

function writeUint24(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
}

function writeUint16(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画像の変換に失敗しました'))),
      type,
      quality,
    );
  });
}
