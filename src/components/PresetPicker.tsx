import type { CSSProperties } from 'react';
import { PRESETS } from '../presets';
import type { Preset } from '../presets';
import styles from './PresetPicker.module.css';
import { BoltIcon, StarIcon } from './Stickers';

type Props = {
  activePresetId: string | undefined;
  onSelect: (preset: Preset) => void;
};

export function PresetPicker({ activePresetId, onSelect }: Props) {
  return (
    <div className={styles.grid} role="group" aria-label="プリセット">
      {PRESETS.map((preset) => {
        const active = preset.id === activePresetId;
        return (
          <button
            key={preset.id}
            type="button"
            className={styles.card}
            style={{ '--accent': preset.color } as CSSProperties}
            aria-pressed={active}
            onClick={() => onSelect(preset)}
          >
            <span className={styles.name}>
              {preset.id === 'x-tap-stop' ? <BoltIcon size={18} /> : active ? <StarIcon size={18} /> : null}
              {preset.name}
            </span>
            <span className={styles.description}>{preset.description}</span>
            <span className={styles.chips}>
              <span className={styles.chip}>{(preset.values.durationMs / 1000).toFixed(2)}s</span>
              {preset.values.loop && <span className={styles.chip}>Loop</span>}
              {preset.values.order === 'random' && <span className={styles.chip}>Random</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
