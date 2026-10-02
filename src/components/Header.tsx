import styles from './Header.module.css';
import { BoltIcon, SparkleIcon, StarIcon } from './Stickers';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logoWrap}>
        <StarIcon className={styles.star} size={30} />
        <h1 className={styles.logo}>
          <span className={styles.logoFrame}>ももみくじ</span>
          <span className={styles.logoBop}>GIFメーカー</span>
        </h1>
        <BoltIcon className={styles.bolt} size={30} color="var(--pink)" />
      </div>
      <p className={styles.tagline}>
        <SparkleIcon size={18} />
        画像を並べるだけで、GIFアニメが作れる
      </p>
      <p className={styles.privacy}>
        <span className={styles.lock} aria-hidden="true">
          🔒
        </span>
        画像はブラウザ内だけで処理され、サーバーにアップロードされません
      </p>
    </header>
  );
}
