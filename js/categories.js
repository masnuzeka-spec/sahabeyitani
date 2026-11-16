// Kategoriler ve Kategori Detay modülü (Bölüm 8, 9)
import CATEGORIES from "../data/categories.js";
import SAHABIS from "../data/sahabis-index.js";
import APP_SETTINGS from "../data/app-settings.js";
import { getIconSvg, escapeHtml, formatNumber } from "./utils.js";
import { loadState, updateState } from "./storage.js";
import { renderStarsHtml } from "./stars.js";

export function getCategoryMetrics(categoryId, state) {
  const sahabisInCat = SAHABIS.filter(s => s.active && s.categories.includes(categoryId));
  let questionCount = 0;
  let completedCount = 0;
  for (const s of sahabisInCat) {
    if (s.contentStatus === "ready") {
      questionCount += s.questions.length;
    }
    if (state.completedSahabis.includes(s.id)) {
      completedCount += 1;
    }
  }
  const completionRate = sahabisInCat.length > 0
    ? Math.round((completedCount / sahabisInCat.length) * 100)
    : 0;
  return {
    sahabis: sahabisInCat,
    sahabiCount: sahabisInCat.length,
    questionCount,
    completedCount,
    completionRate
  };
}

export function renderCategoriesPage(container) {
  const state = loadState();
  const viewMode = state.categoryView || "card";

  const itemsData = CATEGORIES.map(cat => ({
    ...cat,
    metrics: getCategoryMetrics(cat.id, state)
  }));

  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:var(--space-md);">
      <section class="page-header" style="margin-bottom:0;">
        <h1 class="page-title">Kategoriler</h1>
        <p class="page-subtitle">Sahabîleri ortak özelliklerine ve fazilet halkalarına göre keşfet.</p>
      </section>
      <div class="view-toggle" role="group" aria-label="Kategori Görünüm Seçimi">
        <button type="button" id="cat-view-card" class="view-toggle-btn ${viewMode === "card" ? "active" : ""}" aria-pressed="${viewMode === "card"}">
          ${getIconSvg("grid", 16)}
          <span>Kart</span>
        </button>
        <button type="button" id="cat-view-list" class="view-toggle-btn ${viewMode === "list" ? "active" : ""}" aria-pressed="${viewMode === "list"}">
          ${getIconSvg("list", 16)}
          <span>Liste</span>
        </button>
      </div>
    </div>

    ${viewMode === "card" ? `
      <div class="cards-grid">
        ${itemsData.map(cat => `
          <article class="card card-interactive category-card">
            <div>
              <div class="card-top-row" style="margin-bottom:10px;">
                <span class="symbol-badge">${getIconSvg(cat.icon, 22)}</span>
                <span class="badge badge-gold">%${cat.metrics.completionRate} Tamamlandı</span>
              </div>
              <h2 class="card-title">${escapeHtml(cat.name)}</h2>
              <p class="card-desc" style="margin-top:6px;">${escapeHtml(cat.shortDescription)}</p>
            </div>
            <div>
              <div class="card-meta-row" style="margin-bottom:6px;">
                <span>${cat.metrics.sahabiCount} Sahabî</span>
                <span>${formatNumber(cat.metrics.questionCount)} Hazır Soru</span>
              </div>
              <div class="progress-track" style="margin-bottom:12px;" aria-label="${escapeHtml(cat.name)} tamamlanma oranı %${cat.metrics.completionRate}">
                <div class="progress-fill" style="width:${cat.metrics.completionRate}%;"></div>
              </div>
              <a href="#/category/${escapeHtml(cat.slug)}" class="btn btn-primary btn-block">
                <span>Kategoriyi Aç</span>
              </a>
            </div>
          </article>
        `).join("")}
      </div>
    ` : `
      <div class="list-stack">
        ${itemsData.map(cat => `
          <a href="#/category/${escapeHtml(cat.slug)}" class="list-row card-interactive">
            <div class="list-row-main">
              <span class="symbol-badge">${getIconSvg(cat.icon, 20)}</span>
              <div class="list-row-text">
                <div class="list-row-title">${escapeHtml(cat.name)}</div>
                <div class="list-row-sub">${escapeHtml(cat.shortDescription)}</div>
                <div style="font-size:0.76rem;color:var(--color-dark-gold);font-weight:700;margin-top:3px;">
                  ${cat.metrics.sahabiCount} Sahabî • ${formatNumber(cat.metrics.questionCount)} Soru
                </div>
              </div>
            </div>
            <div class="list-row-right">
              <div style="text-align:right;min-width:54px;">
                <div style="font-size:0.8rem;font-weight:800;color:var(--color-deep-emerald);">%${cat.metrics.completionRate}</div>
                <div class="progress-track" style="width:54px;height:6px;margin-top:3px;">
                  <div class="progress-fill" style="width:${cat.metrics.completionRate}%;"></div>
                </div>
              </div>
              <span style="color:var(--color-dark-gold);">${getIconSvg("chevron-right", 20)}</span>
            </div>
          </a>
        `).join("")}
      </div>
    `}
  `;

  const cardBtn = document.getElementById("cat-view-card");
  const listBtn = document.getElementById("cat-view-list");
  if (cardBtn) {
    cardBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, categoryView: "card" }));
      renderCategoriesPage(container);
    });
  }
  if (listBtn) {
    listBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, categoryView: "list" }));
      renderCategoriesPage(container);
    });
  }
}

export function renderCategoryDetailPage(container, slug) {
  const cat = CATEGORIES.find(c => c.slug === slug || c.id === slug);
  if (!cat) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h1 class="card-title">Kategori Bulunamadı</h1>
        <p class="card-desc" style="margin:8px 0 16px;">Aradığınız kategori mevcut değil.</p>
        <a href="#/categories" class="btn btn-primary">Kategorilere Dön</a>
      </div>
    `;
    return;
  }

  const state = loadState();
  const metrics = getCategoryMetrics(cat.id, state);
  const catStars = Number(state.categoryStars[cat.id]) || 0;
  const catRecord = Number(state.categoryRecords[cat.id]) || 0;

  container.innerHTML = `
    <div class="bio-hero-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <span class="bio-ep-badge">${metrics.sahabiCount} Sahabî • ${formatNumber(metrics.questionCount)} Soru</span>
        ${renderStarsHtml(catStars, 5)}
      </div>
      <h1 class="bio-name">${escapeHtml(cat.name)}</h1>
      <p class="bio-summary-text">${escapeHtml(cat.description)}</p>
      <div style="margin-top:12px;font-size:0.84rem;color:var(--color-gold);font-weight:700;">
        Kategori Rekoru: ${formatNumber(catRecord)} Puan • Tamamlanma: %${metrics.completionRate}
      </div>
    </div>

    <section class="home-section-block" aria-labelledby="cat-test-options-title">
      <h2 id="cat-test-options-title" class="section-heading">Kategori Testi Seçenekleri</h2>
      <div class="card">
        <p class="card-desc" style="margin-bottom:12px;">
          Bu kategorideki farklı sahabîlerden dengeli biçimde seçilen sorularla bilgini ölç.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;">
          ${APP_SETTINGS.quiz.categoryModes.map(m => `
            <a href="#/test/category/${escapeHtml(cat.slug)}?mode=${escapeHtml(m.id)}" class="btn ${m.isOfficial ? "btn-primary" : "btn-secondary"}">
              ${escapeHtml(m.label)}
            </a>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="home-section-block" aria-labelledby="cat-sahabis-title">
      <h2 id="cat-sahabis-title" class="section-heading">Kategoriye Ait Sahabîler (${metrics.sahabiCount})</h2>
      <div class="list-stack">
        ${metrics.sahabis.map(s => {
          const stars = Number(state.testStars[s.id]) || 0;
          return `
            <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="list-row card-interactive">
              <div class="list-row-main">
                <span class="symbol-badge" style="font-weight:800;font-size:0.85rem;">${s.episodeNumber}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(s.sahabiName)}</div>
                  <div class="list-row-sub">${escapeHtml(s.title)} • ${escapeHtml(s.city)}</div>
                </div>
              </div>
              <div class="list-row-right">
                ${renderStarsHtml(stars, 5)}
                <span style="color:var(--color-dark-gold);">${getIconSvg("chevron-right", 20)}</span>
              </div>
            </a>
          `;
        }).join("")}
      </div>
    </section>
  `;
}
