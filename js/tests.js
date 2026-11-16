// Testler Ana Sayfası ve Görünüm Seçenekleri (Bölüm 13, 14, 15, 16, 17)
import APP_CONTENT from "../data/app-content.js";
import APP_SETTINGS from "../data/app-settings.js";
import CATEGORIES from "../data/categories.js";
import SAHABIS from "../data/sahabis-index.js";
import { getIconSvg, escapeHtml, formatNumber, normalizeTr } from "./utils.js";
import { loadState, updateState } from "./storage.js";
import { renderStarsHtml } from "./stars.js";
import { getActiveWrongQuestionIds } from "./favorites.js";
import { getCategoryMetrics } from "./categories.js";

let activeTestsTab = "sahabi-tests"; // "sahabi-tests" | "category-tests" | "mixed-test"
let sahabiTestSearch = "";

export function renderTestsPage(container) {
  const state = loadState();
  const viewMode = state.testView || "card";
  const wrongIds = getActiveWrongQuestionIds();
  const favQCount = Array.isArray(state.favoriteQuestions) ? state.favoriteQuestions.length : 0;

  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:var(--space-md);">
      <section class="page-header" style="margin-bottom:0;">
        <h1 class="page-title">${escapeHtml(APP_CONTENT.tests.title)}</h1>
        <p class="page-subtitle">${escapeHtml(APP_CONTENT.tests.subtitle)}</p>
      </section>
      <div class="view-toggle" role="group" aria-label="Test Listesi Görünümü">
        <button type="button" id="test-view-card" class="view-toggle-btn ${viewMode === "card" ? "active" : ""}" aria-pressed="${viewMode === "card"}">
          ${getIconSvg("grid", 16)}
          <span>Kart</span>
        </button>
        <button type="button" id="test-view-list" class="view-toggle-btn ${viewMode === "list" ? "active" : ""}" aria-pressed="${viewMode === "list"}">
          ${getIconSvg("list", 16)}
          <span>Liste</span>
        </button>
      </div>
    </div>

    <!-- Üç Ana Test Seçeneği -->
    <section class="cards-grid" style="margin-bottom:var(--space-md);" aria-label="Ana Test Türleri">
      ${APP_CONTENT.tests.mainOptions.map(opt => {
        const isSelected = activeTestsTab === opt.id;
        return `
          <button
            type="button"
            data-test-tab="${escapeHtml(opt.id)}"
            class="card card-interactive"
            style="text-align:left;border:2px solid ${isSelected ? "var(--color-gold)" : "var(--border-color)"};background:${isSelected ? "var(--color-parchment)" : "var(--bg-surface)"};"
            aria-pressed="${isSelected}"
          >
            <div style="display:flex;align-items:center;gap:12px;">
              <span class="symbol-badge">${getIconSvg(opt.icon, 22)}</span>
              <div>
                <h2 class="card-title">${escapeHtml(opt.title)}</h2>
                <p class="card-desc" style="margin-top:2px;">${escapeHtml(opt.description)}</p>
              </div>
            </div>
          </button>
        `;
      }).join("")}
    </section>

    <!-- İkincil Seçenekler ve Kimim Ben Erişimi -->
    <section class="card" style="margin-bottom:var(--space-lg);" aria-label="Ek Test Seçenekleri">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:8px;">
        <a href="#/test/mistakes" class="btn btn-secondary">
          <span>Yanlış Yaptıklarım (${wrongIds.length})</span>
        </a>
        <a href="#/test/favorites" class="btn btn-secondary">
          <span>Favori Sorularım (${favQCount})</span>
        </a>
        ${state.activeQuizProgress && state.activeQuizProgress.route ? `
          <a href="${escapeHtml(state.activeQuizProgress.route)}" class="btn btn-gold">
            <span>Kaldığım Teste Devam Et</span>
          </a>
        ` : state.lastPlayedTest && state.lastPlayedTest.route ? `
          <a href="${escapeHtml(state.lastPlayedTest.route)}" class="btn btn-secondary">
            <span>Kaldığım Teste Devam Et</span>
          </a>
        ` : ""}
        <a href="#/who-am-i" class="btn btn-primary">
          ${getIconSvg("lamp", 18)}
          <span>Kimim Ben? Oyunu</span>
        </a>
      </div>
    </section>

    <div id="tests-tab-body"></div>
  `;

  const cardBtn = document.getElementById("test-view-card");
  const listBtn = document.getElementById("test-view-list");
  if (cardBtn) {
    cardBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, testView: "card" }));
      renderTestsPage(container);
    });
  }
  if (listBtn) {
    listBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, testView: "list" }));
      renderTestsPage(container);
    });
  }

  container.querySelectorAll("[data-test-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTestsTab = btn.getAttribute("data-test-tab");
      renderTestsPage(container);
    });
  });

  renderTestsTabContent();
}

function renderTestsTabContent() {
  const bodyEl = document.getElementById("tests-tab-body");
  if (!bodyEl) return;

  const state = loadState();
  const viewMode = state.testView || "card";

  if (activeTestsTab === "favorites-test") {
    const favSahabiObjects = SAHABIS.filter(s => state.favoriteSahabis.includes(s.id));
    const favQCount = Array.isArray(state.favoriteQuestions) ? state.favoriteQuestions.length : 0;

    bodyEl.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-md);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <h3 class="card-title">Favori Sorularım Testi (${favQCount} Soru)</h3>
          <p class="card-desc">Test çözerken kalp simgesiyle kaydettiğin favori soruları tek bir testte çöz.</p>
        </div>
        <a href="#/test/favorites" class="btn btn-primary btn-sm">Favori Soruları Çöz</a>
      </div>

      <h3 class="section-heading">Favori Sahabîlerimin Testleri (${favSahabiObjects.length})</h3>
      ${favSahabiObjects.length > 0 ? `
        <div class="list-stack">
          ${favSahabiObjects.map(s => `
            <div class="list-row card-interactive">
              <div class="list-row-main">
                <span class="symbol-badge" style="font-weight:800;font-size:0.84rem;">${s.episodeNumber}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(s.sahabiName)}</div>
                  <div class="list-row-sub">${escapeHtml(s.title)} • ${escapeHtml(s.city)}</div>
                </div>
              </div>
              <div class="list-row-right">
                ${renderStarsHtml(state.testStars[s.id] || 0, 5)}
                <a href="#/test/sahabi/${escapeHtml(s.sahabiSlug)}" class="btn btn-primary btn-sm">Testi Çöz</a>
              </div>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="card">
          <p class="card-desc">Henüz favorilerinize eklediğiniz bir sahabî bulunmuyor. Sahabîleri Tanı bölümünden kalp simgesine dokunarak favori ekleyebilirsiniz.</p>
        </div>
      `}
    `;
    return;
  }

  if (activeTestsTab === "mixed-test") {
    bodyEl.innerHTML = `
      <div class="card" style="padding:var(--space-lg);text-align:center;">
        <span class="symbol-badge" style="margin:0 auto 12px;width:54px;height:54px;">${getIconSvg("star", 26)}</span>
        <h2 class="card-title" style="font-size:1.3rem;">Karışık Test</h2>
        <p class="card-desc" style="max-width:480px;margin:8px auto 20px;">
          Bütün oynanabilir sahabîlerin sorularından dengeli biçimde seçilen sorularla genel bilgini ölç. Soru sayısını seçerek hemen başla:
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
          ${APP_SETTINGS.quiz.mixedCounts.map(cnt => `
            <a href="#/test/mixed?count=${cnt}" class="btn btn-primary" style="min-width:140px;">
              ${cnt} Soru Başlat
            </a>
          `).join("")}
        </div>
      </div>
    `;
    return;
  }

  if (activeTestsTab === "category-tests") {
    const catItems = CATEGORIES.map(c => ({
      ...c,
      metrics: getCategoryMetrics(c.id, state),
      highScore: Number(state.categoryRecords[c.id]) || 0,
      stars: Number(state.categoryStars[c.id]) || 0
    }));

    bodyEl.innerHTML = viewMode === "card" ? `
      <div class="cards-grid">
        ${catItems.map(c => `
          <article class="card card-interactive test-item-card">
            <div>
              <div class="card-top-row">
                <span class="symbol-badge">${getIconSvg(c.icon, 20)}</span>
                ${renderStarsHtml(c.stars, 5)}
              </div>
              <h3 class="card-title" style="margin-top:10px;">${escapeHtml(c.name)}</h3>
              <p class="card-desc" style="margin-top:4px;">${formatNumber(c.metrics.questionCount)} Hazır Soru</p>
            </div>
            <div>
              <div class="card-meta-row" style="margin:8px 0 12px;">
                <span>En Yüksek Puan</span>
                <strong>${formatNumber(c.highScore)}</strong>
              </div>
              <a href="#/test/category/${escapeHtml(c.slug)}" class="btn btn-primary btn-block">Başlat</a>
            </div>
          </article>
        `).join("")}
      </div>
    ` : `
      <div class="list-stack">
        ${catItems.map(c => `
          <div class="list-row card-interactive">
            <div class="list-row-main">
              <span class="symbol-badge">${getIconSvg(c.icon, 20)}</span>
              <div class="list-row-text">
                <div class="list-row-title">${escapeHtml(c.name)}</div>
                <div class="list-row-sub">${formatNumber(c.metrics.questionCount)} Soru • Rekor: ${formatNumber(c.highScore)}</div>
              </div>
            </div>
            <div class="list-row-right">
              ${renderStarsHtml(c.stars, 5)}
              <a href="#/test/category/${escapeHtml(c.slug)}" class="btn btn-primary btn-sm">Başlat</a>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  // Varsayılan: SAHABÎ TESTLERİ
  const qNorm = normalizeTr(sahabiTestSearch);
  const filteredSahabis = SAHABIS.filter(s => {
    if (!s.active) return false;
    if (!qNorm) return true;
    return normalizeTr(`${s.sahabiName} ${s.title} ${s.episodeNumber}`).includes(qNorm);
  });

  bodyEl.innerHTML = `
    <div class="filter-bar" style="margin-bottom:var(--space-md);">
      <div class="search-input-wrap">
        ${getIconSvg("search", 18)}
        <input
          type="search"
          id="sahabi-test-search"
          class="search-input"
          placeholder="Sahabî testi ara..."
          value="${escapeHtml(sahabiTestSearch)}"
          aria-label="Sahabî testi ara"
        >
      </div>
    </div>
    <div id="sahabi-tests-list-inner"></div>
  `;

  const searchIn = document.getElementById("sahabi-test-search");
  if (searchIn) {
    searchIn.addEventListener("input", e => {
      sahabiTestSearch = e.target.value;
      renderSahabiTestsItems(filteredSahabis, viewMode, state);
    });
  }

  renderSahabiTestsItems(filteredSahabis, viewMode, state);
}

function renderSahabiTestsItems(initialList, viewMode, state) {
  const inner = document.getElementById("sahabi-tests-list-inner");
  if (!inner) return;

  const qNorm = normalizeTr(sahabiTestSearch);
  const list = SAHABIS.filter(s => {
    if (!s.active) return false;
    if (!qNorm) return true;
    return normalizeTr(`${s.sahabiName} ${s.title} ${s.episodeNumber}`).includes(qNorm);
  });

  if (viewMode === "card") {
    inner.innerHTML = `
      <div class="cards-grid">
        ${list.map(s => {
          const isReady = s.contentStatus === "ready" && s.questions.length >= 20;
          const highScore = Number(state.testRecords[s.id]) || 0;
          const stars = Number(state.testStars[s.id]) || 0;
          return `
            <article class="card card-interactive test-item-card">
              <div>
                <div class="card-top-row">
                  <span class="badge">${s.episodeNumber}. Bölüm</span>
                  ${renderStarsHtml(stars, 5)}
                </div>
                <h3 class="card-title" style="margin-top:8px;">${escapeHtml(s.sahabiName)}</h3>
                <p class="card-desc" style="margin-top:2px;">${isReady ? `${s.questions.length} Soru` : "Hazırlanıyor"}</p>
              </div>
              <div>
                <div class="card-meta-row" style="margin:8px 0 12px;">
                  <span>En Yüksek Puan</span>
                  <strong>${formatNumber(highScore)}</strong>
                </div>
                ${isReady ? `
                  <a href="#/test/sahabi/${escapeHtml(s.sahabiSlug)}" class="btn btn-primary btn-block">Başlat</a>
                ` : `
                  <button type="button" class="btn btn-secondary btn-block" disabled>Hazırlanıyor</button>
                `}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  } else {
    inner.innerHTML = `
      <div class="list-stack">
        ${list.map(s => {
          const isReady = s.contentStatus === "ready" && s.questions.length >= 20;
          const highScore = Number(state.testRecords[s.id]) || 0;
          const stars = Number(state.testStars[s.id]) || 0;
          return `
            <div class="list-row card-interactive">
              <div class="list-row-main">
                <span class="symbol-badge" style="font-weight:800;font-size:0.85rem;">${s.episodeNumber}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(s.sahabiName)}</div>
                  <div class="list-row-sub">${isReady ? `${s.questions.length} Soru` : "Hazırlanıyor"} • Rekor: ${formatNumber(highScore)}</div>
                </div>
              </div>
              <div class="list-row-right">
                ${renderStarsHtml(stars, 5)}
                ${isReady ? `
                  <a href="#/test/sahabi/${escapeHtml(s.sahabiSlug)}" class="btn btn-primary btn-sm">Başlat</a>
                ` : `
                  <button type="button" class="btn btn-secondary btn-sm" disabled>Hazırlanıyor</button>
                `}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}
