// Soru seçimi, test ekranı ve sonuç ekranı modülü (Bölüm 15, 16, 17, 19, 20, 21, 22, 23, 25)
import APP_SETTINGS from "../data/app-settings.js";
import CATEGORIES from "../data/categories.js";
import SAHABIS from "../data/sahabis-index.js";
import { getIconSvg, escapeHtml, shuffleArray, formatNumber, showToast } from "./utils.js";
import { loadState, updateState } from "./storage.js";
import {
  generateSessionId,
  calculateStreakQuestionScore,
  commitQuizSessionResult
} from "./scoring.js";
import { renderStarsHtml, calculateStarsFromAccuracy } from "./stars.js";
import {
  isQuestionFavorite,
  toggleQuestionFavorite,
  recordWrongQuestion,
  markWrongQuestionLearned,
  keepWrongQuestionForLater,
  getActiveWrongQuestionIds
} from "./favorites.js";
import { shareTextContent, downloadVisualCardPng, downloadCertificatePng } from "./sharing.js";
import { navigateTo } from "./router.js";
import { triggerHaptic } from "./telegram.js";

// Tüm soruların hızlı erişim haritası
const QUESTION_MAP = new Map();
const SAHABI_BY_ID = new Map();
for (const s of SAHABIS) {
  SAHABI_BY_ID.set(s.id, s);
  if (s.active && s.contentStatus === "ready" && Array.isArray(s.questions)) {
    for (const q of s.questions) {
      QUESTION_MAP.set(q.id, {
        ...q,
        sahabiId: s.id,
        sahabiName: s.sahabiName,
        sahabiSlug: s.sahabiSlug
      });
    }
  }
}

/**
 * Farklı sahabîlerden dengeli soru seçimi yapar, arka arkaya aynı sahabîden
 * çok soru gelmesini önler ve tek testte aynı soruyu iki kez göstermez.
 */
function selectBalancedQuestions(candidatePool, targetCount) {
  const uniqueMap = new Map();
  for (const q of candidatePool) {
    if (!uniqueMap.has(q.id)) {
      uniqueMap.set(q.id, q);
    }
  }
  const uniqueList = Array.from(uniqueMap.values());
  const limit = Math.min(targetCount, uniqueList.length);
  if (limit <= 0) return [];

  // Sahabî bazında grupla ve her grubu karıştır
  const bySahabi = new Map();
  for (const q of shuffleArray(uniqueList)) {
    const sid = q.sahabiId || "other";
    if (!bySahabi.has(sid)) bySahabi.set(sid, []);
    bySahabi.get(sid).push(q);
  }

  const sahabiKeys = shuffleArray(Array.from(bySahabi.keys()));
  const selected = [];
  let activeRound = true;

  while (selected.length < limit && activeRound) {
    activeRound = false;
    for (const key of sahabiKeys) {
      const bucket = bySahabi.get(key);
      if (bucket && bucket.length > 0) {
        selected.push(bucket.shift());
        activeRound = true;
        if (selected.length >= limit) break;
      }
    }
  }

  // Arka arkaya aynı sahabîden soru gelmesini en aza indir
  const ordered = [];
  const pool = [...selected];
  let lastSahabiId = null;
  while (pool.length > 0) {
    let pickIndex = pool.findIndex(item => item.sahabiId !== lastSahabiId);
    if (pickIndex === -1) pickIndex = 0;
    const [picked] = pool.splice(pickIndex, 1);
    ordered.push(picked);
    lastSahabiId = picked.sahabiId;
  }

  return ordered.map(q => ({
    ...q,
    shuffledOptions: shuffleArray(q.options)
  }));
}

export function renderSahabiTestRoute(container, slug, query = {}) {
  const sahabi = SAHABIS.find(s => s.sahabiSlug === slug || s.id === slug);
  if (!sahabi || sahabi.contentStatus !== "ready" || sahabi.questions.length < 20) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h1 class="card-title">Sahabî Testi Hazırlanıyor</h1>
        <p class="card-desc" style="margin:8px 0 16px;">Bu sahabî için 20 soruluk test henüz aktif değildir.</p>
        <a href="#/tests" class="btn btn-primary">Testlere Dön</a>
      </div>
    `;
    return;
  }

  const requestedMode = query.mode || null;
  if (!requestedMode) {
    renderSahabiModeSelector(container, sahabi);
    return;
  }

  let pool = sahabi.questions.map(q => QUESTION_MAP.get(q.id) || { ...q, sahabiId: sahabi.id, sahabiName: sahabi.sahabiName, sahabiSlug: sahabi.sahabiSlug });
  let count = 20;
  let isOfficial = false;
  let testName = "20 Soruluk Tam Test";

  if (requestedMode === "quick10") {
    count = 10;
    isOfficial = false;
    testName = "10 Soruluk Hızlı Test";
  } else if (requestedMode === "full20") {
    count = 20;
    isOfficial = true;
    testName = "20 Soruluk Tam Test";
  } else if (requestedMode === "all") {
    count = pool.length;
    isOfficial = false;
    testName = "Tüm Sorular";
  } else if (requestedMode === "mistakes") {
    const wrongIds = getActiveWrongQuestionIds(sahabi.id);
    pool = pool.filter(q => wrongIds.includes(q.id));
    count = pool.length;
    isOfficial = false;
    testName = "Yanlış Yaptıklarım";
  }

  if (pool.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h1 class="card-title">${escapeHtml(sahabi.sahabiName)} — ${escapeHtml(testName)}</h1>
        <p class="card-desc" style="margin:8px 0 16px;">Bu sahabîde tekrar edilecek yanlış sorunuz bulunmuyor.</p>
        <a href="#/test/sahabi/${escapeHtml(sahabi.sahabiSlug)}" class="btn btn-primary">Test Seçeneklerine Dön</a>
      </div>
    `;
    return;
  }

  const questions = shuffleArray(pool).slice(0, count).map(q => ({
    ...q,
    shuffledOptions: shuffleArray(q.options)
  }));

  startInteractiveQuizSession(container, {
    quizType: "sahabi",
    targetId: sahabi.id,
    targetTitle: sahabi.sahabiName,
    targetSlug: sahabi.sahabiSlug,
    testName,
    modeId: requestedMode,
    isOfficial,
    questions,
    route: `#/test/sahabi/${sahabi.sahabiSlug}?mode=${requestedMode}`
  });
}

function renderSahabiModeSelector(container, sahabi) {
  const state = loadState();
  const record = Number(state.testRecords[sahabi.id]) || 0;
  const stars = Number(state.testStars[sahabi.id]) || 0;
  const wrongIds = getActiveWrongQuestionIds(sahabi.id);

  container.innerHTML = `
    <div class="bio-hero-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span class="bio-ep-badge">${sahabi.episodeNumber}. Bölüm Testi</span>
        ${renderStarsHtml(stars, 5)}
      </div>
      <h1 class="bio-name">${escapeHtml(sahabi.sahabiName)}</h1>
      <p class="bio-ep-title">${escapeHtml(sahabi.title)}</p>
      <p style="margin-top:10px;font-size:0.88rem;color:var(--color-parchment);">
        En Yüksek Tam Test Rekoru: <strong>${formatNumber(record)} Puan</strong> • Hazır Soru: <strong>${sahabi.questions.length}</strong>
      </p>
    </div>

    <div class="card" style="margin-bottom:var(--space-md);">
      <h2 class="card-title" style="margin-bottom:8px;">Test Modunu Seç</h2>
      <p class="card-desc" style="margin-bottom:16px;">
        20 Soruluk Tam Test esas değerlendirme testidir; sahabî tamamlanmasını belirler ve 1-5 yıldız kazandırır. 10 Soruluk Hızlı Test antrenman amaçlıdır.
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="#/test/sahabi/${escapeHtml(sahabi.sahabiSlug)}?mode=full20" class="btn btn-primary btn-block">
          ${getIconSvg("star", 18)}
          <span>20 Soruluk Tam Test (Esas Değerlendirme)</span>
        </a>
        <a href="#/test/sahabi/${escapeHtml(sahabi.sahabiSlug)}?mode=quick10" class="btn btn-secondary btn-block">
          <span>10 Soruluk Hızlı Test (Antrenman)</span>
        </a>
        <a href="#/test/sahabi/${escapeHtml(sahabi.sahabiSlug)}?mode=all" class="btn btn-secondary btn-block">
          <span>Tüm Sorular (${sahabi.questions.length} Soru)</span>
        </a>
        <a href="#/test/sahabi/${escapeHtml(sahabi.sahabiSlug)}?mode=mistakes" class="btn btn-secondary btn-block">
          <span>Yanlış Yaptıklarım (${wrongIds.length} Soru)</span>
        </a>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <a href="#/biography/${escapeHtml(sahabi.sahabiSlug)}" class="btn btn-secondary" style="flex:1;">Biyografiyi Aç</a>
      <a href="#/tests" class="btn btn-secondary" style="flex:1;">Testlere Dön</a>
    </div>
  `;
}

export function renderCategoryTestRoute(container, slug, query = {}) {
  const cat = CATEGORIES.find(c => c.slug === slug || c.id === slug);
  if (!cat) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h1 class="card-title">Kategori Bulunamadı</h1>
        <a href="#/tests" class="btn btn-primary" style="margin-top:12px;">Testlere Dön</a>
      </div>
    `;
    return;
  }

  // Kategori soruları ayrıca yazılmaz; sahabî soruları kategori kimliklerine göre otomatik toplanır (Bölüm 16)
  let pool = Array.from(QUESTION_MAP.values()).filter(q => Array.isArray(q.categories) && q.categories.includes(cat.id));
  const requestedMode = query.mode || null;

  if (!requestedMode) {
    const state = loadState();
    const record = Number(state.categoryRecords[cat.id]) || 0;
    const stars = Number(state.categoryStars[cat.id]) || 0;
    const wrongIds = getActiveWrongQuestionIds(null, cat.id, QUESTION_MAP);

    container.innerHTML = `
      <div class="bio-hero-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <span class="bio-ep-badge">Kategori Testi</span>
          ${renderStarsHtml(stars, 5)}
        </div>
        <h1 class="bio-name">${escapeHtml(cat.name)}</h1>
        <p class="bio-summary-text">${escapeHtml(cat.shortDescription)}</p>
        <p style="margin-top:10px;font-size:0.88rem;color:var(--color-gold);">
          Kategori Rekoru: <strong>${formatNumber(record)} Puan</strong> • Toplam Havuz: <strong>${formatNumber(pool.length)} Soru</strong>
        </p>
      </div>

      <div class="card" style="margin-bottom:var(--space-md);">
        <h2 class="card-title" style="margin-bottom:12px;">Kategori Testi Seçenekleri</h2>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="#/test/category/${escapeHtml(cat.slug)}?mode=standard20" class="btn btn-primary btn-block">
            20 Soruluk Standart Test
          </a>
          <a href="#/test/category/${escapeHtml(cat.slug)}?mode=long40" class="btn btn-primary btn-block">
            40 Soruluk Uzun Test
          </a>
          <a href="#/test/category/${escapeHtml(cat.slug)}?mode=quick10" class="btn btn-secondary btn-block">
            10 Soruluk Hızlı Test (Antrenman)
          </a>
          <a href="#/test/category/${escapeHtml(cat.slug)}?mode=all" class="btn btn-secondary btn-block">
            Tüm Sorular (${formatNumber(pool.length)} Soru)
          </a>
          <a href="#/test/category/${escapeHtml(cat.slug)}?mode=mistakes" class="btn btn-secondary btn-block">
            Yanlış Yaptıklarım (${wrongIds.length} Soru)
          </a>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="#/category/${escapeHtml(cat.slug)}" class="btn btn-secondary" style="flex:1;">Kategoriyi Aç</a>
        <a href="#/tests" class="btn btn-secondary" style="flex:1;">Testlere Dön</a>
      </div>
    `;
    return;
  }

  let count = 20;
  let isOfficial = true;
  let testName = "20 Soruluk Standart Test";

  if (requestedMode === "quick10") {
    count = 10;
    isOfficial = false;
    testName = "10 Soruluk Hızlı Test";
  } else if (requestedMode === "standard20") {
    count = 20;
    isOfficial = true;
    testName = "20 Soruluk Standart Test";
  } else if (requestedMode === "long40") {
    count = 40;
    isOfficial = true;
    testName = "40 Soruluk Uzun Test";
  } else if (requestedMode === "all") {
    count = pool.length;
    isOfficial = false;
    testName = "Tüm Sorular";
  } else if (requestedMode === "mistakes") {
    const wrongIds = getActiveWrongQuestionIds(null, cat.id, QUESTION_MAP);
    pool = pool.filter(q => wrongIds.includes(q.id));
    count = pool.length;
    isOfficial = false;
    testName = "Yanlış Yaptıklarım";
  }

  if (pool.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h1 class="card-title">${escapeHtml(cat.name)} — ${escapeHtml(testName)}</h1>
        <p class="card-desc" style="margin:8px 0 16px;">Bu kategoride tekrar edilecek yanlış sorunuz bulunmuyor.</p>
        <a href="#/test/category/${escapeHtml(cat.slug)}" class="btn btn-primary">Kategori Test Seçeneklerine Dön</a>
      </div>
    `;
    return;
  }

  const questions = selectBalancedQuestions(pool, count);
  startInteractiveQuizSession(container, {
    quizType: "category",
    targetId: cat.id,
    targetTitle: cat.name,
    targetSlug: cat.slug,
    testName,
    modeId: requestedMode,
    isOfficial,
    questions,
    route: `#/test/category/${cat.slug}?mode=${requestedMode}`
  });
}

export function renderMixedTestRoute(container, query = {}) {
  const countReq = Number(query.count) || 20;
  const validCount = APP_SETTINGS.quiz.mixedCounts.includes(countReq) ? countReq : 20;
  const allPool = Array.from(QUESTION_MAP.values());
  const questions = selectBalancedQuestions(allPool, validCount);

  startInteractiveQuizSession(container, {
    quizType: "mixed",
    targetId: "mixed",
    targetTitle: "Karışık Test",
    targetSlug: null,
    testName: `${validCount} Soruluk Karışık Test`,
    modeId: `mixed${validCount}`,
    isOfficial: false,
    questions,
    route: `#/test/mixed?count=${validCount}`
  });
}

export function renderMistakesTestRoute(container) {
  const wrongIds = getActiveWrongQuestionIds();
  const pool = wrongIds.map(id => QUESTION_MAP.get(id)).filter(Boolean);

  if (pool.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <span class="symbol-badge" style="margin:0 auto 12px;">${getIconSvg("check", 24)}</span>
        <h1 class="card-title">Yanlış Yaptıklarım</h1>
        <p class="card-desc" style="margin:8px 0 16px;">Şu anda bekleyen yanlış sorunuz bulunmuyor. Tebrikler!</p>
        <a href="#/tests" class="btn btn-primary">Testlere Dön</a>
      </div>
    `;
    return;
  }

  const questions = selectBalancedQuestions(pool, pool.length);
  startInteractiveQuizSession(container, {
    quizType: "mistakes",
    targetId: "mistakes",
    targetTitle: "Yanlış Yaptıklarım",
    targetSlug: null,
    testName: "Yanlış Yaptıklarım Tekrarı",
    modeId: "mistakes",
    isOfficial: false,
    questions,
    route: "#/test/mistakes"
  });
}

export function renderFavoritesTestRoute(container) {
  const state = loadState();
  const favIds = Array.isArray(state.favoriteQuestions) ? state.favoriteQuestions : [];
  const pool = favIds.map(id => QUESTION_MAP.get(id)).filter(Boolean);

  if (pool.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <span class="symbol-badge" style="margin:0 auto 12px;">${getIconSvg("heart", 22)}</span>
        <h1 class="card-title">Favori Sorularım</h1>
        <p class="card-desc" style="margin:8px 0 16px;">Henüz favorilerinize eklediğiniz bir soru bulunmuyor. Test çözerken kalp simgesine dokunarak soruları favorilerinize ekleyebilirsiniz.</p>
        <a href="#/tests" class="btn btn-primary">Testlere Dön</a>
      </div>
    `;
    return;
  }

  const questions = selectBalancedQuestions(pool, pool.length);
  startInteractiveQuizSession(container, {
    quizType: "favorites",
    targetId: "favorites",
    targetTitle: "Favori Sorularım",
    targetSlug: null,
    testName: "Favori Sorularım Testi",
    modeId: "favorites",
    isOfficial: false,
    questions,
    route: "#/test/favorites"
  });
}

function startInteractiveQuizSession(container, config) {
  const session = {
    sessionId: generateSessionId(config.quizType),
    ...config,
    currentIndex: 0,
    score: 0,
    currentStreak: 0,
    maxStreak: 0,
    correctCount: 0,
    wrongCount: 0,
    emptyCount: 0,
    answeredCurrent: false,
    selectedOption: null,
    lastEarnedPoints: 0,
    wrongQuestionsInSession: [],
    fiftyFiftyLeft: 2,
    hintLeft: 2,
    eliminatedOptions: [],
    shownHintText: null
  };

  function persistProgress() {
    updateState(s => ({
      ...s,
      activeQuizProgress: {
        route: session.route,
        title: `${session.targetTitle} (${session.testName})`,
        currentIndex: session.currentIndex,
        totalQuestions: session.questions.length,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  function renderQuestionStep() {
    persistProgress();
    const q = session.questions[session.currentIndex];
    const total = session.questions.length;
    const stepNum = session.currentIndex + 1;
    const progressPct = Math.round((stepNum / total) * 100);
    const isFav = isQuestionFavorite(q.id);
    const isMistakeRecord = Boolean(loadState().wrongQuestions?.[q.id]);
    const letters = ["A", "B", "C", "D"];

    container.innerHTML = `
      <div class="quiz-topbar">
        <div>
          <div style="font-size:0.78rem;font-weight:800;color:var(--color-dark-gold);text-transform:uppercase;">
            ${escapeHtml(session.testName)}
          </div>
          <h1 class="card-title" style="font-size:1.1rem;">${escapeHtml(session.targetTitle)}</h1>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button
            type="button"
            id="quiz-fav-q-btn"
            class="fav-btn ${isFav ? "active" : ""}"
            aria-label="Soruyu Favorilere ${isFav ? "Eklendi" : "Ekle"}"
            aria-pressed="${isFav}"
          >
            ${isFav ? getIconSvg("heart-filled", 18) : getIconSvg("heart", 18)}
          </button>
          <a href="#/tests" id="quiz-exit-btn" class="btn btn-secondary btn-sm">Testten Çıkış</a>
        </div>
      </div>

      <div class="progress-track" style="margin-bottom:10px;" aria-label="Soru ilerlemesi ${stepNum} / ${total}">
        <div class="progress-fill" style="width:${progressPct}%;"></div>
      </div>

      <div class="quiz-metrics-bar">
        <span>Soru: ${stepNum} / ${total}</span>
        <span>Puan: <strong id="quiz-live-score">${formatNumber(session.score)}</strong></span>
        <span>Seri: <strong id="quiz-live-streak">${session.currentStreak}</strong></span>
      </div>

      <div class="quiz-lifelines-bar" role="group" aria-label="Yardımcı Jokerler">
        <button
          type="button"
          id="quiz-5050-btn"
          class="lifeline-btn"
          ${session.answeredCurrent || session.fiftyFiftyLeft <= 0 || session.eliminatedOptions.length > 0 ? "disabled" : ""}
        >
          <span>50:50 İki Şıkkı Ele (${session.fiftyFiftyLeft})</span>
        </button>
        <button
          type="button"
          id="quiz-hint-btn"
          class="lifeline-btn"
          ${session.answeredCurrent || session.hintLeft <= 0 || session.shownHintText ? "disabled" : ""}
        >
          ${getIconSvg("lamp", 14)}
          <span>İpucu Gör (${session.hintLeft})</span>
        </button>
      </div>

      ${session.shownHintText ? `
        <div class="card" style="padding:10px 12px;margin-bottom:10px;background:var(--bg-surface-alt);font-size:0.82rem;color:var(--text-main);">
          <strong style="color:var(--heading-color);">Hatırlatma İpucu:</strong> ${escapeHtml(session.shownHintText)}
        </div>
      ` : ""}

      <div class="card quiz-question-card">
        <p class="quiz-question-text">${escapeHtml(q.question)}</p>
      </div>

      <div class="options-stack" role="group" aria-label="Cevap Seçenekleri">
        ${q.shuffledOptions.map((optText, idx) => {
          const isEliminated = session.eliminatedOptions.includes(optText);
          let stateClass = "";
          if (session.answeredCurrent) {
            if (optText === q.correctAnswer) stateClass = "correct";
            else if (optText === session.selectedOption) stateClass = "wrong";
          }
          return `
            <button
              type="button"
              class="option-btn ${stateClass}"
              style="${isEliminated && !session.answeredCurrent ? "opacity:0.32;text-decoration:line-through;" : ""}"
              data-opt-index="${idx}"
              ${session.answeredCurrent || isEliminated ? "disabled" : ""}
            >
              <span class="option-letter">${letters[idx] || idx + 1}</span>
              <span style="flex:1;">${escapeHtml(optText)}</span>
            </button>
          `;
        }).join("")}
      </div>

      ${session.answeredCurrent ? `
        <div class="explanation-box" role="status">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            <strong style="color:${session.selectedOption === q.correctAnswer ? "var(--color-success)" : "var(--color-error)"};">
              ${session.selectedOption === q.correctAnswer
                ? `Doğru Cevap! (+${session.lastEarnedPoints} Puan)`
                : "Yanlış Cevap (0 Puan)"}
            </strong>
            <span class="badge">${escapeHtml(q.sahabiName)}</span>
          </div>
          <p>${escapeHtml(q.explanation)}</p>

          ${(isMistakeRecord || session.quizType === "mistakes") ? `
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(6,47,42,0.12);display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" id="mark-learned-btn" class="btn btn-secondary btn-sm">Öğrendim Olarak İşaretle</button>
              <button type="button" id="keep-later-btn" class="btn btn-secondary btn-sm">Daha Sonra Tekrar Sor</button>
            </div>
          ` : ""}
        </div>

        <button type="button" id="quiz-next-btn" class="btn btn-primary btn-block">
          <span>${session.currentIndex + 1 < total ? "Sonraki Soru" : "Test Sonucunu Gör"}</span>
        </button>
      ` : ""}
    `;

    const favQBtn = document.getElementById("quiz-fav-q-btn");
    if (favQBtn) {
      favQBtn.addEventListener("click", () => {
        const added = toggleQuestionFavorite(q.id);
        showToast(added ? "Soru favorilere eklendi." : "Soru favorilerden çıkarıldı.");
        renderQuestionStep();
      });
    }

    const exitBtn = document.getElementById("quiz-exit-btn");
    if (exitBtn) {
      exitBtn.addEventListener("click", () => {
        updateState(s => ({ ...s, activeQuizProgress: null }));
      });
    }

    if (!session.answeredCurrent) {
      document.getElementById("quiz-5050-btn")?.addEventListener("click", () => {
        if (session.fiftyFiftyLeft <= 0 || session.eliminatedOptions.length > 0) return;
        const wrongOpts = q.shuffledOptions.filter(o => o !== q.correctAnswer);
        session.eliminatedOptions = shuffleArray(wrongOpts).slice(0, 2);
        session.fiftyFiftyLeft -= 1;
        renderQuestionStep();
      });

      document.getElementById("quiz-hint-btn")?.addEventListener("click", () => {
        if (session.hintLeft <= 0 || session.shownHintText) return;
        const sh = SAHABI_BY_ID.get(q.sahabiId);
        session.shownHintText = sh ? `${sh.sahabiName} — ${sh.title} (${sh.city} Bölümü)` : q.explanation;
        session.hintLeft -= 1;
        renderQuestionStep();
      });

      container.querySelectorAll(".option-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          if (session.answeredCurrent) return; // Hızlı ve tekrar eden dokunmalara karşı kilit
          session.answeredCurrent = true;
          const idx = Number(btn.getAttribute("data-opt-index"));
          const chosen = q.shuffledOptions[idx];
          session.selectedOption = chosen;

          if (chosen === q.correctAnswer) {
            session.currentStreak += 1;
            if (session.currentStreak > session.maxStreak) {
              session.maxStreak = session.currentStreak;
            }
            const pts = calculateStreakQuestionScore(session.currentStreak);
            session.lastEarnedPoints = pts;
            session.score += pts;
            session.correctCount += 1;
            triggerHaptic("success");
          } else {
            session.currentStreak = 0;
            session.lastEarnedPoints = 0;
            session.wrongCount += 1;
            session.wrongQuestionsInSession.push(q);
            recordWrongQuestion(q.id, q.sahabiId);
            triggerHaptic("error");
          }

          renderQuestionStep();
        });
      });
    } else {
      const learnedBtn = document.getElementById("mark-learned-btn");
      if (learnedBtn) {
        learnedBtn.addEventListener("click", () => {
          markWrongQuestionLearned(q.id);
          showToast("Soru 'Öğrendim' olarak işaretlendi.");
          learnedBtn.disabled = true;
        });
      }
      const keepBtn = document.getElementById("keep-later-btn");
      if (keepBtn) {
        keepBtn.addEventListener("click", () => {
          keepWrongQuestionForLater(q.id);
          showToast("Soru daha sonra tekrar sorulmak üzere listede tutuldu.");
          keepBtn.disabled = true;
        });
      }

      const nextBtn = document.getElementById("quiz-next-btn");
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          if (session.currentIndex + 1 < session.questions.length) {
            session.currentIndex += 1;
            session.answeredCurrent = false;
            session.selectedOption = null;
            session.lastEarnedPoints = 0;
            session.eliminatedOptions = [];
            session.shownHintText = null;
            session.eliminatedOptions = [];
            session.shownHintText = null;
            session.eliminatedOptions = [];
            session.shownHintText = null;
            renderQuestionStep();
          } else {
            renderQuizResultScreen(container, session);
          }
        });
      }
    }
  }

  renderQuestionStep();
}

function renderQuizResultScreen(container, session) {
  const totalQuestions = session.questions.length;
  const emptyCount = Math.max(0, totalQuestions - session.correctCount - session.wrongCount);
  const accuracyPercent = totalQuestions > 0 ? Math.round((session.correctCount / totalQuestions) * 100) : 0;
  const visualStars = calculateStarsFromAccuracy(accuracyPercent);

  const commitOutcome = commitQuizSessionResult({
    sessionId: session.sessionId,
    quizType: session.quizType,
    targetId: session.targetId,
    targetTitle: session.targetTitle,
    modeId: session.modeId,
    isOfficial: session.isOfficial,
    totalQuestions,
    correctCount: session.correctCount,
    wrongCount: session.wrongCount,
    emptyCount,
    sessionScore: session.score,
    maxSessionStreak: session.maxStreak,
    route: session.route
  });

  // Geliştirilmesi gereken alan tespiti
  let improvementArea = "Bütün soruları doğru cevapladın; tebrikler!";
  if (session.wrongQuestionsInSession.length > 0) {
    const sampleSahabiNames = Array.from(new Set(session.wrongQuestionsInSession.map(q => q.sahabiName))).slice(0, 3);
    improvementArea = `${sampleSahabiNames.join(", ")} biyografi ve ders bölümlerini gözden geçirmen faydalı olacaktır.`;
  }

  const bioTargetSlug = session.quizType === "sahabi" && session.targetSlug
    ? session.targetSlug
    : (session.wrongQuestionsInSession[0]?.sahabiSlug || SAHABIS[0].sahabiSlug);

  container.innerHTML = `
    <div class="bio-hero-card" style="text-align:center;">
      <span class="bio-ep-badge">${escapeHtml(session.testName)} Sonucu</span>
      <h1 class="bio-name">${escapeHtml(session.targetTitle)}</h1>
      <div style="margin:12px 0;">
        ${renderStarsHtml(visualStars, 5)}
      </div>
      <div style="font-size:2rem;font-weight:800;color:var(--color-gold);">
        ${formatNumber(session.score)} Puan
      </div>
      <p style="font-size:0.88rem;color:var(--color-parchment);margin-top:4px;">
        ${commitOutcome.isNewRecord
          ? `Yeni Rekor! Toplam Puana Eklenen Fark: +${formatNumber(commitOutcome.addedToTotalScore)}`
          : `Önceki Rekor: ${formatNumber(commitOutcome.previousRecord)} • Toplam Puana Eklenen: +${formatNumber(commitOutcome.addedToTotalScore)}`}
      </p>
    </div>

    <div class="summary-stats-grid" style="margin-bottom:var(--space-md);">
      <div class="stat-mini-card">
        <div class="stat-mini-val" style="color:var(--color-success);">${session.correctCount}</div>
        <div class="stat-mini-label">Doğru Sayısı</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-mini-val" style="color:var(--color-error);">${session.wrongCount}</div>
        <div class="stat-mini-label">Yanlış Sayısı</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-mini-val">${emptyCount}</div>
        <div class="stat-mini-label">Boş Sayısı</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-mini-val">%${accuracyPercent}</div>
        <div class="stat-mini-label">Doğruluk Oranı</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--space-md);">
      <div class="card-meta-row" style="margin-bottom:10px;">
        <span>En İyi Seri</span>
        <strong>${session.maxStreak} Doğru</strong>
      </div>
      <div class="card-meta-row" style="margin-bottom:10px;">
        <span>Kazanılan Yıldız</span>
        <strong>${visualStars} / 5 Yıldız ${session.isOfficial ? "(Kalıcı)" : "(Antrenman)"}</strong>
      </div>
      <div style="padding-top:10px;border-top:1px solid var(--border-color);">
        <strong style="font-size:0.86rem;color:var(--color-deep-emerald);display:block;margin-bottom:4px;">Geliştirilmesi Gereken Alan:</strong>
        <p class="card-desc">${escapeHtml(improvementArea)}</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px;">
      ${session.wrongQuestionsInSession.length > 0 ? `
        <button type="button" id="res-retry-wrong-btn" class="btn btn-gold btn-block">
          Yanlışlarımı Tekrarla (${session.wrongQuestionsInSession.length} Soru)
        </button>
      ` : `
        <a href="#/test/mistakes" class="btn btn-secondary btn-block">
          Yanlışlarımı Tekrarla
        </a>
      `}
      <a href="#/biography/${escapeHtml(bioTargetSlug)}" class="btn btn-primary btn-block">
        Biyografiyi Aç
      </a>
      <a href="#/tests" class="btn btn-secondary btn-block">
        Testlere Dön
      </a>
      <button type="button" id="res-download-png-btn" class="btn btn-gold btn-block">
        ${getIconSvg("download", 18)}
        <span>Sonuç Kartını Görsel Olarak İndir (PNG)</span>
      </button>
      <button type="button" id="res-share-btn" class="btn btn-secondary btn-block">
        ${getIconSvg("share", 18)}
        <span>Sonucu Metin Olarak Paylaş</span>
      </button>
    </div>
  `;

  const retryWrongBtn = document.getElementById("res-retry-wrong-btn");
  if (retryWrongBtn) {
    retryWrongBtn.addEventListener("click", () => {
      const retryQuestions = session.wrongQuestionsInSession.map(q => ({
        ...q,
        shuffledOptions: shuffleArray(q.options)
      }));
      startInteractiveQuizSession(container, {
        quizType: "mistakes",
        targetId: session.targetId,
        targetTitle: `${session.targetTitle} — Yanlışlarım`,
        targetSlug: session.targetSlug,
        testName: "Yanlışlarımı Tekrarla",
        modeId: "mistakes",
        isOfficial: false,
        questions: retryQuestions,
        route: session.route
      });
    });
  }

  const dlPngBtn = document.getElementById("res-download-png-btn");
  if (dlPngBtn) {
    dlPngBtn.addEventListener("click", () => {
      const starSymbols = "★".repeat(visualStars) + "☆".repeat(Math.max(0, 5 - visualStars));
      downloadVisualCardPng({
        badgeText: session.testName,
        title: session.targetTitle,
        subtitle: `${formatNumber(session.score)} Puan • ${starSymbols}`,
        sectionHeading: "Test Değerlendirme Özeti",
        lines: [
          `Doğruluk Oranı: %${accuracyPercent} (${session.correctCount} Doğru, ${session.wrongCount} Yanlış)`,
          `En İyi Seri: ${session.maxStreak} Arka Arkaya Doğru`,
          `Kazanılan Yıldız: ${visualStars} / 5 Yıldız`,
          improvementArea
        ],
        filename: `sahabeyi-tani-sonuc-${session.targetSlug || "test"}.png`
      });
    });
  }

  const shareBtn = document.getElementById("res-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      shareTextContent({
        title: `SAHABEYİ TANI — ${session.targetTitle} Test Sonucu`,
        text: `${session.targetTitle} (${session.testName}) sonucum: ${session.score} Puan, %${accuracyPercent} Doğruluk (${session.correctCount}/${totalQuestions} doğru, ${visualStars} Yıldız).`
      });
    });
  }
}
