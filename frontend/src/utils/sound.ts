import { useSyncExternalStore } from "react";

// 効果音（短いので読み込んでおき、すぐ鳴らせるようにする）
const SE_FILES = {
  questStart: "/sounds/quest-start.m4a",
  questClear: "/sounds/quest-clear.m4a",
  questFailed: "/sounds/quest-failed.m4a",
  // 今はクエストクリアと同じ音。別の音が届いたら差し替える
  weaponUpgrade: "/sounds/quest-clear.m4a",
} as const;

// エリアを選んだあと、どの画面でも流すBGM（約4分あるので、読み込みきらずに少しずつ再生する）
const BGM_FILE = "/sounds/bgm.m4a";

export type SoundEffect = keyof typeof SE_FILES;

const SE_VOLUME = 0.9;
// 効果音が聞こえるように、BGMは小さめにする
const BGM_VOLUME = 0.35;
const BGM_FADE_IN_SECONDS = 3;
const BGM_FADE_OUT_SECONDS = 0.6;
// 効果音を鳴らしている間は、BGMをさらに小さくする
const BGM_DUCK_VOLUME = 0.1;
const BGM_DUCK_SECONDS = 0.2;
const BGM_RESTORE_SECONDS = 0.8;
// 読み込みに時間がかかって、これより遅れた効果音は鳴らさない（別の画面で急に鳴らないように）
const SE_MAX_DELAY_MS = 1000;

const STORAGE_KEY = "festival-game-sound:v1";

let context: AudioContext | null = null;
const seBuffers = new Map<SoundEffect, Promise<AudioBuffer | null>>();
let bgm: { element: HTMLAudioElement; gain: GainNode } | null = null;
// エリアを選んでいて、BGMを流したい状態か（再生が止められたときに、次のタップでかけ直す）
let bgmWanted = false;

const getContext = () => {
  if (context) return context;
  const AudioContextClass = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
};

// ---- オン・オフの設定（端末に保存する） ----
// 電車の中などで急に鳴らないよう、エリアを選んだあとに鳴らすかを聞く。選ぶまではオフ

const listeners = new Set<() => void>();

const readSetting = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

let enabled = typeof window === "undefined" ? false : readSetting() === "on";

// 鳴らすかどうかをもう選んだか（保存できない端末では、エリアを選ぶたびに聞く）
export function hasChosenSound() {
  return readSetting() !== null;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    // 保存できなくても、この画面を開いている間は切り替える
  }
  applyEnabled(value);
}

const applyEnabled = (value: boolean) => {
  if (enabled === value) return;
  enabled = value;
  if (!value) {
    clearStopTimer();
    bgm?.element.pause();
  } else {
    preloadSounds();
    // BGMを流す画面にいれば、オンにした（タップした）その場で流し始める
    if (bgmWanted) {
      bgmWanted = false;
      startBgm();
    }
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, isSoundEnabled, () => false);
}

// ---- 効果音 ----

const loadSe = (name: SoundEffect) => {
  const cached = seBuffers.get(name);
  if (cached) return cached;
  const ctx = getContext();
  if (!ctx) return Promise.resolve(null);

  const loading = fetch(SE_FILES[name])
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => {
      // 通信に失敗したら、次に鳴らすときに読み込み直す
      seBuffers.delete(name);
      return null;
    });
  seBuffers.set(name, loading);
  return loading;
};

// 先に読み込んでおく（エリアを選んだら、効果音とBGMを用意する。オフのときは通信しない）
export function preloadSounds() {
  if (!enabled) return;
  (Object.keys(SE_FILES) as SoundEffect[]).forEach((name) => void loadSe(name));
  getBgm();
}

export function playSe(name: SoundEffect) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
  const requestedAt = performance.now();

  void loadSe(name).then((buffer) => {
    if (!buffer || !enabled || performance.now() - requestedAt > SE_MAX_DELAY_MS) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = SE_VOLUME;
    source.buffer = buffer;
    source.connect(gain).connect(ctx.destination);
    source.start();
    duckBgm(ctx, buffer.duration);
  });
}

// 効果音が聞こえるように、鳴っている間だけBGMを小さくして、終わったら戻す
const duckBgm = (ctx: AudioContext, seconds: number) => {
  if (!bgm || !bgmWanted || bgm.element.paused) return;
  const volume = bgm.gain.gain;
  const now = ctx.currentTime;
  rampBgm(BGM_DUCK_VOLUME, BGM_DUCK_SECONDS);
  const end = now + Math.max(seconds, BGM_DUCK_SECONDS);
  volume.setValueAtTime(BGM_DUCK_VOLUME, end);
  volume.linearRampToValueAtTime(BGM_VOLUME, end + BGM_RESTORE_SECONDS);
};

// ---- BGM ----

// iPhone では audio 要素の音量を変えられないため、Web Audio の音量（gain）を通して鳴らす
const getBgm = () => {
  if (bgm) return bgm;
  const ctx = getContext();
  if (!ctx) return null;

  const element = new Audio(BGM_FILE);
  element.loop = true;
  // 最初から全部は読み込まず、流し始めてから少しずつ読み込む
  element.preload = "metadata";
  const gain = ctx.createGain();
  gain.gain.value = 0;
  ctx.createMediaElementSource(element).connect(gain).connect(ctx.destination);
  bgm = { element, gain };
  return bgm;
};

// BGMの音量を、今の音量から target まで seconds 秒かけて変える
const rampBgm = (target: number, seconds: number) => {
  if (!context || !bgm) return;
  const volume = bgm.gain.gain;
  const now = context.currentTime;
  volume.cancelScheduledValues(now);
  volume.setValueAtTime(volume.value, now);
  volume.linearRampToValueAtTime(target, now + seconds);
};

// フェードアウトしたあとに止めるタイマー（また流すことになったら取り消す）
let stopTimer: ReturnType<typeof setTimeout> | null = null;
const clearStopTimer = () => {
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = null;
};

// 実際に流れ始めたときに、小さくから少しずつ大きくする
// （自動再生が止められて、あとのタップで流れ始めたときも、いきなり大きな音にしない）
const playBgmElement = () => {
  const current = bgm;
  if (!current || !enabled || !bgmWanted || document.hidden || !current.element.paused) return;
  current.gain.gain.cancelScheduledValues(0);
  current.gain.gain.value = 0;
  // 自動再生が止められたら、次のタップ（unlockSound）でかけ直す
  void current.element.play()
    .then(() => {
      if (bgm === current && bgmWanted) rampBgm(BGM_VOLUME, BGM_FADE_IN_SECONDS);
    })
    .catch(() => undefined);
};

// エリアを選んだら、最初から流し始める
export function startBgm() {
  const wasWanted = bgmWanted;
  bgmWanted = true;
  // オフのときは、オンにしたとき（setSoundEnabled）に流し始める
  if (!enabled) return;
  const ctx = getContext();
  const current = getBgm();
  if (!ctx || !current) return;

  clearStopTimer();
  void ctx.resume().catch(() => undefined);
  // もう流している（エリアを決定したときに流し始めた）ならそのまま。フェードアウト中にまた流すことになったら、止めずに音量を戻す
  if (!current.element.paused) {
    if (!wasWanted) rampBgm(BGM_VOLUME, BGM_FADE_OUT_SECONDS);
    return;
  }
  current.element.currentTime = 0;
  playBgmElement();
}

// エリアを選んでいない状態に戻ったら、短くフェードアウトして止める
export function stopBgm() {
  bgmWanted = false;
  const current = bgm;
  if (!current || current.element.paused) return;

  clearStopTimer();
  rampBgm(0, BGM_FADE_OUT_SECONDS);
  stopTimer = setTimeout(() => {
    stopTimer = null;
    current.element.pause();
  }, BGM_FADE_OUT_SECONDS * 1000);
}

// ---- スマホで音を出せるようにする ----

// スマホのブラウザは、画面をタップするまで音を出せない。タップのたびに音を出せる状態に戻す
// （iPhone は指を離したとき〔touchend・pointerup〕のタップしか音を出すきっかけとして扱わないため、そちらでも試す）
const unlockSound = () => {
  void context?.resume().catch(() => undefined);
  playBgmElement();
};

// 保存されているオン・オフに合わせる（ほかのタブで切り替えたとき。保存を読めなければ今のまま）
const syncSetting = () => {
  const saved = readSetting();
  if (saved !== null) applyEnabled(saved === "on");
};

// ほかのアプリに切り替えたら止め、戻ってきたら続きから流す
const handleVisibilityChange = () => {
  if (document.hidden) {
    bgm?.element.pause();
    void context?.suspend().catch(() => undefined);
  } else {
    syncSetting();
    void context?.resume().catch(() => undefined);
    playBgmElement();
  }
};

export function installSoundUnlock() {
  ["pointerdown", "pointerup", "touchend", "keydown"].forEach((type) => {
    document.addEventListener(type, unlockSound, true);
  });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // ほかのタブでオン・オフを切り替えたら、この画面にも合わせる（戻る・進むでページが復元されたときも読み直す）
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) syncSetting();
  });
  window.addEventListener("pageshow", syncSetting);
}
