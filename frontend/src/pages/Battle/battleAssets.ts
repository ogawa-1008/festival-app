export const battleAssets = {
  monster: "/images/battle/D922CBBD-1F61-473A-8B25-F9649791B986.png",
  rock: "/images/battle/DDB43F54-277A-4F6D-A089-AE52BEB3477B_4_5005_c.jpeg",
  scissors: "/images/battle/7B1F7267-94A8-4106-BCD7-7B355D18DDB7_4_5005_c.jpeg",
  paper: "/images/battle/B842F13F-0F17-4A80-8342-6487B70C170D_4_5005_c.jpeg",
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

export async function prepareBattle(signal: AbortSignal) {
  await Promise.all(Object.values(battleAssets).map((src) => decodeImage(src, signal)));
}
