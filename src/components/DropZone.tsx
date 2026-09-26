// 画像の読み込みエリア。PCはドラッグ＆ドロップ、スマホはタップして選択します。
import { useRef, useState, type DragEvent } from 'react';
import { ACCEPT_ATTRIBUTE } from '../lib/loadImages';
import styles from './DropZone.module.css';
import { PlusIcon, SparkleIcon, StarIcon } from './Stickers';

type Props = {
  onFiles: (files: File[]) => void;
  compact: boolean;
  loading: boolean;
};

export function DropZone({ onFiles, compact, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  };

  return (
    <div
      className={`${styles.zone} ${compact ? styles.compact : ''} ${dragging ? styles.dragging : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <StarIcon className={styles.decoStar} size={26} />
      <SparkleIcon className={styles.decoSparkle} size={22} color="var(--pink)" />
      <button
        type="button"
        className={styles.button}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-describedby="drop-hint"
      >
        <span className={styles.plus}>
          <PlusIcon size={compact ? 22 : 30} />
        </span>
        <span className={styles.buttonText}>
          {loading ? '読み込み中…' : compact ? '画像を追加' : '画像を選ぶ'}
        </span>
      </button>
      <p id="drop-hint" className={styles.hint}>
        <span className={styles.desktopOnly}>ここに画像をドラッグ＆ドロップ ／ </span>
        PNG・JPG・WebP を複数まとめて選べます
      </p>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          event.target.value = ''; // 同じファイルをもう一度選べるようにリセット
        }}
      />
    </div>
  );
}
