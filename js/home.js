// Ana Sayfa modülü (Kompakt 2x2/Liste görünüm + Günün Sahabîsi + İlerleme Özeti + İletişim + En Altta Küçük Puntolu Dua)
import APP_CONTENT from "../data/app-content.js";
import SAHABIS from "../data/sahabis-index.js";
import { getIconSvg, escapeHtml, formatNumber, renderDuaBannerHtml, renderContactCardHtml } from "./utils.js";
import { loadState, updateState } from "./storage.js";
import { computeDynamicTotalStars } from "./stars.js";

function getDailySahabi() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const idx = Math.abs(dayOfYear) % SAHABIS.length;
  return SAHABIS[idx] || SAHABIS[0];
}

export function renderHomePage(container) {
  const state = loadState();
  const homeData = APP_CONTENT.home;
  const homeView = state.homeView || "grid2x2";
  const totalStars = computeDynamicTotalStars(state);
  const completedCount = Array.isArray(state.completedSahabis) ? state.completedSahabis.length : 0;
  const readCount = Array.isArray(state.readSahabis) ? state.readSahabis.length : 0;
  const dailySahabi = getDailySahabi();
  const dailyLesson = dailySahabi?.lessons?.[0] || dailySahabi?.summary || "";

  let continueCardHtml = "";
  if (state.activeQuizProgress && state.activeQuizProgress.route) {
    const prog = state.activeQuizProgress;
    continueCardHtml = `
      <div class="card card-interactive continue-card">
        <div class="continue-card-body">
          <span class="badge badge-gold" style="margin-bottom:4px;">Yarım Kalan Test</span>
          <h3 class="card-title">${escapeHtml(prog.title || "Teste Devam Et")}</h3>
          <p class="card-desc">Soru ${(Number(prog.currentIndex) || 0) + 1} / ${Number(prog.totalQuestions) || 20}</p>
        </div>
        <a href="${escapeHtml(prog.route)}" class="btn btn-primary btn-sm">Devam Et</a>
      </div>
    `;
  } else if (state.lastPlayedTest && state.lastPlayedTest.route) {
    const last = state.lastPlayedTest;
    continueCardHtml = `
      <div class="card card-interactive continue-card">
        <div class="continue-card-body">
          <span class="badge" style="margin-bottom:4px;">Son Çalışılan</span>
          <h3 class="card-title">${escapeHtml(last.title)}</h3>
          <p class="card-desc">Son Puan: ${formatNumber(last.score)} • Doğruluk: %${Number(last.accuracyPercent) || 0}</p>
        </div>
        <a href="${escapeHtml(last.route)}" class="btn btn-primary btn-sm">Yeniden Aç</a>
      </div>
    `;
  } else {
    const firstSahabi = SAHABIS[0];
    continueCardHtml = `
      <div class="card card-interactive continue-card">
        <div class="continue-card-body">
          <span class="badge badge-gold" style="margin-bottom:4px;">1. Bölümden Başla</span>
          <h3 class="card-title">${escapeHtml(firstSahabi.sahabiName)} — ${escapeHtml(firstSahabi.title)}</h3>
          <p class="card-desc">İlk sahabî biyografisini okuyarak yolculuğa başla.</p>
        </div>
        <a href="#/biography/${escapeHtml(firstSahabi.sahabiSlug)}" class="btn btn-primary btn-sm">Başla</a>
      </div>
    `;
  }

  container.innerHTML = `
    <section class="home-hero">
      <img src="${escapeHtml(APP_CONTENT.logoUrl)}" alt="SAHABEYİ TANI Logo" class="home-hero-logo">
      <span class="home-hero-badge">${escapeHtml(APP_CONTENT.subSlogan)}</span>
      <h1 class="home-hero-title">${escapeHtml(homeData.title)}</h1>
      <p class="home-hero-question">${escapeHtml(homeData.prompt)}</p>
    </section>

    <div class="home-layout-toolbar">
      <div class="view-toggle view-toggle-compact" role="group" aria-label="Görünüm Düzeni Seçimi">
        <button
          type="button"
          id="home-view-grid-btn"
          class="view-toggle-btn ${homeView === "grid2x2" ? "active" : ""}"
          aria-pressed="${homeView === "grid2x2"}"
          aria-label="Kutu Görünümü"
          title="Kutu Görünümü"
        >
          ${getIconSvg("grid", 16)}
        </button>
        <button
          type="button"
          id="home-view-list-btn"
          class="view-toggle-btn ${homeView === "list" ? "active" : ""}"
          aria-pressed="${homeView === "list"}"
          aria-label="Liste Görünümü"
          title="Liste Görünümü"
        >
          ${getIconSvg("list", 16)}
        </button>
      </div>
    </div>

    <section class="home-nav-grid ${homeView === "grid2x2" ? "grid-2x2" : "list-1col"}" aria-label="Uygulama Bölümleri">
      ${homeData.cards.map(card => `
        <a href="${escapeHtml(card.route)}" class="card card-interactive home-action-card">
          <div class="home-action-top">
            <span class="symbol-badge home-action-icon">${getIconSvg(card.icon, 20)}</span>
            <h2 class="home-action-title">${escapeHtml(card.title)}</h2>
          </div>
          <p class="home-action-desc">${escapeHtml(card.description)}</p>
          <span class="home-action-chevron" aria-hidden="true">${getIconSvg("chevron-right", 18)}</span>
        </a>
      `).join("")}
    </section>

    ${dailySahabi ? `
      <section class="daily-sahabi-card" aria-labelledby="daily-sahabi-heading">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
          <span class="badge badge-gold">Günün Sahabîsi ve Nebevî Dersi</span>
          <span class="badge badge-city">${dailySahabi.episodeNumber}. Bölüm • ${escapeHtml(dailySahabi.city)}</span>
        </div>
        <h2 id="daily-sahabi-heading" class="card-title" style="font-size:1.22rem;">
          ${escapeHtml(dailySahabi.sahabiName)} — <span style="color:var(--accent-gold);">${escapeHtml(dailySahabi.title)}</span>
        </h2>
        <p class="daily-sahabi-quote">“${escapeHtml(dailyLesson)}”</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          <a href="#/biography/${escapeHtml(dailySahabi.sahabiSlug)}" class="btn btn-primary btn-sm">Biyografiyi Oku</a>
          <a href="#/test/sahabi/${escapeHtml(dailySahabi.sahabiSlug)}" class="btn btn-secondary btn-sm">20 Soruluk Testi Çöz</a>
        </div>
      </section>
    ` : ""}

    <section class="home-section-block" aria-labelledby="home-continue-heading">
      <h2 id="home-continue-heading" class="section-heading">Kaldığın Yerden Devam Et</h2>
      ${continueCardHtml}
    </section>

    <section class="home-section-block" aria-labelledby="home-summary-heading">
      <h2 id="home-summary-heading" class="section-heading">Kısa İlerleme Özeti</h2>
      <div class="summary-stats-grid">
        <div class="stat-mini-card">
          <div class="stat-mini-val">${formatNumber(state.totalScore)}</div>
          <div class="stat-mini-label">Toplam Puan</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${formatNumber(totalStars)}</div>
          <div class="stat-mini-label">Toplam Yıldız</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${completedCount} / ${SAHABIS.length}</div>
          <div class="stat-mini-label">Testi Tamamlanan</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${readCount} / ${SAHABIS.length}</div>
          <div class="stat-mini-label">Okunan Biyografi</div>
        </div>
      </div>
    </section>

    ${renderContactCardHtml(APP_CONTENT.contact)}
    ${renderDuaBannerHtml(APP_CONTENT.dua)}
  `;

  document.getElementById("home-view-grid-btn")?.addEventListener("click", () => {
    updateState(s => ({ ...s, homeView: "grid2x2" }));
    renderHomePage(container);
  });
  document.getElementById("home-view-list-btn")?.addEventListener("click", () => {
    updateState(s => ({ ...s, homeView: "list" }));
    renderHomePage(container);
  });
}
