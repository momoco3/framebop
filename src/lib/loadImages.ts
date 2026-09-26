// 選択・ドロップされた画像ファイルを読み込んで Frame にします。
// 画像はブラウザの中だけで扱い、どこにもアップロードしません。
import type { Frame } from '../types';

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const ACCEPT_ATTRIBUTE = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';

export async function loadImageFiles(
  files: File[],
): Promise<{ frames: Frame[]; skipped: string[] }> {
  const skipped: string[] = [];
  const accepted = files.filter((file) => {
    const ok = ACCEPTED_TYPES.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!ok) skipped.push(file.name);
    return ok;
  });

  // "frame2.png" < "frame10.png" のように、人間が見て自然な順に並べます
  accepted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const frames: Frame[] = [];
  for (const file of accepted) {
    try {
      frames.push(await loadOneImage(file));
    } catch {
      skipped.push(file.name);
    }
  }
  return { frames, skipped };
}

async function loadOneImage(file: File): Promise<Frame> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    // decode() はタブが裏にあると終わらないことがあるため、load イベントで待ちます
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`読み込めませんでした: ${file.name}`));
      image.src = url;
    });
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: file.name,
    url,
    width: image.naturalWidth,
    height: image.naturalHeight,
    image,
  };
}

/** 使わなくなったフレームの一時URLを片付けます（メモリ節約） */
export function releaseFrame(frame: Frame) {
  URL.revokeObjectURL(frame.url);
}
