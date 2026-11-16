// localStorage ve geçici bellek (in-memory fallback) yönetimi (Bölüm 32, 33)
import APP_SETTINGS from "../data/app-settings.js";

const STORAGE_KEY = APP_SETTINGS.storageKey;
const CURRENT_VERSION = APP_SETTINGS.storageVersion;

let memoryFallbackState = null;

export function createDefaultState() {
  return {
    version: CURRENT_VERSION,
    onboardingCompleted: false,
    theme: APP_SETTINGS.defaults.theme || "sepia", // "auto" | "light" | "dark"
    homeView: APP_SETTINGS.defaults.homeView || "grid2x2", // "grid2x2" | "list"
    categoryView: APP_SETTINGS.defaults.categoryView || "card", // "card" | "list"
    testView: APP_SETTINGS.defaults.testView || "card", // "card" | "list"
    biographyView: APP_SETTINGS.defaults.biographyView || "card", // "card" | "list"
    fontScale: Number(APP_SETTINGS.defaults.fontScale) || 100, // 90 | 100 | 115 | 130
    favoriteSahabis: [],
    readSahabis: [],
    sahabiNotes: {},
    favoriteQuestions: [],
    testRecords: {},
    testStars: {},
    completedSahabis: [],
    categoryRecords: {},
    categoryStars: {},
    completedCategories: [],
    wrongQuestions: {},
    totalScore: 0,
    totalStars: 0,
    totalQuestionsSolved: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestStreak: 0,
    whoAmIStats: {
      totalCorrect: 0,
      totalWrong: 0,
      firstHintCorrect: 0,
      totalHintsUsed: 0,
      bestStreak: 0,
      currentStreak: 0,
      totalScore: 0,
      recentSahabiIds: []
    },
    lastPlayedTest: null,
    activeQuizProgress: null,
    recentTests: [],
    badges: [],
    savedSessionIds: []
  };
}

function sanitizeLoadedState(raw) {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;

  const validFontScales = [85, 92, 100, 108, 116, 125];
  const rawScale = Number(raw.fontScale);

  return {
    version: CURRENT_VERSION,
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    theme: (raw.version === CURRENT_VERSION && ["auto", "light", "sepia", "slate", "dark"].includes(raw.theme)) ? raw.theme : "sepia",
    homeView: ["grid2x2", "list"].includes(raw.homeView) ? raw.homeView : base.homeView,
    categoryView: ["card", "list"].includes(raw.categoryView) ? raw.categoryView : base.categoryView,
    testView: ["card", "list"].includes(raw.testView) ? raw.testView : base.testView,
    biographyView: ["card", "list"].includes(raw.biographyView) ? raw.biographyView : base.biographyView,
    fontScale: validFontScales.includes(rawScale) ? rawScale : base.fontScale,
    favoriteSahabis: Array.isArray(raw.favoriteSahabis) ? raw.favoriteSahabis.filter(x => typeof x === "string") : [],
    readSahabis: Array.isArray(raw.readSahabis) ? raw.readSahabis.filter(x => typeof x === "string") : [],
    sahabiNotes: raw.sahabiNotes && typeof raw.sahabiNotes === "object" ? { ...raw.sahabiNotes } : {},
    favoriteQuestions: Array.isArray(raw.favoriteQuestions) ? raw.favoriteQuestions.filter(x => typeof x === "string") : [],
    testRecords: raw.testRecords && typeof raw.testRecords === "object" ? { ...raw.testRecords } : {},
    testStars: raw.testStars && typeof raw.testStars === "object" ? { ...raw.testStars } : {},
    completedSahabis: Array.isArray(raw.completedSahabis) ? raw.completedSahabis.filter(x => typeof x === "string") : [],
    categoryRecords: raw.categoryRecords && typeof raw.categoryRecords === "object" ? { ...raw.categoryRecords } : {},
    categoryStars: raw.categoryStars && typeof raw.categoryStars === "object" ? { ...raw.categoryStars } : {},
    completedCategories: Array.isArray(raw.completedCategories) ? raw.completedCategories.filter(x => typeof x === "string") : [],
    wrongQuestions: raw.wrongQuestions && typeof raw.wrongQuestions === "object" ? { ...raw.wrongQuestions } : {},
    totalScore: Math.max(0, Number(raw.totalScore) || 0),
    totalStars: Math.max(0, Number(raw.totalStars) || 0),
    totalQuestionsSolved: Math.max(0, Number(raw.totalQuestionsSolved) || 0),
    totalCorrect: Math.max(0, Number(raw.totalCorrect) || 0),
    totalWrong: Math.max(0, Number(raw.totalWrong) || 0),
    bestStreak: Math.max(0, Number(raw.bestStreak) || 0),
    whoAmIStats: {
      totalCorrect: Math.max(0, Number(raw.whoAmIStats?.totalCorrect) || 0),
      totalWrong: Math.max(0, Number(raw.whoAmIStats?.totalWrong) || 0),
      firstHintCorrect: Math.max(0, Number(raw.whoAmIStats?.firstHintCorrect) || 0),
      totalHintsUsed: Math.max(0, Number(raw.whoAmIStats?.totalHintsUsed) || 0),
      bestStreak: Math.max(0, Number(raw.whoAmIStats?.bestStreak) || 0),
      currentStreak: Math.max(0, Number(raw.whoAmIStats?.currentStreak) || 0),
      totalScore: Number(raw.whoAmIStats?.totalScore) || 0,
      recentSahabiIds: Array.isArray(raw.whoAmIStats?.recentSahabiIds)
        ? raw.whoAmIStats.recentSahabiIds.slice(0, 10)
        : []
    },
    lastPlayedTest: raw.lastPlayedTest && typeof raw.lastPlayedTest === "object" ? raw.lastPlayedTest : null,
    activeQuizProgress: raw.activeQuizProgress && typeof raw.activeQuizProgress === "object" ? raw.activeQuizProgress : null,
    recentTests: Array.isArray(raw.recentTests) ? raw.recentTests.slice(0, 15) : [],
    badges: Array.isArray(raw.badges) ? raw.badges.filter(x => typeof x === "string") : [],
    savedSessionIds: Array.isArray(raw.savedSessionIds) ? raw.savedSessionIds.slice(-200) : []
  };
}

export function loadState() {
  try {
    const rawStr = window.localStorage.getItem(STORAGE_KEY);
    if (!rawStr) {
      if (!memoryFallbackState) memoryFallbackState = createDefaultState();
      return memoryFallbackState;
    }
    const parsed = JSON.parse(rawStr);
    const clean = sanitizeLoadedState(parsed);
    memoryFallbackState = clean;
    return clean;
  } catch (err) {
    if (!memoryFallbackState) {
      memoryFallbackState = createDefaultState();
    }
    return memoryFallbackState;
  }
}

export function saveState(nextState) {
  const clean = sanitizeLoadedState(nextState);
  memoryFallbackState = clean;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    // localStorage kullanılamıyorsa geçici bellekle devam et
  }
  return clean;
}

export function updateState(updaterFn) {
  const current = loadState();
  const updated = updaterFn({ ...current });
  return saveState(updated || current);
}

export function resetAllProgress() {
  const current = loadState();
  const fresh = createDefaultState();
  fresh.onboardingCompleted = true;
  fresh.theme = current.theme;
  fresh.homeView = current.homeView;
  fresh.categoryView = current.categoryView;
  fresh.testView = current.testView;
  fresh.biographyView = current.biographyView;
  fresh.fontScale = current.fontScale;
  return saveState(fresh);
}

export function exportProgressJson() {
  const state = loadState();
  const payload = {
    app: "SAHABEYİ TANI",
    exportedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
    state
  };
  return JSON.stringify(payload, null, 2);
}

export function importProgressJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const candidate = parsed && parsed.state && typeof parsed.state === "object" ? parsed.state : parsed;
    if (!candidate || typeof candidate !== "object") {
      return { ok: false, error: "Geçersiz yedek dosyası formatı." };
    }
    const requiredKeys = ["testRecords", "testStars", "totalScore", "favoriteSahabis"];
    const hasValidShape = requiredKeys.some(k => k in candidate);
    if (!hasValidShape) {
      return { ok: false, error: "Dosya SAHABEYİ TANI ilerleme verisi içermiyor." };
    }
    const clean = sanitizeLoadedState(candidate);
    saveState(clean);
    return { ok: true, state: clean };
  } catch (err) {
    return { ok: false, error: "Yedek dosyası okunamadı veya bozuk JSON içeriyor." };
  }
}

export function resolveEffectiveTheme(themePref) {
  if (["sepia", "light", "slate", "dark"].includes(themePref)) return themePref;
  if (themePref === "auto") {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (e) {
      // Varsayılan sepya tema
    }
  }
  return "sepia";
}

export function applyTheme(themePref) {
  const effective = resolveEffectiveTheme(themePref);
  document.documentElement.setAttribute("data-theme", effective);
  return effective;
}

export function applyFontScale(fontScale = 100) {
  const validScales = [85, 92, 100, 108, 116, 125];
  const raw = Number(fontScale) || 100;
  const pct = validScales.includes(raw) ? raw : 100;
  const ratio = (pct / 100).toFixed(2);
  document.documentElement.style.setProperty("--bio-font-scale", ratio);
  document.documentElement.style.fontSize = `${pct}%`;
  return pct;
}
