// GIF エンコードを画面とは別のスレッド（Web Worker）で行います。
// 重い処理中でも画面が固まらないようにするためです。
import { GIFEncoder, applyPalette, quantize, type GIFEncoderInstance } from 'gifenc';

export type GifWorkerRequest =
  | {
      type: 'start';
      width: number;
      height: number;
      maxColors: number;
      colorFormat: 'rgb565' | 'rgb444';
      loop: boolean;
    }
  | { type: 'frame'; rgba: ArrayBuffer; delayMs: number }
  | { type: 'finish' };

export type GifWorkerResponse =
  | { type: 'ok' }
  | { type: 'done'; buffer: ArrayBuffer }
  | { type: 'error'; message: string };

let encoder: GIFEncoderInstance | null = null;
let options: Extract<GifWorkerRequest, { type: 'start' }> | null = null;

function reply(message: GifWorkerResponse, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(message, transfer);
}

self.onmessage = (event: MessageEvent<GifWorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === 'start') {
      options = message;
      encoder = GIFEncoder();
      reply({ type: 'ok' });
      return;
    }

    if (!encoder || !options) throw new Error('GIF encoder is not started');

    if (message.type === 'frame') {
      const rgba = new Uint8ClampedArray(message.rgba);
      // 1フレームごとに最適な256色以下のパレットを作ります
      const palette = quantize(rgba, options.maxColors, { format: options.colorFormat });
      const index = applyPalette(rgba, palette, options.colorFormat);
      encoder.writeFrame(index, options.width, options.height, {
        palette,
        delay: message.delayMs,
        repeat: options.loop ? 0 : -1,
      });
      reply({ type: 'ok' });
      return;
    }

    if (message.type === 'finish') {
      encoder.finish();
      const bytes = encoder.bytes();
      encoder = null;
      reply({ type: 'done', buffer: bytes.buffer as ArrayBuffer }, [bytes.buffer]);
    }
  } catch (error) {
    reply({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
