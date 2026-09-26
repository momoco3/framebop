// アプリ全体で使う「データの形」をまとめたファイルです。

/** 読み込んだ画像1枚 = 1フレーム */
export type Frame = {
  id: string;
  name: string;
  /** ブラウザ内だけで有効な一時URL（サムネイル・プレビュー用） */
  url: string;
  width: number;
  height: number;
  image: HTMLImageElement;
  /**
   * フレーム個別の表示時間（ミリ秒）。
   * 未設定なら全体の表示時間を使います。将来の「個別フレーム時間」機能用。
   */
  durationMs?: number;
};

/** フレームの並び方 */
export type PlayOrder = 'normal' | 'pingpong' | 'random';

/** 出力サイズ（長辺のピクセル数） */
export type Resolution = 'original' | 1080 | 720 | 480;

export type Quality = 'high' | 'medium' | 'small';

export type OutputFormat = 'gif' | 'webp' | 'mp4';

/** 画像の縦横比が出力サイズと違うときの収め方 */
export type FitMode = 'contain' | 'cover';

export type Settings = {
  /** 全フレーム共通の表示時間（ミリ秒） */
  durationMs: number;
  /** ON = 無限ループ / OFF = 1回だけ再生 */
  loop: boolean;
  order: PlayOrder;
  /** Random 用の乱数シード。同じ値なら同じ順番になります */
  randomSeed: number;
  resolution: Resolution;
  quality: Quality;
  format: OutputFormat;
  background: string;
  fit: FitMode;
};

/** 実際に再生・書き出しする1コマ分 */
export type TimelineStep = {
  frameIndex: number;
  durationMs: number;
};
