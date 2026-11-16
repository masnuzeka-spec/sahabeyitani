// KİMİM BEN? Bağımsız İpucu Oyunu modülü (Bölüm 18)
import APP_CONTENT from "../data/app-content.js";
import APP_SETTINGS from "../data/app-settings.js";
import SAHABIS from "../data/sahabis-index.js";
import { getIconSvg, escapeHtml, shuffleArray, formatNumber, showToast } from "./utils.js";
import { loadState, saveState } from "./storage.js";
import { evaluateAchievements } from "./scoring.js";
import { triggerHaptic } from "./telegram.js";

let currentWhoAmIFilter = "all";
let activeRound = null;

function getCandidateSahabis(filterId, state) {
  const readySahabis = SAHABIS.filter(
    s => s.active && Array.isArray(s.whoAmI?.hints) && s.whoAmI.hints.length >= 5
  );

  if (filterId === "all") return readySahabis;
  if (filterId === "favorites") {
    return readySahabis.filter(s => state.favoriteSahabis.includes(s.id));
  }
  if (filterId === "completed") {
    return readySahabis.filter(s => state.completedSahabis.includes(s.id));
  }
  return readySahabis.filter(s => s.categories.includes(filterId));
}

function createWhoAmIRound(filterId) {
  const state = loadState();
  const candidates = getCandidateSahabis(filterId, state);
  if (candidates.length < 4) {
    return { errorMinimum: true, count: candidates.length };
  }

  const recentIds = state.whoAmIStats?.recentSahabiIds || [];
  let eligibleTargets = candidates.filter(s => !recentIds.slice(0, 5).includes(s.id));
  if (eligibleTargets.length === 0) {
    eligibleTargets = candidates;
  }

  const target = shuffleArray(eligibleTargets)[0];

  // Yanlış seçenekler seçilen kategoriye ve cinsiyete uygun sahabîlerden oluşturulsun
  let sameGenderPool = candidates.filter(s => s.id !== target.id && s.gender === target.gender);
  if (sameGenderPool.length < 3) {
    sameGenderPool = SAHABIS.filter(s => s.id !== target.id && s.gender === target.gender);
  }
  const distractors = shuffleArray(sameGenderPool).slice(0, 3);
  const options = shuffleArray([target, ...distractors]);

  return {
    filterId,
    target,
    options,
    revealedCount: 1,
    wrongGuessedIds: [],
    penaltyPoints: 0,
    finished: false,
    outcome: null, // "correct" | "passed"
    earnedPoints: 0
  };
}

function getPotentialPoints(revealedCount) {
  const map = APP_SETTINGS.whoAmI.hintPoints;
  return Number(map[String(revealedCount)]) || 20;
}

export function renderWhoAmIPage(container) {
  const state = loadState();
  const stats = state.whoAmIStats || {};
  const avgHints = stats.totalCorrect > 0
    ? (stats.totalHintsUsed / stats.totalCorrect).toFixed(1)
    : "0.0";

  if (!activeRound) {
    container.innerHTML = `
      <div class="bio-hero-card">
        <span class="bio-ep-badge">Bağımsız İpucu Oyunu</span>
        <h1 class="bio-name">${escapeHtml(APP_CONTENT.whoAmI.title)}</h1>
        <p class="bio-summary-text">${escapeHtml(APP_CONTENT.whoAmI.description)}</p>
      </div>

      <div class="card" style="margin-bottom:var(--space-md);">
        <h2 class="card-title" style="margin-bottom:10px;">Kategori veya Grup Seç</h2>
        <div class="filter-controls-row" style="margin-bottom:16px;">
          ${APP_SETTINGS.whoAmI.filters.map(f => `
            <button
              type="button"
              data-wai-filter="${escapeHtml(f.id)}"
              class="chip-btn ${currentWhoAmIFilter === f.id ? "active" : ""}"
              aria-pressed="${currentWhoAmIFilter === f.id}"
            >
              ${escapeHtml(f.label)}
            </button>
          `).join("")}
        </div>

        <button type="button" id="wai-start-btn" class="btn btn-primary btn-block">
          ${getIconSvg("lamp", 18)}
          <span>Oyunu Başlat</span>
        </button>
      </div>

      <div class="card">
        <h2 class="card-title" style="margin-bottom:12px;">Kimim Ben? İstatistiklerin</h2>
        <div class="summary-stats-grid">
          <div class="stat-mini-card">
            <div class="stat-mini-val">${formatNumber(stats.totalScore)}</div>
            <div class="stat-mini-label">Toplam Puan</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-val">${formatNumber(stats.totalCorrect)}</div>
            <div class="stat-mini-label">Doğru Tahmin</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-val">${formatNumber(stats.firstHintCorrect)}</div>
            <div class="stat-mini-label">1. İpucunda Bilinen</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-val">${avgHints}</div>
            <div class="stat-mini-label">Ort. İpucu</div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-wai-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentWhoAmIFilter = btn.getAttribute("data-wai-filter");
        renderWhoAmIPage(container);
      });
    });

    const startBtn = document.getElementById("wai-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const round = createWhoAmIRound(currentWhoAmIFilter);
        if (round.errorMinimum) {
          showToast("Bu grupta oyun için en az 4 sahabî bulunmalıdır. Lütfen başka bir grup seçin.");
          return;
        }
        activeRound = round;
        renderWhoAmIPage(container);
      });
    }
    return;
  }

  // Aktif Oyun Ekranı
  const r = activeRound;
  const hints = r.target.whoAmI.hints.slice(0, r.revealedCount);
  const basePotential = getPotentialPoints(r.revealedCount);
  const netPotential = Math.max(10, basePotential + r.penaltyPoints);
  const filterLabel = APP_SETTINGS.whoAmI.filters.find(f => f.id === r.filterId)?.label || "Tüm Sahabîler";

  container.innerHTML = `
    <div class="quiz-topbar">
      <div>
        <span style="font-size:0.76rem;font-weight:800;color:var(--color-dark-gold);text-transform:uppercase;">
          KİMİM BEN? • ${escapeHtml(filterLabel)}
        </span>
        <h1 class="card-title">Gizli Sahabîyi Bul</h1>
      </div>
      <button type="button" id="wai-change-group-btn" class="btn btn-secondary btn-sm">Grup Değiştir</button>
    </div>

    <div class="quiz-metrics-bar">
      <span>İpucu: <strong>${r.revealedCount} / 5</strong></span>
      <span>Kazanılabilecek Puan: <strong>${r.finished ? r.earnedPoints : netPotential}</strong></span>
      <span>Seri: <strong>${loadState().whoAmIStats?.currentStreak || 0}</strong></span>
    </div>

    <section class="hints-stack" aria-label="Açılmış İpuçları">
      ${hints.map((hText, idx) => `
        <div class="hint-card">
          <span class="hint-num">${idx + 1}. İpucu ${idx === 0 ? "(En Zor)" : idx === 4 ? "(Ayırt Edici)" : ""}</span>
          <p>${escapeHtml(hText)}</p>
        </div>
      `).join("")}
    </section>

    ${!r.finished ? `
      <div style="display:flex;gap:10px;margin-bottom:var(--space-md);">
        <button
          type="button"
          id="wai-next-hint-btn"
          class="btn btn-gold"
          style="flex:1;"
          ${r.revealedCount >= 5 ? "disabled" : ""}
        >
          ${r.revealedCount < 5 ? `Yeni İpucu Aç (${r.revealedCount + 1}/5)` : "Tüm İpuçları Açıldı"}
        </button>
        <button type="button" id="wai-pass-btn" class="btn btn-secondary" style="flex:1;">
          Pas Geç (0 Puan)
        </button>
      </div>
    ` : ""}

    <div class="options-stack" role="group" aria-label="Dört Sahabî Seçeneği">
      ${r.options.map((optSahabi, idx) => {
        const isWrongPicked = r.wrongGuessedIds.includes(optSahabi.id);
        let btnClass = "";
        if (r.finished && optSahabi.id === r.target.id) {
          btnClass = "correct";
        } else if (isWrongPicked) {
          btnClass = "wrong";
        }
        return `
          <button
            type="button"
            class="option-btn ${btnClass}"
            data-wai-opt="${escapeHtml(optSahabi.id)}"
            ${r.finished || isWrongPicked ? "disabled" : ""}
          >
            <span class="option-letter">${["A", "B", "C", "D"][idx]}</span>
            <span style="flex:1;">${escapeHtml(optSahabi.sahabiName)}</span>
          </button>
        `;
      }).join("")}
    </div>

    ${r.finished ? `
      <div class="explanation-box" role="status">
        <strong style="display:block;margin-bottom:4px;color:${r.outcome === "correct" ? "var(--color-success)" : "var(--color-warning)"};">
          ${r.outcome === "correct"
            ? `Tebrikler! ${r.revealedCount}. ipucunda bildin (${r.earnedPoints >= 0 ? `+${r.earnedPoints}` : r.earnedPoints} Puan)`
            : `Pas Geçildi (0 Puan) — Doğru Cevap: ${escapeHtml(r.target.sahabiName)}`}
        </strong>
        <p>${escapeHtml(r.target.summary)}</p>
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" id="wai-next-round-btn" class="btn btn-primary" style="flex:1;">Yeni Sahabî Sor</button>
          <a href="#/biography/${escapeHtml(r.target.sahabiSlug)}" class="btn btn-secondary" style="flex:1;">Biyografiyi Aç</a>
        </div>
      </div>
    ` : ""}
  `;

  const changeGroupBtn = document.getElementById("wai-change-group-btn");
  if (changeGroupBtn) {
    changeGroupBtn.addEventListener("click", () => {
      activeRound = null;
      renderWhoAmIPage(container);
    });
  }

  const nextHintBtn = document.getElementById("wai-next-hint-btn");
  if (nextHintBtn) {
    nextHintBtn.addEventListener("click", () => {
      if (r.revealedCount < 5 && !r.finished) {
        r.revealedCount += 1;
        renderWhoAmIPage(container);
      }
    });
  }

  const passBtn = document.getElementById("wai-pass-btn");
  if (passBtn) {
    passBtn.addEventListener("click", () => {
      if (r.finished) return;
      r.finished = true;
      r.outcome = "passed";
      r.earnedPoints = 0;
      const st = loadState();
      st.whoAmIStats.currentStreak = 0;
      st.whoAmIStats.recentSahabiIds = [
        r.target.id,
        ...(st.whoAmIStats.recentSahabiIds || []).filter(id => id !== r.target.id)
      ].slice(0, 8);
      saveState(st);
      renderWhoAmIPage(container);
    });
  }

  container.querySelectorAll("[data-wai-opt]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (r.finished) return;
      const pickedId = btn.getAttribute("data-wai-opt");
      if (r.wrongGuessedIds.includes(pickedId)) return;

      const st = loadState();
      if (pickedId === r.target.id) {
        const pts = getPotentialPoints(r.revealedCount);
        r.finished = true;
        r.outcome = "correct";
        r.earnedPoints = pts;

        st.whoAmIStats.totalCorrect = (Number(st.whoAmIStats.totalCorrect) || 0) + 1;
        st.whoAmIStats.totalHintsUsed = (Number(st.whoAmIStats.totalHintsUsed) || 0) + r.revealedCount;
        if (r.revealedCount === 1 && r.wrongGuessedIds.length === 0) {
          st.whoAmIStats.firstHintCorrect = (Number(st.whoAmIStats.firstHintCorrect) || 0) + 1;
        }
        st.whoAmIStats.currentStreak = (Number(st.whoAmIStats.currentStreak) || 0) + 1;
        st.whoAmIStats.bestStreak = Math.max(
          Number(st.whoAmIStats.bestStreak) || 0,
          st.whoAmIStats.currentStreak
        );
        st.whoAmIStats.totalScore = (Number(st.whoAmIStats.totalScore) || 0) + pts;
        st.totalScore = Math.max(0, (Number(st.totalScore) || 0) + pts);
        st.whoAmIStats.recentSahabiIds = [
          r.target.id,
          ...(st.whoAmIStats.recentSahabiIds || []).filter(id => id !== r.target.id)
        ].slice(0, 8);
        st.badges = evaluateAchievements(st);
        saveState(st);
        triggerHaptic("success");
      } else {
        // Yanlış tahmin: -10 puan
        r.wrongGuessedIds.push(pickedId);
        r.penaltyPoints += APP_SETTINGS.whoAmI.wrongGuessPenalty;
        st.whoAmIStats.totalWrong = (Number(st.whoAmIStats.totalWrong) || 0) + 1;
        st.whoAmIStats.currentStreak = 0;
        st.whoAmIStats.totalScore = (Number(st.whoAmIStats.totalScore) || 0) + APP_SETTINGS.whoAmI.wrongGuessPenalty;
        st.totalScore = Math.max(0, (Number(st.totalScore) || 0) + APP_SETTINGS.whoAmI.wrongGuessPenalty);
        saveState(st);
        triggerHaptic("error");
        showToast("Yanlış tahmin (-10 Puan). Yeni ipucu açabilir veya tekrar deneyebilirsin.");
      }
      renderWhoAmIPage(container);
    });
  });

  const nextRoundBtn = document.getElementById("wai-next-round-btn");
  if (nextRoundBtn) {
    nextRoundBtn.addEventListener("click", () => {
      activeRound = createWhoAmIRound(currentWhoAmIFilter);
      renderWhoAmIPage(container);
    });
  }
}
