// 「どのフレームを、どの順番で、何ミリ秒ずつ表示するか」を決めるファイルです。
// プレビューとすべての書き出し（GIF / WebP / MP4）がこの結果を使うので、
// プレビューと完成ファイルの動きが必ず一致します。
import type { Frame, PlayOrder, Settings, TimelineStep } from '../types';

/** フレーム番号（0始まり）の並びを作ります */
export function buildFrameOrder(
  count: number,
  order: PlayOrder,
  loop: boolean,
  seed: number,
): number[] {
  const forward = Array.from({ length: count }, (_, i) => i);
  if (count <= 1) return forward;

  if (order === 'pingpong') {
    if (count === 2) return forward;
    // 例: 1 2 3 4 3 2 （ループ時は最後の1を省いて 1 に戻る）
    // 例: 1 2 3 4 3 2 1 （1回再生のときは 1 まで戻って終わる）
    const backward = forward.slice(0, -1).reverse();
    return loop ? [...forward, ...backward.slice(0, -1)] : [...forward, ...backward];
  }

  if (order === 'random') {
    return shuffle(forward, seed);
  }

  return forward;
}

/** 表示順と表示時間を合わせた「タイムライン」を作ります */
export function buildTimeline(frames: Frame[], settings: Settings): TimelineStep[] {
  const order = buildFrameOrder(frames.length, settings.order, settings.loop, settings.randomSeed);
  return order.map((frameIndex) => ({
    frameIndex,
    durationMs: frames[frameIndex].durationMs ?? settings.durationMs,
  }));
}

export function getTotalDurationMs(timeline: TimelineStep[]): number {
  return timeline.reduce((sum, step) => sum + step.durationMs, 0);
}

/** シード付きシャッフル。同じシードなら毎回同じ順番になります */
function shuffle(items: number[], seed: number): number[] {
  const random = createRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// mulberry32: 小さくて速い乱数生成器
function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
