// 全フレーム共通の表示時間を選ぶエリアです。
import { useEffect, useRef, useState } from 'react';
import { DURATION_PRESETS_MS } from '../presets';
import { ChoiceButtons } from './Controls';
import styles from './DurationPicker.module.css';

type Props = {
  durationMs: number;
  onChange: (durationMs: number) => void;
};

export const MIN_DURATION_MS = 20;
export const MAX_DURATION_MS = 10000;

export function DurationPicker({ durationMs, onChange }: Props) {
  const [text, setText] = useState(formatSeconds(durationMs));
  const [invalid, setInvalid] = useState(false);
  // 入力欄で打った値そのものが反映されたときは、入力中の文字を書き換えない
  const typedValueRef = useRef<number | null>(null);

  // プリセットで変わったときは入力欄も更新
  useEffect(() => {
    if (typedValueRef.current === durationMs) return;
    setText(formatSeconds(durationMs));
    setInvalid(false);
  }, [durationMs]);

  const commit = (value: string) => {
    setText(value);
    const seconds = Number(value);
    const ms = Math.round((seconds * 1000) / 10) * 10; // GIF は 0.01秒単位
    const ok = value.trim() !== '' && Number.isFinite(seconds) && ms >= MIN_DURATION_MS && ms <= MAX_DURATION_MS;
    setInvalid(!ok);
    if (ok && ms !== durationMs) {
      typedValueRef.current = ms;
      onChange(ms);
    }
  };

  return (
    <div className={styles.wrap}>
      <ChoiceButtons
        label="表示時間のプリセット"
        value={durationMs}
        onChange={onChange}
        columns={4}
        choices={DURATION_PRESETS_MS.map((ms) => ({ value: ms, label: `${formatSeconds(ms)}s` }))}
      />
      <div className={styles.customRow}>
        <label htmlFor="custom-duration" className={styles.customLabel}>
          任意の秒数
        </label>
        <div className={`${styles.inputBox} ${invalid ? styles.invalid : ''}`}>
          <input
            id="custom-duration"
            type="number"
            inputMode="decimal"
            min={MIN_DURATION_MS / 1000}
            max={MAX_DURATION_MS / 1000}
            step={0.01}
            value={text}
            onChange={(event) => commit(event.target.value)}
            onBlur={() => {
              typedValueRef.current = null;
              setText(formatSeconds(durationMs));
              setInvalid(false);
            }}
            aria-invalid={invalid}
            aria-describedby="custom-duration-help"
          />
          <span aria-hidden="true">秒</span>
        </div>
        <span className={styles.fps}>≈ {(1000 / durationMs).toFixed(1)} fps</span>
      </div>
      <p id="custom-duration-help" className={`${styles.help} ${invalid ? styles.helpError : ''}`}>
        {invalid
          ? `${MIN_DURATION_MS / 1000}〜${MAX_DURATION_MS / 1000} 秒の範囲で入力してください`
          : '0.01秒単位。0.02秒より短いとブラウザによって遅く再生されます'}
      </p>
    </div>
  );
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(2);
}
