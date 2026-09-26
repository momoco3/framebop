// アプリ本体。画面の並びと、フレーム・設定・書き出しの状態をここで管理します。
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';
import { DropZone } from './components/DropZone';
import { DurationPicker } from './components/DurationPicker';
import { ExportPanel, type ExportResult } from './components/ExportPanel';
import { FrameStrip } from './components/FrameStrip';
import { Header } from './components/Header';
import { OutputSettings } from './components/OutputSettings';
import { Panel } from './components/Panel';
import { PlaybackOptions } from './components/PlaybackOptions';
import { PresetPicker } from './components/PresetPicker';
import { PreviewPlayer } from './components/PreviewPlayer';
import { BackgroundSplashes } from './components/Stickers';
import { StickyGenerateBar } from './components/StickyGenerateBar';
import { makeFileName } from './lib/download';
import { getOutputSize } from './lib/drawFrame';
import { encodeGif } from './lib/encodeGif';
import { canEncodeMp4, encodeMp4 } from './lib/encodeMp4';
import { canEncodeWebp, encodeWebp } from './lib/encodeWebp';
import { estimateFileSize } from './lib/estimate';
import { loadImageFiles, releaseFrame } from './lib/loadImages';
import { buildTimeline, getTotalDurationMs } from './lib/timeline';
import { DEFAULT_SETTINGS, findMatchingPreset, type Preset } from './presets';
import type { Frame, Settings } from './types';

const ENCODERS = { gif: encodeGif, webp: encodeWebp, mp4: encodeMp4 };

export default function App() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loadingImages, setLoadingImages] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | undefined>();

  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 07 Export が画面に見えているか（見えていないときだけ下固定ボタンを出す）
  const [exportInView, setExportInView] = useState(false);

  useEffect(() => {
    const exportPanel = document.getElementById('export');
    if (!exportPanel) return;
    const observer = new IntersectionObserver(([entry]) => setExportInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(exportPanel);
    return () => observer.disconnect();
  }, []);

  const support = useMemo(() => ({ webp: canEncodeWebp(), mp4: canEncodeMp4() }), []);

  // ---- 計算で求まる値 ----
  const timeline = useMemo(() => buildTimeline(frames, settings), [frames, settings]);
  const outputSize = useMemo(
    () => getOutputSize(frames, settings.resolution, settings.format === 'mp4'),
    [frames, settings.resolution, settings.format],
  );
  const estimatedBytes = useMemo(
    () => estimateFileSize(frames, timeline, outputSize, settings),
    [frames, timeline, outputSize, settings],
  );
  const activePreset = findMatchingPreset(settings);

  // フレームや設定を変えたら、前回書き出したファイルは古いので表示しない
  const currentResult =
    result && result.sourceFrames === frames && result.sourceSettings === settings ? result : null;

  // 下固定ボタンから生成したときは、完成したファイルが画面に表示されてからそこへスクロール
  const scrollToResultRef = useRef(false);
  useEffect(() => {
    if (!scrollToResultRef.current || working) return;
    scrollToResultRef.current = false;
    document.getElementById('export')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [working, currentResult]);

  // ---- 画像・フレームの操作 ----
  const handleFiles = async (files: File[]) => {
    setLoadingImages(true);
    setNotice(null);
    const { frames: newFrames, skipped } = await loadImageFiles(files);
    setFrames((previous) => [...previous, ...newFrames]);
    if (skipped.length > 0) {
      setNotice(`読み込めなかったファイル: ${skipped.join(', ')}（PNG / JPG / WebP に対応しています）`);
    }
    setLoadingImages(false);
  };

  const moveFrame = useCallback((from: number, to: number) => {
    setFrames((previous) => (to < 0 || to >= previous.length ? previous : arrayMove(previous, from, to)));
  }, []);

  const removeFrame = useCallback((id: string) => {
    setFrames((previous) => {
      const target = previous.find((frame) => frame.id === id);
      if (target) releaseFrame(target);
      return previous.filter((frame) => frame.id !== id);
    });
  }, []);

  const reverseFrames = () => setFrames((previous) => [...previous].reverse());

  const clearFrames = () => {
    if (!window.confirm('すべてのフレームを削除しますか？')) return;
    frames.forEach(releaseFrame);
    setFrames([]);
  };

  // ---- 設定の変更 ----
  const updateSettings = (patch: Partial<Settings>) => setSettings((previous) => ({ ...previous, ...patch }));
  const applyPreset = (preset: Preset) => updateSettings(preset.values);
  const reshuffle = () => updateSettings({ randomSeed: Math.floor(Math.random() * 2 ** 31) });

  // ---- 書き出し ----
  const generate = async () => {
    if (frames.length === 0 || working) return;
    setWorking(true);
    setProgress(0);
    setError(null);
    try {
      const blob = await ENCODERS[settings.format](frames, timeline, outputSize, settings, setProgress);
      if (result) URL.revokeObjectURL(result.url);
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        fileName: makeFileName(settings.format),
        format: settings.format,
        sourceFrames: frames,
        sourceSettings: settings,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setWorking(false);
    }
  };

  // 下固定ボタン: 進み具合と結果が見えるよう 07 Export までスクロールしてから生成
  const generateFromStickyBar = () => {
    document.getElementById('export')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    scrollToResultRef.current = true;
    generate();
  };

  return (
    <>
      <BackgroundSplashes />
      <div className={styles.app}>
        <Header />

        <main className={styles.editor}>
          <Panel
            id="frames"
            title="01 Frames"
            color="var(--cyan)"
            actions={
              frames.length > 0 && (
                <>
                  <span className={styles.count}>{frames.length} 枚</span>
                  <button type="button" className={styles.smallButton} onClick={reverseFrames}>
                    ⇄ 逆順
                  </button>
                  <button type="button" className={styles.smallButton} onClick={clearFrames}>
                    全部削除
                  </button>
                </>
              )
            }
          >
            <DropZone onFiles={handleFiles} compact={frames.length > 0} loading={loadingImages} />
            {notice && (
              <p className={styles.notice} role="status">
                {notice}
              </p>
            )}
            {frames.length > 0 && (
              <>
                <p className={styles.stripHint}>
                  ドラッグ（スマホは長押し）か ←/→ ボタンで並び替え
                </p>
                <FrameStrip
                  frames={frames}
                  activeFrameId={activeFrameId}
                  onReorder={moveFrame}
                  onRemove={removeFrame}
                />
              </>
            )}
          </Panel>

          <Panel id="preview" title="02 Preview" color="var(--yellow)">
            <PreviewPlayer
              frames={frames}
              timeline={timeline}
              outputSize={outputSize}
              settings={settings}
              onFrameChange={setActiveFrameId}
            />
          </Panel>

          <Panel id="preset" title="03 Preset" color="var(--pink)" hint="選ぶと下の設定がまとめて切り替わります">
            <PresetPicker activePresetId={activePreset?.id} onSelect={applyPreset} />
          </Panel>

          <div className={styles.twoColumns}>
            <Panel id="duration" title="04 Frame Duration" color="var(--lime)" hint="1コマを表示する時間">
              <DurationPicker durationMs={settings.durationMs} onChange={(durationMs) => updateSettings({ durationMs })} />
            </Panel>

            <Panel id="playback" title="05 Playback" color="var(--sky)">
              <PlaybackOptions
                loop={settings.loop}
                order={settings.order}
                timeline={timeline}
                onLoopChange={(loop) => updateSettings({ loop })}
                onOrderChange={(order) => updateSettings({ order })}
                onReshuffle={reshuffle}
              />
            </Panel>
          </div>

          <Panel id="output" title="06 Output" color="var(--purple)">
            <OutputSettings
              settings={settings}
              onChange={updateSettings}
              support={support}
              stats={{
                size: outputSize,
                stepCount: timeline.length,
                frameCount: frames.length,
                totalDurationMs: getTotalDurationMs(timeline),
                estimatedBytes,
              }}
            />
          </Panel>

          <Panel id="export" title="07 Export" color="var(--orange)">
            <ExportPanel
              format={settings.format}
              canGenerate={frames.length > 0}
              working={working}
              progress={progress}
              result={currentResult}
              error={currentResult || working ? null : error}
              onGenerate={generate}
            />
          </Panel>
        </main>

        <footer className={styles.footer}>
          <p>
            Uploaded images are processed locally in your browser and are not uploaded to a server.
            <br />
            画像はすべてお使いのブラウザ内で処理されます。
          </p>
          <p className={styles.footerSmall}>FrameBop · MIT License</p>
        </footer>
      </div>

      <StickyGenerateBar
        visible={frames.length > 0 && !exportInView}
        format={settings.format}
        working={working}
        progress={progress}
        onGenerate={generateFromStickyBar}
      />
    </>
  );
}
