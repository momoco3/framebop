// プリセットの一覧です。ここを編集するとプリセットの追加・変更ができます。
import type { Settings } from './types';

export type Preset = {
  id: string;
  name: string;
  description: string;
  /** カードのアクセントカラー（CSS変数名） */
  color: string;
  values: Pick<Settings, 'durationMs' | 'loop' | 'order'>;
};

export const PRESETS: Preset[] = [
  {
    id: 'x-tap-stop',
    name: 'X Tap Stop',
    description: 'Xでタップして止める遊び向け',
    color: 'var(--yellow)',
    values: { durationMs: 80, loop: true, order: 'normal' },
  },
  {
    id: 'fast-shuffle',
    name: 'Fast Shuffle',
    description: '高速＆ランダム順',
    color: 'var(--pink)',
    values: { durationMs: 50, loop: true, order: 'random' },
  },
  {
    id: 'smooth',
    name: 'Smooth Animation',
    description: 'なめらかなアニメ',
    color: 'var(--cyan)',
    values: { durationMs: 100, loop: true, order: 'normal' },
  },
  {
    id: 'slideshow',
    name: 'Slow Slideshow',
    description: 'ゆっくりスライドショー',
    color: 'var(--lime)',
    values: { durationMs: 500, loop: true, order: 'normal' },
  },
];

/** 今の設定と一致するプリセットを探します（なければ undefined） */
export function findMatchingPreset(settings: Settings): Preset | undefined {
  return PRESETS.find(
    (preset) =>
      preset.values.durationMs === settings.durationMs &&
      preset.values.loop === settings.loop &&
      preset.values.order === settings.order,
  );
}

export const DEFAULT_SETTINGS: Settings = {
  ...PRESETS[0].values,
  randomSeed: 1,
  resolution: 720,
  quality: 'high',
  format: 'gif',
  background: '#ffffff',
  fit: 'contain',
};

/** 表示時間のプリセット（ミリ秒） */
export const DURATION_PRESETS_MS = [30, 50, 80, 100, 150, 200, 500, 1000];
