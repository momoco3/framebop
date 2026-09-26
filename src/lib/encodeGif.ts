// GIF を作ります。フレームの描画は画面側、減色と圧縮は Worker 側で行います。
import type { Frame, Settings, TimelineStep } from '../types';
import type { GifWorkerRequest, GifWorkerResponse } from '../workers/gifWorker';
import { createCanvas, drawFrame, type Size } from './drawFrame';
import { QUALITY_VALUES } from './quality';

export async function encodeGif(
  frames: Frame[],
  timeline: TimelineStep[],
  size: Size,
  settings: Settings,
  onProgress: (ratio: number) => void,
): Promise<Blob> {
  const worker = new Worker(new URL('../workers/gifWorker.ts', import.meta.url), {
    type: 'module',
  });

  // Worker に1件送り、返事が来るまで待つ（メモリを使いすぎないよう1枚ずつ送る）
  const send = (message: GifWorkerRequest, transfer: Transferable[] = []) =>
    new Promise<GifWorkerResponse>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<GifWorkerResponse>) => {
        if (event.data.type === 'error') reject(new Error(event.data.message));
        else resolve(event.data);
      };
      worker.onerror = (event) => reject(new Error(event.message || 'GIF worker error'));
      worker.postMessage(message, transfer);
    });

  try {
    const quality = QUALITY_VALUES[settings.quality];
    await send({
      type: 'start',
      width: size.width,
      height: size.height,
      maxColors: quality.gifColors,
      colorFormat: quality.gifColorFormat,
      loop: settings.loop,
    });

    const { ctx } = createCanvas(size, true);
    for (let i = 0; i < timeline.length; i++) {
      const step = timeline[i];
      drawFrame(ctx, frames[step.frameIndex], size, settings.background, settings.fit);
      const pixels = ctx.getImageData(0, 0, size.width, size.height);
      await send({ type: 'frame', rgba: pixels.data.buffer, delayMs: step.durationMs }, [
        pixels.data.buffer,
      ]);
      onProgress((i + 1) / timeline.length);
    }

    const result = await send({ type: 'finish' });
    if (result.type !== 'done') throw new Error('GIF の生成に失敗しました');
    return new Blob([result.buffer], { type: 'image/gif' });
  } finally {
    worker.terminate();
  }
}
