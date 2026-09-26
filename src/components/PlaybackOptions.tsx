// 再生方法（ループ・通常 / Ping-Pong / Random）の設定エリアです。
import type { PlayOrder, TimelineStep } from '../types';
import { ChoiceButtons, Switch } from './Controls';
import styles from './PlaybackOptions.module.css';

type Props = {
  loop: boolean;
  order: PlayOrder;
  timeline: TimelineStep[];
  onLoopChange: (loop: boolean) => void;
  onOrderChange: (order: PlayOrder) => void;
  onReshuffle: () => void;
};

const MAX_SEQUENCE_ITEMS = 16;

export function PlaybackOptions({ loop, order, timeline, onLoopChange, onOrderChange, onReshuffle }: Props) {
  const sequence = timeline.slice(0, MAX_SEQUENCE_ITEMS).map((step) => step.frameIndex + 1);

  return (
    <div className={styles.wrap}>
      <Switch
        label="Loop"
        description={loop ? '無限にくり返す' : '1回だけ再生して止まる'}
        checked={loop}
        onChange={onLoopChange}
        icon={<LoopIcon />}
      />

      <div>
        <p className={styles.label} id="order-label">
          再生順
        </p>
        <ChoiceButtons<PlayOrder>
          label="再生順"
          value={order}
          onChange={onOrderChange}
          columns={3}
          choices={[
            { value: 'normal', label: 'Normal', sub: '順番どおり' },
            { value: 'pingpong', label: 'Ping-Pong', sub: '行って戻る' },
            { value: 'random', label: 'Random', sub: 'シャッフル' },
          ]}
        />
      </div>

      {timeline.length > 0 && (
        <div className={styles.sequenceRow}>
          <p className={styles.sequence} aria-label={`再生順: ${sequence.join(', ')}`}>
            {sequence.map((number, i) => (
              <span key={i} className={styles.step}>
                {number}
              </span>
            ))}
            {timeline.length > MAX_SEQUENCE_ITEMS && <span className={styles.more}>…</span>}
            {loop && (
              <span className={styles.loopBack} aria-hidden="true">
                ↺
              </span>
            )}
          </p>
          {order === 'random' && (
            <button type="button" className={styles.shuffle} onClick={onReshuffle}>
              🎲 シャッフルし直す
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LoopIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M9 10.5c-3 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5c5 0 9-11 14-11 3 0 5.5 2.5 5.5 5.5s-2.5 5.5-5.5 5.5c-5 0-9-11-14-11z"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
