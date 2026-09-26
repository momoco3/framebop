// gifenc には型定義が付属していないため、使う部分だけ型を書いています。
declare module 'gifenc' {
  export type Palette = number[][];
  export type ColorFormat = 'rgb565' | 'rgb444' | 'rgba4444';

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: ColorFormat },
  ): Palette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: ColorFormat,
  ): Uint8Array;

  export type GIFEncoderInstance = {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: Palette;
        delay?: number;
        /** 0 = 無限ループ, -1 = 1回だけ再生 */
        repeat?: number;
        transparent?: boolean;
        transparentIndex?: number;
        dispose?: number;
      },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  };

  export function GIFEncoder(options?: { initialCapacity?: number; auto?: boolean }): GIFEncoderInstance;
}
