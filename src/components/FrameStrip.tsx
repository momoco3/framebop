// フレームのサムネイル一覧。ドラッグ、または ←/→ ボタンで並び替えできます。
// ドラッグは dnd-kit ライブラリで、マウス・タッチ（長押し）・キーボードに対応しています。
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';
import type { Frame } from '../types';
import styles from './FrameStrip.module.css';
import { ArrowIcon, CloseIcon } from './Stickers';

type Props = {
  frames: Frame[];
  activeFrameId: string | undefined;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
};

export function FrameStrip({ frames, activeFrameId, onReorder, onRemove }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // スマホは「長押し」でドラッグ開始。普通のスワイプは横スクロールになります
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = frames.findIndex((frame) => frame.id === active.id);
    const to = frames.findIndex((frame) => frame.id === over.id);
    if (from >= 0 && to >= 0) onReorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'スペースキーで持ち上げ、矢印キーで移動、もう一度スペースキーで置きます。Esc でキャンセル。',
        },
      }}
    >
      <SortableContext items={frames.map((frame) => frame.id)} strategy={horizontalListSortingStrategy}>
        <ol className={styles.strip} aria-label="フレーム一覧">
          {frames.map((frame, index) => (
            <FrameCard
              key={frame.id}
              frame={frame}
              index={index}
              total={frames.length}
              active={frame.id === activeFrameId}
              onMove={onReorder}
              onRemove={onRemove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

type CardProps = {
  frame: Frame;
  index: number;
  total: number;
  active: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
};

const FrameCard = memo(function FrameCard({ frame, index, total, active, onMove, onRemove }: CardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: frame.id });
  const number = index + 1;

  return (
    <li
      ref={setNodeRef}
      className={`${styles.card} ${active ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div
        ref={setActivatorNodeRef}
        className={styles.thumb}
        {...attributes}
        {...listeners}
        aria-label={`フレーム ${number}: ${frame.name}（ドラッグで並び替え）`}
      >
        <img src={frame.url} alt="" draggable={false} />
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
      </div>
      <button
        type="button"
        className={styles.remove}
        onClick={() => onRemove(frame.id)}
        aria-label={`フレーム ${number} を削除`}
      >
        <CloseIcon size={16} />
      </button>
      <div className={styles.moveButtons}>
        <button
          type="button"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={`フレーム ${number} を左へ移動`}
        >
          <ArrowIcon size={20} direction="left" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          aria-label={`フレーム ${number} を右へ移動`}
        >
          <ArrowIcon size={20} />
        </button>
      </div>
    </li>
  );
});
