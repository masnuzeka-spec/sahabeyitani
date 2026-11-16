// 5 Yıldız değerlendirme ve dinamik yıldız hesaplama sistemi (Bölüm 22)
import APP_SETTINGS from "../data/app-settings.js";
import { loadState } from "./storage.js";

export function calculateStarsFromAccuracy(accuracyPercent) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(accuracyPercent) || 0)));
  if (pct === 100) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  if (pct >= 40) return 2;
  return 1;
}

export function mergeHigherStars(previousStars, newStars) {
  const prev = Math.max(0, Math.min(APP_SETTINGS.stars.maxStars, Number(previousStars) || 0));
  const next = Math.max(0, Math.min(APP_SETTINGS.stars.maxStars, Number(newStars) || 0));
  return Math.max(prev, next);
}

export function computeDynamicTotalStars(stateObj = null) {
  const state = stateObj || loadState();
  let sum = 0;
  if (state.testStars && typeof state.testStars === "object") {
    for (const val of Object.values(state.testStars)) {
      sum += Math.max(0, Math.min(5, Number(val) || 0));
    }
  }
  if (state.categoryStars && typeof state.categoryStars === "object") {
    for (const val of Object.values(state.categoryStars)) {
      sum += Math.max(0, Math.min(5, Number(val) || 0));
    }
  }
  return sum;
}

export function renderStarsHtml(earnedStars = 0, maxStars = 5) {
  const earned = Math.max(0, Math.min(maxStars, Number(earnedStars) || 0));
  let html = `<span class="stars-row" aria-label="${earned} / ${maxStars} yıldız">`;
  for (let i = 1; i <= maxStars; i++) {
    const filled = i <= earned ? "filled" : "";
    html += `<svg class="star-icon ${filled}" viewBox="0 0 24 24" fill="${i <= earned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  html += `</span>`;
  return html;
}
