export const battleAssets = {
  rock: "/images/battle/rock.jpeg",
  scissors: "/images/battle/scissors.jpeg",
  paper: "/images/battle/paper.jpeg",
} as const;

function decodeImage(src: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      image.src = "";
      reject(signal.reason);
    };

    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    image.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load battle image: ${src}`));
    };
    image.onload = async () => {
      try {
        await image.decode();
        signal.throwIfAborted();
        cleanup();
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    image.src = src;
  });
}

// バトルに出すモンスターの絵（全身の絵がなければアイコン）
export function getBattleMonsterImage(quest: { image: string; battleImage?: string }) {
  return quest.battleImage ?? quest.image;
}

// 手の画像とモンスターの絵を読み込んでおく。フィールドの背景も読んでおくが、
// 飾りなので読み込めなくてもバトルは始められる（背景は黒になる）
export async function prepareBattle(signal: AbortSignal, monsterImage?: string, fieldImage?: string) {
  const images = monsterImage ? [...Object.values(battleAssets), monsterImage] : Object.values(battleAssets);
  await Promise.all([
    ...images.map((src) => decodeImage(src, signal)),
    ...(fieldImage ? [decodeImage(fieldImage, signal).catch(() => {})] : []),
  ]);
}
