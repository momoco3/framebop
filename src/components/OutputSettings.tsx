// 書き出し形式・サイズ・画質の設定と、推定サイズなどの情報表示です。
import type { ReactNode } from 'react';
import type { Size } from '../lib/drawFrame';
import { formatBytes } from '../lib/estimate';
import { QUALITY_VALUES } from '../lib/quality';
import type { FitMode, OutputFormat, Quality, Resolution, Settings } from '../types';
import { ChoiceButtons } from './Controls';
import styles from './OutputSettings.module.css';

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  support: { webp: boolean; mp4: boolean };
  stats: {
    size: Size;
    stepCount: number;
    frameCount: number;
    totalDurationMs: number;
    estimatedBytes: number;
  };
};

/** Xの GIF アップロード上限の目安 */
const X_GIF_LIMIT_BYTES = 15 * 1024 * 1024;

const BACKGROUND_SWATCHES = ['#ffffff', '#121216', '#19e0ee', '#ff4fae', '#f4ff3a', '#a4f23b'];

export function OutputSettings({ settings, onChange, support, stats }: Props) {
  const fps = stats.stepCount > 0 ? (stats.stepCount * 1000) / stats.totalDurationMs : 0;
  const overXLimit = settings.format === 'gif' && stats.estimatedBytes > X_GIF_LIMIT_BYTES;

  return (
    <div className={styles.wrap}>
      <Field label="Format">
        <ChoiceButtons<OutputFormat>
          label="書き出し形式"
          value={settings.format}
          onChange={(format) => onChange({ format })}
          columns={3}
          choices={[
            { value: 'gif', label: 'GIF', sub: 'Xにおすすめ' },
            {
              value: 'webp',
              label: 'WebP',
              sub: support.webp ? '軽くてきれい' : '非対応ブラウザ',
              disabled: !support.webp,
              title: support.webp ? undefined : 'このブラウザは WebP の書き出しに対応していません（Chrome / Edge / Firefox で利用できます）',
            },
            {
              value: 'mp4',
              label: 'MP4',
              sub: support.mp4 ? '動画ファイル' : '非対応ブラウザ',
              disabled: !support.mp4,
              title: support.mp4 ? undefined : 'このブラウザは MP4 の書き出しに対応していません',
            },
          ]}
        />
        {settings.format === 'mp4' && settings.loop && (
          <p className={styles.note}>MP4 はループ情報を持てないため、約3秒以上になるようにくり返して書き出します。</p>
        )}
      </Field>

      <Field label="Resolution" hint="長辺のピクセル数">
        <ChoiceButtons<Resolution>
          label="出力サイズ"
          value={settings.resolution}
          onChange={(resolution) => onChange({ resolution })}
          columns={4}
          narrowColumns={2}
          choices={[
            { value: 'original', label: 'Original' },
            { value: 1080, label: '1080px' },
            { value: 720, label: '720px' },
            { value: 480, label: '480px' },
          ]}
        />
      </Field>

      <Field label="Quality">
        <ChoiceButtons<Quality>
          label="画質"
          value={settings.quality}
          onChange={(quality) => onChange({ quality })}
          columns={3}
          choices={(Object.keys(QUALITY_VALUES) as Quality[]).map((key) => ({
            value: key,
            label: QUALITY_VALUES[key].label,
            sub: QUALITY_VALUES[key].description,
          }))}
        />
      </Field>

      <div className={styles.twoColumns}>
        <Field label="Fit" hint="サイズが違う画像の収め方">
          <ChoiceButtons<FitMode>
            label="画像の収め方"
            value={settings.fit}
            onChange={(fit) => onChange({ fit })}
            columns={2}
            choices={[
              { value: 'contain', label: '全体', sub: '余白あり' },
              { value: 'cover', label: '切り抜き', sub: '余白なし' },
            ]}
          />
        </Field>
        <Field label="Background" hint="余白の色">
          <div className={styles.swatches} role="group" aria-label="背景色">
            {BACKGROUND_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                className={styles.swatch}
                style={{ background: color }}
                aria-pressed={settings.background.toLowerCase() === color}
                aria-label={`背景色 ${color}`}
                onClick={() => onChange({ background: color })}
              />
            ))}
            <label className={styles.colorPicker} title="好きな色を選ぶ">
              <span className="visually-hidden">好きな背景色を選ぶ</span>
              <input
                type="color"
                value={settings.background}
                onChange={(event) => onChange({ background: event.target.value })}
              />
            </label>
          </div>
        </Field>
      </div>

      <dl className={styles.stats} aria-label="書き出し情報">
        <Stat label="推定サイズ" value={stats.estimatedBytes > 0 ? `約 ${formatBytes(stats.estimatedBytes)}` : '—'} highlight />
        <Stat label="画像サイズ" value={stats.size.width > 0 ? `${stats.size.width} × ${stats.size.height}` : '—'} />
        <Stat
          label="フレーム数"
          value={stats.stepCount === stats.frameCount ? `${stats.frameCount}` : `${stats.stepCount}（画像${stats.frameCount}枚）`}
        />
        <Stat label="FPS相当" value={fps > 0 ? `${fps.toFixed(1)} fps` : '—'} />
        <Stat label="1周の長さ" value={stats.totalDurationMs > 0 ? `${(stats.totalDurationMs / 1000).toFixed(2)} 秒` : '—'} />
      </dl>
      {overXLimit && (
        <p className={styles.warning} role="status">
          ⚠ Xの GIF 上限（15MB）を超えそうです。Resolution を小さくするか Quality を下げてみてください。
        </p>
      )}
      <p className={styles.note}>推定サイズは目安です。実際のサイズは画像の内容によって変わります。</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <p className={styles.fieldLabel}>
        {label}
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </p>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${styles.stat} ${highlight ? styles.statHighlight : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
