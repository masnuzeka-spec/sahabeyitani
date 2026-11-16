// Puan, seri, rekor farkı ve rozet değerlendirme sistemi (Bölüm 21)
import APP_SETTINGS from "../data/app-settings.js";
import ACHIEVEMENTS from "../data/achievements.js";
import { loadState, saveState } from "./storage.js";
import { calculateStarsFromAccuracy, mergeHigherStars, computeDynamicTotalStars } from "./stars.js";

export function generateSessionId(prefix = "sess") {
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

export function calculateStreakQuestionScore(streakCount) {
  const streak = Math.max(1, Number(streakCount) || 1);
  return APP_SETTINGS.quiz.baseCorrectPoints + (streak - 1) * APP_SETTINGS.quiz.streakIncrement;
}

export function calculateRecordDifference(previousRecord, newScore) {
  const prev = Math.max(0, Number(previousRecord) || 0);
  const curr = Math.max(0, Number(newScore) || 0);
  return curr > prev ? curr - prev : 0;
}

export function evaluateAchievements(state) {
  const earned = new Set(Array.isArray(state.badges) ? state.badges : []);
  const completedSahabisCount = Array.isArray(state.completedSahabis) ? state.completedSahabis.length : 0;
  const completedCategoriesCount = Array.isArray(state.completedCategories) ? state.completedCategories.length : 0;
  const fiveStarSahabisCount = Object.values(state.testStars || {}).filter(v => Number(v) === 5).length;
  const bestStreak = Number(state.bestStreak) || 0;
  const whoAmIFirstHint = Number(state.whoAmIStats?.firstHintCorrect) || 0;
  const whoAmICorrect = Number(state.whoAmIStats?.totalCorrect) || 0;

  for (const ach of ACHIEVEMENTS) {
    if (earned.has(ach.id)) continue;
    let currentVal = 0;
    if (ach.type === "completedSahabis") currentVal = completedSahabisCount;
    else if (ach.type === "completedCategories") currentVal = completedCategoriesCount;
    else if (ach.type === "fiveStarSahabis") currentVal = fiveStarSahabisCount;
    else if (ach.type === "bestStreak") currentVal = bestStreak;
    else if (ach.type === "whoAmIFirstHint") currentVal = whoAmIFirstHint;
    else if (ach.type === "whoAmICorrect") currentVal = whoAmICorrect;

    if (currentVal >= ach.target) {
      earned.add(ach.id);
    }
  }
  return Array.from(earned);
}

/**
 * Oyun oturumu sonucunu kaydeder.
 * Aynı sessionId iki kez kaydedilmez.
 * Yeniden oynanan testlerde toplam puana yalnızca önceki rekoru aşan fark eklenir.
 */
export function commitQuizSessionResult(payload) {
  const state = loadState();
  const {
    sessionId,
    quizType, // "sahabi" | "category" | "mixed" | "mistakes" | "favorites"
    targetId, // sahabiId veya categoryId veya "mixed"
    targetTitle,
    modeId, // "quick10" | "full20" | "standard20" | "long40" | "all" | "mistakes"
    isOfficial, // 20 soruluk tam sahabi testi veya 20/40 soruluk kategori testi
    totalQuestions,
    correctCount,
    wrongCount,
    emptyCount,
    sessionScore,
    maxSessionStreak,
    route
  } = payload;

  if (!sessionId || state.savedSessionIds.includes(sessionId)) {
    return {
      alreadySaved: true,
      addedToTotalScore: 0,
      isNewRecord: false,
      earnedStars: 0,
      previousRecord: 0,
      state
    };
  }

  state.savedSessionIds.push(sessionId);

  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  let earnedStars = 0;
  let previousRecord = 0;
  let addedToTotalScore = 0;
  let isNewRecord = false;

  if (quizType === "sahabi" && targetId) {
    const recordKey = `${targetId}:${modeId}`;
    previousRecord = Number(state.testRecords[targetId]) || 0;

    if (isOfficial) {
      earnedStars = calculateStarsFromAccuracy(accuracyPercent);
      state.testStars[targetId] = mergeHigherStars(state.testStars[targetId], earnedStars);
      if (!state.completedSahabis.includes(targetId)) {
        state.completedSahabis.push(targetId);
      }
      addedToTotalScore = calculateRecordDifference(previousRecord, sessionScore);
      if (sessionScore > previousRecord) {
        state.testRecords[targetId] = sessionScore;
        isNewRecord = true;
      }
    } else {
      // Antrenman modu: Kalıcı yıldız vermez, tamamlandı sayılmaz, rekor farkı antrenman anahtarına göre hesaplanır
      const prevPractice = Number(state.testRecords[recordKey]) || 0;
      previousRecord = prevPractice;
      addedToTotalScore = calculateRecordDifference(prevPractice, sessionScore);
      if (sessionScore > prevPractice) {
        state.testRecords[recordKey] = sessionScore;
        isNewRecord = true;
      }
    }
  } else if (quizType === "category" && targetId) {
    const recordKey = `${targetId}:${modeId}`;
    previousRecord = Number(state.categoryRecords[targetId]) || 0;

    if (isOfficial) {
      earnedStars = calculateStarsFromAccuracy(accuracyPercent);
      state.categoryStars[targetId] = mergeHigherStars(state.categoryStars[targetId], earnedStars);
      if (!state.completedCategories.includes(targetId)) {
        state.completedCategories.push(targetId);
      }
      addedToTotalScore = calculateRecordDifference(previousRecord, sessionScore);
      if (sessionScore > previousRecord) {
        state.categoryRecords[targetId] = sessionScore;
        isNewRecord = true;
      }
    } else {
      const prevPractice = Number(state.categoryRecords[recordKey]) || 0;
      previousRecord = prevPractice;
      addedToTotalScore = calculateRecordDifference(prevPractice, sessionScore);
      if (sessionScore > prevPractice) {
        state.categoryRecords[recordKey] = sessionScore;
        isNewRecord = true;
      }
    }
  } else {
    // Karışık test, Yanlışlarım veya Favoriler: rekor anahtarı bazında fark eklenir
    const mixKey = `special:${quizType}:${totalQuestions}`;
    previousRecord = Number(state.testRecords[mixKey]) || 0;
    addedToTotalScore = calculateRecordDifference(prevPracticeSafe(state.testRecords[mixKey]), sessionScore);
    if (sessionScore > previousRecord) {
      state.testRecords[mixKey] = sessionScore;
      isNewRecord = true;
    }
  }

  state.totalScore = Math.max(0, (Number(state.totalScore) || 0) + addedToTotalScore);
  state.totalQuestionsSolved = (Number(state.totalQuestionsSolved) || 0) + totalQuestions;
  state.totalCorrect = (Number(state.totalCorrect) || 0) + correctCount;
  state.totalWrong = (Number(state.totalWrong) || 0) + wrongCount;
  state.bestStreak = Math.max(Number(state.bestStreak) || 0, maxSessionStreak || 0);
  state.totalStars = computeDynamicTotalStars(state);
  state.activeQuizProgress = null;

  const summaryItem = {
    sessionId,
    quizType,
    targetId,
    title: targetTitle,
    modeId,
    score: sessionScore,
    addedToTotalScore,
    accuracyPercent,
    earnedStars,
    correctCount,
    wrongCount,
    totalQuestions,
    route: route || "#/tests",
    playedAt: new Date().toISOString()
  };

  state.lastPlayedTest = summaryItem;
  state.recentTests = [summaryItem, ...(state.recentTests || [])].slice(0, 12);
  state.badges = evaluateAchievements(state);

  saveState(state);

  return {
    alreadySaved: false,
    addedToTotalScore,
    isNewRecord,
    earnedStars,
    previousRecord,
    accuracyPercent,
    state
  };
}

function prevPracticeSafe(val) {
  return Math.max(0, Number(val) || 0);
}
