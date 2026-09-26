// 何度も使う小さな操作部品（選択ボタン群・ON/OFFスイッチ）です。
import type { CSSProperties, ReactNode } from 'react';
import styles from './Controls.module.css';

export type Choice<T> = {
  value: T;
  label: ReactNode;
  sub?: ReactNode;
  disabled?: boolean;
  title?: string;
};

type ChoiceButtonsProps<T> = {
  label: string;
  choices: Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  columns?: number;
  /** 狭い画面（スマホ）での列数 */
  narrowColumns?: number;
};

/** 複数の候補から1つ選ぶボタン群 */
export function ChoiceButtons<T extends string | number>({ label, choices, value, onChange, columns, narrowColumns }: ChoiceButtonsProps<T>) {
  const style = columns
    ? ({ '--cols': columns, '--narrow-cols': narrowColumns ?? columns } as CSSProperties)
    : undefined;
  return (
    <div className={`${styles.choices} ${columns ? styles.fixedColumns : ''}`} role="group" aria-label={label} style={style}>
      {choices.map((choice) => (
        <button
          key={String(choice.value)}
          type="button"
          className={styles.choice}
          aria-pressed={choice.value === value}
          disabled={choice.disabled}
          title={choice.title}
          onClick={() => onChange(choice.value)}
        >
          <span className={styles.choiceLabel}>{choice.label}</span>
          {choice.sub && <span className={styles.choiceSub}>{choice.sub}</span>}
        </button>
      ))}
    </div>
  );
}

type SwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
};

/** ON / OFF スイッチ */
export function Switch({ label, description, checked, onChange, icon }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.switchRow} onClick={() => onChange(!checked)}>
      {icon && <span className={styles.switchIcon}>{icon}</span>}
      <span className={styles.switchText}>
        <span className={styles.switchLabel}>{label}</span>
        {description && <span className={styles.switchDescription}>{description}</span>}
      </span>
      <span className={styles.switchTrack} aria-hidden="true">
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}
