// MP4 動画を作ります。
// 映像の圧縮はブラウザ標準の WebCodecs（VideoEncoder）、
// MP4 ファイルへの格納は mp4-muxer ライブラリを使います。
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { Frame, Settings, TimelineStep } from '../types';
import { createCanvas, drawFrame, type Size } from './drawFrame';
import { QUALITY_VALUES } from './quality';
import { getTotalDurationMs } from './timeline';

/** MP4 はループ情報を持てないので、ループONのときはこの長さ以上になるよう繰り返します */
export const MP4_MIN_LOOP_DURATION_MS = 3000;

export function canEncodeMp4(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;
}

/** MP4 用のタイムライン（ループONなら繰り返して長くしたもの） */
export function buildMp4Timeline(timeline: TimelineStep[], loop: boolean): TimelineStep[] {
  const cycle = getTotalDurationMs(timeline);
  if (!loop || cycle <= 0 || cycle >= MP4_MIN_LOOP_DURATION_MS) return timeline;
  const repeat = Math.ceil(MP4_MIN_LOOP_DURATION_MS / cycle);
  return Array.from({ length: repeat }, () => timeline).flat();
}

export function getMp4Bitrate(size: Size, settings: Settings): number {
  const bitsPerPixel = QUALITY_VALUES[settings.quality].mp4BitsPerPixel;
  return Math.max(300_000, Math.round(size.width * size.height * bitsPerPixel));
}

export async function encodeMp4(
  frames: Frame[],
  timeline: TimelineStep[],
  size: Size,
  settings: Settings,
  onProgress: (ratio: number) => void,
): Promise<Blob> {
  const steps = buildMp4Timeline(timeline, settings.loop);
  const bitrate = getMp4Bitrate(size, settings);
  const codec = await findSupportedCodec(size, bitrate);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: size.width, height: size.height },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let encodeError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      encodeError = error;
    },
  });
  encoder.configure({ codec, width: size.width, height: size.height, bitrate });

  const { canvas, ctx } = createCanvas(size);
  let timestampUs = 0;
  for (let i = 0; i < steps.length; i++) {
    if (encodeError) throw encodeError;
    const step = steps[i];
    const durationUs = Math.round(step.durationMs * 1000);
    drawFrame(ctx, frames[step.frameIndex], size, settings.background, settings.fit);
    const videoFrame = new VideoFrame(canvas, { timestamp: timestampUs, duration: durationUs });
    // 2秒ごとにキーフレームを入れる
    encoder.encode(videoFrame, { keyFrame: i === 0 || timestampUs % 2_000_000 < durationUs });
    videoFrame.close();
    timestampUs += durationUs;

    // エンコーダーが詰まりすぎないよう、処理が進むのを待つ
    // （タイマーで待つと、タブが裏にあるとき極端に遅くなるため dequeue イベントを使う）
    while (encoder.encodeQueueSize > 4) {
      await waitForDequeue(encoder);
    }
    onProgress((i + 1) / steps.length);
  }

  await encoder.flush();
  encoder.close();
  if (encodeError) throw encodeError;
  muxer.finalize();
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

function waitForDequeue(encoder: VideoEncoder) {
  return new Promise<void>((resolve) => {
    if ('ondequeue' in encoder) encoder.addEventListener('dequeue', () => resolve(), { once: true });
    else setTimeout(resolve, 5);
  });
}

/** 画像サイズに合う H.264 の設定を、対応しているものから選びます */
async function findSupportedCodec(size: Size, bitrate: number): Promise<string> {
  const macroblocks = Math.ceil(size.width / 16) * Math.ceil(size.height / 16);
  // H.264 のレベル: 3.1 / 4.0 / 5.1（大きい画像ほど高いレベルが必要）
  const levels = macroblocks <= 3600 ? ['1f', '28', '33'] : macroblocks <= 8192 ? ['28', '33'] : ['33'];
  const profiles = ['6400', '4d00', '4200']; // High / Main / Baseline
  for (const level of levels) {
    for (const profile of profiles) {
      const codec = `avc1.${profile}${level}`;
      try {
        const { supported } = await VideoEncoder.isConfigSupported({
          codec,
          width: size.width,
          height: size.height,
          bitrate,
        });
        if (supported) return codec;
      } catch {
        // 次の候補を試す
      }
    }
  }
  throw new Error('このブラウザでは MP4 (H.264) の書き出しに対応していません');
}
