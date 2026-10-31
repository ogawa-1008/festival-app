export const battleAssets = {
  monster: "/images/battle/D922CBBD-1F61-473A-8B25-F9649791B986.png",
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

export function getBattleMonsterImage(questImage: string) {
  return questImage === "/images/quests/image.png" ? battleAssets.monster : questImage;
}

export async function prepareBattle(signal: AbortSignal, monsterImage: string = battleAssets.monster) {
  await Promise.all(Object.values({ ...battleAssets, monster: monsterImage }).map((src) => decodeImage(src, signal)));
}
