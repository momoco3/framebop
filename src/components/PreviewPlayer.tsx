// 書き出し前のアニメーションプレビュー。
// 書き出しと同じ描画処理（drawFrame）を使うので、完成品と同じ見た目になります。
import { useEffect, useRef, useState } from 'react';
import { drawFrame, type Size } from '../lib/drawFrame';
import type { Frame, Settings, TimelineStep } from '../types';
import styles from './PreviewPlayer.module.css';
import { PauseIcon, PlayIcon, RestartIcon } from './Stickers';

type Props = {
  frames: Frame[];
  timeline: TimelineStep[];
  outputSize: Size;
  settings: Settings;
  /** 今表示しているフレームを親に知らせる（サムネイルの強調表示用） */
  onFrameChange: (frameId: string | undefined) => void;
};

const PREVIEW_MAX_SIDE = 720;

export function PreviewPlayer({ frames, timeline, outputSize, settings, onFrameChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  // タイムラインが短くなったとき、範囲外にならないようにする
  const safeStep = step < timeline.length ? step : 0;
  useEffect(() => {
    stepRef.current = safeStep;
  }, [safeStep]);

  const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(outputSize.width, outputSize.height, 1));
  const canvasSize = {
    width: Math.max(1, Math.round(outputSize.width * scale)),
    height: Math.max(1, Math.round(outputSize.height * scale)),
  };

  // 再生ループ（requestAnimationFrame で経過時間を測って次のコマへ進める）
  useEffect(() => {
    if (!playing || timeline.length === 0) return;
    let rafId = 0;
    let last = performance.now();
    let elapsed = 0;
    let current = stepRef.current;

    const tick = (now: number) => {
      elapsed += now - last;
      last = now;
      // タブが裏にあった等で大きく時間が飛んだときは、まとめて進めない
      if (elapsed > 3000) elapsed = 0;
      let changed = false;
      while (elapsed >= timeline[current].durationMs) {
        elapsed -= timeline[current].durationMs;
        if (current + 1 < timeline.length) {
          current += 1;
        } else if (settings.loop) {
          current = 0;
        } else {
          setPlaying(false);
          return;
        }
        changed = true;
      }
      if (changed) {
        stepRef.current = current;
        setStep(current);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, timeline, settings.loop]);

  const currentStep = timeline[safeStep];
  const currentFrame = currentStep ? frames[currentStep.frameIndex] : undefined;

  // キャンバスに描画
  const { width: canvasWidth, height: canvasHeight } = canvasSize;
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !currentFrame) return;
    drawFrame(ctx, currentFrame, { width: canvasWidth, height: canvasHeight }, settings.background, settings.fit);
  }, [currentFrame, canvasWidth, canvasHeight, settings.background, settings.fit]);

  useEffect(() => {
    onFrameChange(currentFrame?.id);
  }, [currentFrame?.id, onFrameChange]);

  const togglePlay = () => {
    // 1回再生が最後まで終わっていたら、最初から再生し直す
    if (!playing && !settings.loop && safeStep === timeline.length - 1) setStep(0);
    setPlaying((value) => !value);
  };

  const restart = () => {
    setStep(0);
    stepRef.current = 0;
    setPlaying(true);
  };

  if (frames.length === 0) {
    return (
      <div className={styles.empty}>
        <p>画像を追加すると、ここでプレビューできます</p>
      </div>
    );
  }

  return (
    <div className={styles.player}>
      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
          role="img"
          aria-label={`プレビュー: フレーム ${currentStep ? currentStep.frameIndex + 1 : 0}`}
        />
        <span className={styles.badge}>{settings.format.toUpperCase()}</span>
      </div>

      <div className={styles.bar}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={`${styles.control} ${styles.play}`}
            onClick={togglePlay}
            aria-label={playing ? '一時停止' : '再生'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className={styles.control} onClick={restart} aria-label="最初から再生">
            <RestartIcon />
            <span>Restart</span>
          </button>
        </div>
        <p className={styles.counter} aria-live="off">
          <span className={styles.counterLabel}>Frame</span>
          <strong>{currentStep ? currentStep.frameIndex + 1 : 0}</strong>
          <span className={styles.counterTotal}>/ {frames.length}</span>
          {timeline.length !== frames.length && (
            <span className={styles.stepInfo}>
              （{safeStep + 1} / {timeline.length} コマ目）
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
