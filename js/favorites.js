// Favori sahabîler, favori sorular ve yanlış sorular yönetimi (Bölüm 25)
import { loadState, saveState } from "./storage.js";

export function isSahabiFavorite(sahabiId) {
  const state = loadState();
  return state.favoriteSahabis.includes(sahabiId);
}

export function toggleSahabiFavorite(sahabiId) {
  const state = loadState();
  const idx = state.favoriteSahabis.indexOf(sahabiId);
  let added = false;
  if (idx >= 0) {
    state.favoriteSahabis.splice(idx, 1);
  } else {
    state.favoriteSahabis.push(sahabiId);
    added = true;
  }
  saveState(state);
  return added;
}

export function isQuestionFavorite(questionId) {
  const state = loadState();
  return state.favoriteQuestions.includes(questionId);
}

export function toggleQuestionFavorite(questionId) {
  const state = loadState();
  const idx = state.favoriteQuestions.indexOf(questionId);
  let added = false;
  if (idx >= 0) {
    state.favoriteQuestions.splice(idx, 1);
  } else {
    state.favoriteQuestions.push(questionId);
    added = true;
  }
  saveState(state);
  return added;
}

export function recordWrongQuestion(questionId, sahabiId) {
  if (!questionId) return;
  const state = loadState();
  const existing = state.wrongQuestions[questionId] || {
    questionId,
    sahabiId,
    wrongCount: 0,
    learned: false
  };
  existing.wrongCount = (Number(existing.wrongCount) || 0) + 1;
  existing.learned = false;
  existing.updatedAt = new Date().toISOString();
  state.wrongQuestions[questionId] = existing;
  saveState(state);
}

export function markWrongQuestionLearned(questionId) {
  if (!questionId) return;
  const state = loadState();
  if (state.wrongQuestions[questionId]) {
    delete state.wrongQuestions[questionId];
    saveState(state);
  }
}

export function keepWrongQuestionForLater(questionId) {
  if (!questionId) return;
  const state = loadState();
  if (state.wrongQuestions[questionId]) {
    state.wrongQuestions[questionId].learned = false;
    state.wrongQuestions[questionId].updatedAt = new Date().toISOString();
    saveState(state);
  }
}

export function getActiveWrongQuestionIds(filterSahabiId = null, filterCategoryIds = null, allQuestionsMap = null) {
  const state = loadState();
  const entries = Object.values(state.wrongQuestions || {}).filter(item => item && !item.learned);
  return entries
    .filter(item => {
      if (filterSahabiId && item.sahabiId !== filterSahabiId) return false;
      if (filterCategoryIds && allQuestionsMap) {
        const qObj = allQuestionsMap.get(item.questionId);
        if (!qObj) return false;
        const cats = Array.isArray(filterCategoryIds) ? filterCategoryIds : [filterCategoryIds];
        if (!qObj.categories.some(c => cats.includes(c))) return false;
      }
      return true;
    })
    .map(item => item.questionId);
}
