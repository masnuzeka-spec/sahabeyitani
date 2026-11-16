// SAHABÎLERİ TANI liste ve kapsamlı biyografi detay modülü
// - Kadın sesli tarayıcı TTS kaldırıldı, yalnızca Muhammed Emin Yıldırım'ın kendi sesinden Bölüm Kaydı Dinleyici bırakıldı
// - Biyografiyi Okudum işaretleme ve takip özelliği eklendi
// - Kişisel Tefekkür Notu kaydetme alanı eklendi
// - Önceki / Sonraki Sahabî hızlı geçiş barı eklendi
import APP_CONTENT from "../data/app-content.js";
import CATEGORIES from "../data/categories.js";
import SAHABIS from "../data/sahabis-index.js";
import { getIconSvg, escapeHtml, normalizeTr, showToast } from "./utils.js";
import { loadState, updateState } from "./storage.js";
import { isSahabiFavorite, toggleSahabiFavorite } from "./favorites.js";
import { shareTextContent, downloadVisualCardPng } from "./sharing.js";

const CAT_MAP = new Map(CATEGORIES.map(c => [c.id, c.name]));

let bioFilterState = {
  search: "",
  category: "all",
  gender: "all",
  quickFilter: "all" // "all" | "favorites" | "read" | "completed" | "fiveStars"
};

export function stopBiographySpeech() {
  // Geriye dönük uyumluluk için boş durdurucu
}

export function renderBiographiesPage(container) {
  const state = loadState();
  const viewMode = state.biographyView || "card";
  const favCount = Array.isArray(state.favoriteSahabis) ? state.favoriteSahabis.length : 0;
  const readCount = Array.isArray(state.readSahabis) ? state.readSahabis.length : 0;

  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:var(--space-md);">
      <section class="page-header" style="margin-bottom:0;">
        <h1 class="page-title">${escapeHtml(APP_CONTENT.biographies.title)}</h1>
        <p class="page-subtitle">${escapeHtml(APP_CONTENT.biographies.subtitle)}</p>
      </section>
      <div class="view-toggle" role="group" aria-label="Biyografi Görünüm Seçimi">
        <button type="button" id="bio-view-card" class="view-toggle-btn ${viewMode === "card" ? "active" : ""}" aria-pressed="${viewMode === "card"}">
          ${getIconSvg("grid", 15)}
          <span>Kart</span>
        </button>
        <button type="button" id="bio-view-list" class="view-toggle-btn ${viewMode === "list" ? "active" : ""}" aria-pressed="${viewMode === "list"}">
          ${getIconSvg("list", 15)}
          <span>Liste</span>
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-input-wrap">
        ${getIconSvg("search", 17)}
        <input
          type="search"
          id="bio-search-input"
          class="search-input"
          placeholder="Sahabî adı, bölüm başlığı veya şehir ara..."
          value="${escapeHtml(bioFilterState.search)}"
          aria-label="Sahabî, başlık veya şehir ara"
        >
        ${bioFilterState.search ? `
          <button type="button" id="bio-search-clear" class="search-clear-btn" aria-label="Aramayı Temizle">
            ${getIconSvg("close", 15)}
          </button>
        ` : ""}
      </div>

      <div class="filter-controls-row">
        <select id="bio-cat-select" class="select-control" aria-label="Kategori Filtresi">
          <option value="all">Tüm Kategoriler</option>
          ${CATEGORIES.map(c => `
            <option value="${escapeHtml(c.id)}" ${bioFilterState.category === c.id ? "selected" : ""}>
              ${escapeHtml(c.name)}
            </option>
          `).join("")}
        </select>

        <select id="bio-gender-select" class="select-control" aria-label="Cinsiyet Filtresi">
          <option value="all" ${bioFilterState.gender === "all" ? "selected" : ""}>Kadın ve Erkek</option>
          <option value="Erkek" ${bioFilterState.gender === "Erkek" ? "selected" : ""}>Erkek Sahabîler</option>
          <option value="Kadın" ${bioFilterState.gender === "Kadın" ? "selected" : ""}>Hanım Sahabîler</option>
        </select>
      </div>

      <div class="filter-controls-row" role="group" aria-label="Hızlı Filtreler">
        <button type="button" data-qfilter="all" class="chip-btn ${bioFilterState.quickFilter === "all" ? "active" : ""}">Tümü (${SAHABIS.length})</button>
        <button type="button" data-qfilter="favorites" class="chip-btn ${bioFilterState.quickFilter === "favorites" ? "active" : ""}">
          ${getIconSvg("heart-filled", 13)}
          <span>Favoriler (${favCount})</span>
        </button>
        <button type="button" data-qfilter="read" class="chip-btn ${bioFilterState.quickFilter === "read" ? "active" : ""}">
          ${getIconSvg("check", 13)}
          <span>Okunanlar (${readCount})</span>
        </button>
        <button type="button" data-qfilter="completed" class="chip-btn ${bioFilterState.quickFilter === "completed" ? "active" : ""}">Testi Bitenler</button>
        <button type="button" data-qfilter="fiveStars" class="chip-btn ${bioFilterState.quickFilter === "fiveStars" ? "active" : ""}">5 Yıldız</button>
      </div>
    </div>

    <div id="bio-results-container"></div>
  `;

  bindBiographyFilterEvents(container);
  renderBiographyResultsList();
}

function getFilteredSahabis(state) {
  const qNorm = normalizeTr(bioFilterState.search);
  const readList = Array.isArray(state.readSahabis) ? state.readSahabis : [];
  return SAHABIS.filter(s => {
    if (!s.active) return false;
    if (bioFilterState.category !== "all" && !s.categories.includes(bioFilterState.category)) return false;
    if (bioFilterState.gender !== "all" && s.gender !== bioFilterState.gender) return false;
    if (bioFilterState.quickFilter === "favorites" && !state.favoriteSahabis.includes(s.id)) return false;
    if (bioFilterState.quickFilter === "read" && !readList.includes(s.id)) return false;
    if (bioFilterState.quickFilter === "completed" && !state.completedSahabis.includes(s.id)) return false;
    if (bioFilterState.quickFilter === "fiveStars" && Number(state.testStars[s.id]) !== 5) return false;

    if (qNorm) {
      const hay = normalizeTr(`${s.sahabiName} ${s.title} ${s.city} ${s.episodeNumber}`);
      if (!hay.includes(qNorm)) return false;
    }
    return true;
  });
}

function renderBiographyResultsList() {
  const listEl = document.getElementById("bio-results-container");
  if (!listEl) return;

  const state = loadState();
  const viewMode = state.biographyView || "card";
  const readList = Array.isArray(state.readSahabis) ? state.readSahabis : [];
  const filtered = getFilteredSahabis(state);

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <p class="card-title">Sonuç Bulunamadı</p>
        <p class="card-desc" style="text-align:center;margin:6px 0 14px;">Seçtiğiniz arama veya filtre ölçütlerine uygun sahabî kaydı bulunamadı.</p>
        <button type="button" id="bio-reset-filters-btn" class="btn btn-secondary">Filtreleri Temizle</button>
      </div>
    `;
    document.getElementById("bio-reset-filters-btn")?.addEventListener("click", () => {
      bioFilterState = { search: "", category: "all", gender: "all", quickFilter: "all" };
      const main = document.getElementById("app-main");
      if (main) renderBiographiesPage(main);
    });
    return;
  }

  if (viewMode === "card") {
    listEl.innerHTML = `
      <div class="cards-grid">
        ${filtered.map(s => {
          const isFav = state.favoriteSahabis.includes(s.id);
          const isRead = readList.includes(s.id);
          const top3Cats = s.categories.slice(0, 3).map(cid => CAT_MAP.get(cid) || cid);
          return `
            <article class="card card-interactive sahabi-card">
              <div>
                <div class="card-top-row">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:5px;">
                      <span class="badge badge-city">${s.episodeNumber}. Bölüm • ${escapeHtml(s.city)}</span>
                      ${isRead ? `<span class="badge badge-gold">✓ Okundu</span>` : ""}
                    </div>
                    <h2 class="card-title">${escapeHtml(s.sahabiName)}</h2>
                    <p class="card-subtitle">${escapeHtml(s.title)}</p>
                  </div>
                  <button
                    type="button"
                    class="fav-btn ${isFav ? "active" : ""}"
                    data-fav-sahabi="${escapeHtml(s.id)}"
                    aria-label="${escapeHtml(s.sahabiName)} favorilere ${isFav ? "eklendi" : "ekle"}"
                    aria-pressed="${isFav}"
                  >
                    ${isFav ? getIconSvg("heart-filled", 17) : getIconSvg("heart", 17)}
                  </button>
                </div>
                <div class="tag-row" style="margin-top:8px;">
                  ${top3Cats.map(cname => `<span class="badge">${escapeHtml(cname)}</span>`).join("")}
                </div>
              </div>
              <div style="margin-top:10px;">
                <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="btn btn-primary btn-block">
                  <span>Biyografiyi Aç</span>
                </a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  } else {
    listEl.innerHTML = `
      <div class="list-stack">
        ${filtered.map(s => {
          const isFav = state.favoriteSahabis.includes(s.id);
          const isRead = readList.includes(s.id);
          const top3Cats = s.categories.slice(0, 3).map(cid => CAT_MAP.get(cid) || cid);
          return `
            <div class="list-row card-interactive">
              <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="list-row-main">
                <span class="symbol-badge" style="font-weight:800;font-size:0.84rem;">${s.episodeNumber}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(s.sahabiName)} ${isRead ? `<span class="badge badge-gold" style="font-size:0.66rem;padding:1px 6px;">✓ Okundu</span>` : ""}</div>
                  <div class="list-row-sub">${escapeHtml(s.title)} • <span class="badge badge-city" style="padding:1px 6px;font-size:0.7rem;">${escapeHtml(s.city)}</span></div>
                  <div class="tag-row" style="margin-top:4px;">
                    ${top3Cats.map(cname => `<span class="badge" style="font-size:0.68rem;padding:2px 6px;">${escapeHtml(cname)}</span>`).join("")}
                  </div>
                </div>
              </a>
              <div class="list-row-right">
                <button
                  type="button"
                  class="fav-btn ${isFav ? "active" : ""}"
                  data-fav-sahabi="${escapeHtml(s.id)}"
                  aria-label="${escapeHtml(s.sahabiName)} favorilere ${isFav ? "eklendi" : "ekle"}"
                  aria-pressed="${isFav}"
                >
                  ${isFav ? getIconSvg("heart-filled", 17) : getIconSvg("heart", 17)}
                </button>
                <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="btn btn-primary btn-sm">Aç</a>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  listEl.querySelectorAll("[data-fav-sahabi]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const sid = btn.getAttribute("data-fav-sahabi");
      const added = toggleSahabiFavorite(sid);
      showToast(added ? "Sahabî favorilere eklendi." : "Sahabî favorilerden çıkarıldı.");
      renderBiographyResultsList();
    });
  });
}

function bindBiographyFilterEvents(container) {
  document.getElementById("bio-view-card")?.addEventListener("click", () => {
    updateState(s => ({ ...s, biographyView: "card" }));
    renderBiographiesPage(container);
  });
  document.getElementById("bio-view-list")?.addEventListener("click", () => {
    updateState(s => ({ ...s, biographyView: "list" }));
    renderBiographiesPage(container);
  });

  document.getElementById("bio-search-input")?.addEventListener("input", e => {
    bioFilterState.search = e.target.value;
    renderBiographyResultsList();
  });

  document.getElementById("bio-search-clear")?.addEventListener("click", () => {
    bioFilterState.search = "";
    renderBiographiesPage(container);
  });

  document.getElementById("bio-cat-select")?.addEventListener("change", e => {
    bioFilterState.category = e.target.value;
    renderBiographyResultsList();
  });

  document.getElementById("bio-gender-select")?.addEventListener("change", e => {
    bioFilterState.gender = e.target.value;
    renderBiographyResultsList();
  });

  container.querySelectorAll("[data-qfilter]").forEach(chip => {
    chip.addEventListener("click", () => {
      bioFilterState.quickFilter = chip.getAttribute("data-qfilter");
      renderBiographiesPage(container);
    });
  });
}

export function renderBiographyDetailPage(container, slug) {
  const currentIdx = SAHABIS.findIndex(s => s.sahabiSlug === slug || s.id === slug);
  const sahabi = currentIdx !== -1 ? SAHABIS[currentIdx] : null;
  if (!sahabi) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2rem;">
        <h1 class="card-title">Sahabî Bulunamadı</h1>
        <p class="card-desc" style="text-align:center;margin:8px 0 16px;">Aradığınız sahabî biyografisi bulunamadı.</p>
        <a href="#/biographies" class="btn btn-primary">Sahabîleri Tanı Listesine Dön</a>
      </div>
    `;
    return;
  }

  const state = loadState();
  const isFav = isSahabiFavorite(sahabi.id);
  const isRead = Array.isArray(state.readSahabis) && state.readSahabis.includes(sahabi.id);
  const savedNote = (state.sahabiNotes && state.sahabiNotes[sahabi.id]) || "";
  const validLifeSections = (sahabi.lifeSections || []).filter(sec => sec && Array.isArray(sec.items) && sec.items.length > 0);
  const catBadges = (sahabi.categories || []).map(cid => ({
    id: cid,
    name: CAT_MAP.get(cid) || cid
  }));

  const videoId = sahabi.video?.videoId || "";
  const prevSahabi = currentIdx > 0 ? SAHABIS[currentIdx - 1] : null;
  const nextSahabi = currentIdx < SAHABIS.length - 1 ? SAHABIS[currentIdx + 1] : null;

  container.innerHTML = `
    <article>
      <div class="bio-hero-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <span class="bio-ep-badge">${sahabi.episodeNumber}. Bölüm • ${escapeHtml(sahabi.city)}</span>
          <div style="display:flex;gap:6px;">
            <button
              type="button"
              id="bio-detail-fav-btn"
              class="fav-btn ${isFav ? "active" : ""}"
              aria-label="${escapeHtml(sahabi.sahabiName)} favorilere ${isFav ? "eklendi" : "ekle"}"
              aria-pressed="${isFav}"
            >
              ${isFav ? getIconSvg("heart-filled", 17) : getIconSvg("heart", 17)}
            </button>
            <button type="button" id="bio-detail-share-btn" class="fav-btn" aria-label="Biyografiyi Paylaş">
              ${getIconSvg("share", 17)}
            </button>
          </div>
        </div>
        <h1 class="bio-name">${escapeHtml(sahabi.sahabiName)}</h1>
        <p class="bio-ep-title">${escapeHtml(sahabi.title)}</p>
        <p class="bio-summary-text">${escapeHtml(sahabi.summary)}</p>

        <div class="tag-row" style="margin-top:12px;">
          ${catBadges.map(c => `
            <a href="#/category/${escapeHtml(c.id)}" class="badge badge-gold">${escapeHtml(c.name)}</a>
          `).join("")}
        </div>
      </div>

      <!-- Bölüm Ses Kaydı Dinleyici ve Okuma / İndirme Araçları -->
      <section class="bio-audio-card" aria-label="Bölüm Kaydı ve Araçlar">
        <div class="bio-audio-actions" style="margin-top:0;">
          ${videoId ? `
            <button type="button" id="bio-toggle-recording-btn" class="btn btn-primary btn-sm" style="flex:1 1 160px;">
              ${getIconSvg("headphones", 15)}
              <span id="bio-recording-btn-label">Bölüm Ses Kaydını Dinle</span>
            </button>
          ` : ""}

          <button type="button" id="bio-mark-read-btn" class="btn ${isRead ? "btn-gold" : "btn-secondary"} btn-sm" style="flex:1 1 150px;">
            ${getIconSvg("check", 15)}
            <span>${isRead ? "Okundu Olarak İşaretli" : "Biyografiyi Okudum İşaretle"}</span>
          </button>

          <button type="button" id="bio-download-card-top-btn" class="btn btn-secondary btn-sm">
            ${getIconSvg("download", 15)}
            <span>Ders Kartı (PNG)</span>
          </button>
        </div>

        <div id="bio-recording-player-wrap" style="display:none;"></div>
      </section>

      ${Array.isArray(sahabi.highlights) && sahabi.highlights.length > 0 ? `
        <section class="card" style="margin-bottom:var(--space-md);" aria-labelledby="bio-highlights-heading">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span class="symbol-badge" style="width:34px;height:34px;">${getIconSvg("star", 17)}</span>
            <h2 id="bio-highlights-heading" class="card-title">Öne Çıkan Özellikleri</h2>
          </div>
          <ul class="bullet-list">
            ${sahabi.highlights.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      ` : ""}

      <section class="home-section-block" aria-labelledby="bio-sections-heading">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
          <h2 id="bio-sections-heading" class="section-heading" style="margin-bottom:0;">Hayatının Dönemleri ve Önemli Hadiseler</h2>
          <button type="button" id="bio-toggle-all-btn" class="btn btn-secondary btn-sm">Tümünü Aç</button>
        </div>

        <div id="bio-accordions-wrap">
          ${validLifeSections.map((sec, idx) => `
            <div class="accordion-item ${idx === 0 ? "open" : ""}" data-acc-index="${idx}">
              <button
                type="button"
                class="accordion-header"
                aria-expanded="${idx === 0 ? "true" : "false"}"
              >
                <span>${escapeHtml(sec.title)}</span>
                ${getIconSvg("chevron-down", 18)}
              </button>
              <div class="accordion-body">
                <ul class="bullet-list">
                  ${sec.items.map(point => `<li>${escapeHtml(point)}</li>`).join("")}
                </ul>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      ${Array.isArray(sahabi.lessons) && sahabi.lessons.length > 0 ? `
        <section class="lessons-special-card" aria-labelledby="bio-lessons-heading">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="symbol-badge" style="width:34px;height:34px;">${getIconSvg("lamp", 18)}</span>
              <h2 id="bio-lessons-heading" class="card-title" style="font-size:1.18rem;">Hayatından Alınacak Dersler</h2>
            </div>
            <button type="button" id="bio-download-card-btn" class="btn btn-primary btn-sm">
              ${getIconSvg("download", 14)}
              <span>Ders Kartını İndir (PNG)</span>
            </button>
          </div>
          <ul class="bullet-list">
            ${sahabi.lessons.map(lesson => `<li>${escapeHtml(lesson)}</li>`).join("")}
          </ul>
        </section>
      ` : ""}

      ${sahabi.cityConnection && Array.isArray(sahabi.cityConnection.items) ? `
        <section class="card city-connection-card" aria-labelledby="bio-city-heading">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="symbol-badge" style="width:34px;height:34px;">${getIconSvg("compass", 18)}</span>
              <div>
                <span style="font-size:0.72rem;font-weight:800;color:var(--accent-gold);text-transform:uppercase;">ŞEHİRLE BAĞLANTISI</span>
                <h2 id="bio-city-heading" class="card-title">${escapeHtml(sahabi.cityConnection.title || `Neden ${sahabi.city}?`)}</h2>
              </div>
            </div>
            <span class="badge badge-city">${escapeHtml(sahabi.city)}</span>
          </div>
          <ul class="bullet-list">
            ${sahabi.cityConnection.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      ` : ""}

      <!-- Kişisel Tefekkür ve Ders Notum Alanı -->
      <section class="card" style="margin:var(--space-md) 0;" aria-labelledby="bio-note-heading">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <h2 id="bio-note-heading" class="card-title" style="font-size:1.12rem;">Kişisel Tefekkür ve Ders Notum</h2>
          ${savedNote ? `<span class="badge badge-gold">Not Kayıtlı</span>` : ""}
        </div>
        <textarea
          id="bio-personal-note-input"
          class="note-textarea"
          placeholder="${escapeHtml(sahabi.sahabiName)} hayatından kendime çıkardığım ders veya not..."
          aria-label="Kişisel Tefekkür Notu"
        >${escapeHtml(savedNote)}</textarea>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          ${savedNote ? `<button type="button" id="bio-delete-note-btn" class="btn btn-secondary btn-sm">Notu Sil</button>` : ""}
          <button type="button" id="bio-save-note-btn" class="btn btn-primary btn-sm">Notu Kaydet</button>
        </div>
      </section>

      <div class="card" style="margin-top:var(--space-md);display:flex;flex-direction:column;gap:8px;">
        ${sahabi.contentStatus === "ready" && sahabi.questions.length >= 20 ? `
          <a href="#/test/sahabi/${escapeHtml(sahabi.sahabiSlug)}" class="btn btn-primary btn-block">
            ${getIconSvg("star", 17)}
            <span>${escapeHtml(sahabi.sahabiName)} Testini Çöz (${sahabi.questions.length} Soru)</span>
          </a>
        ` : `
          <button type="button" class="btn btn-secondary btn-block" disabled>Test Hazırlanıyor</button>
        `}
        ${sahabi.video && sahabi.video.url ? `
          <a href="${escapeHtml(sahabi.video.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-block">
            ${getIconSvg("play", 17)}
            <span>İlgili Bölümü İzle</span>
          </a>
        ` : ""}
      </div>

      <!-- Önceki / Sonraki Sahabî Hızlı Geçiş Barı -->
      <nav class="bio-prev-next-grid" aria-label="Önceki ve Sonraki Sahabî Geçişi">
        ${prevSahabi ? `
          <a href="#/biography/${escapeHtml(prevSahabi.sahabiSlug)}" class="bio-nav-link">
            <span class="bio-nav-dir">← Önceki (${prevSahabi.episodeNumber}. Bölüm)</span>
            <span class="bio-nav-name">${escapeHtml(prevSahabi.sahabiName)}</span>
          </a>
        ` : `<div></div>`}
        ${nextSahabi ? `
          <a href="#/biography/${escapeHtml(nextSahabi.sahabiSlug)}" class="bio-nav-link" style="text-align:right;">
            <span class="bio-nav-dir">Sonraki (${nextSahabi.episodeNumber}. Bölüm) →</span>
            <span class="bio-nav-name">${escapeHtml(nextSahabi.sahabiName)}</span>
          </a>
        ` : `<div></div>`}
      </nav>
    </article>
  `;

  // Akordiyon tıklama olayları
  const accItems = container.querySelectorAll(".accordion-item");
  accItems.forEach(item => {
    const header = item.querySelector(".accordion-header");
    if (header) {
      header.addEventListener("click", () => {
        const isOpen = item.classList.toggle("open");
        header.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
  });

  const toggleAllBtn = document.getElementById("bio-toggle-all-btn");
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener("click", () => {
      const allOpen = Array.from(accItems).every(el => el.classList.contains("open"));
      accItems.forEach(el => {
        const hdr = el.querySelector(".accordion-header");
        if (allOpen) {
          el.classList.remove("open");
          if (hdr) hdr.setAttribute("aria-expanded", "false");
        } else {
          el.classList.add("open");
          if (hdr) hdr.setAttribute("aria-expanded", "true");
        }
      });
      toggleAllBtn.textContent = allOpen ? "Tümünü Aç" : "Tümünü Kapat";
    });
  }

  // Biyografiyi Okudum İşaretle
  document.getElementById("bio-mark-read-btn")?.addEventListener("click", () => {
    updateState(s => {
      const list = Array.isArray(s.readSahabis) ? [...s.readSahabis] : [];
      const exists = list.includes(sahabi.id);
      const next = exists ? list.filter(id => id !== sahabi.id) : [...list, sahabi.id];
      showToast(exists ? "Okundu işareti kaldırıldı." : "Biyografi okundu olarak işaretlendi.");
      return { ...s, readSahabis: next };
    });
    renderBiographyDetailPage(container, slug);
  });

  // Kişisel Tefekkür Notu Kaydet / Sil
  document.getElementById("bio-save-note-btn")?.addEventListener("click", () => {
    const val = (document.getElementById("bio-personal-note-input")?.value || "").trim();
    updateState(s => {
      const nextNotes = { ...(s.sahabiNotes || {}) };
      if (val) nextNotes[sahabi.id] = val;
      else delete nextNotes[sahabi.id];
      return { ...s, sahabiNotes: nextNotes };
    });
    showToast("Tefekkür notunuz kaydedildi.");
    renderBiographyDetailPage(container, slug);
  });

  document.getElementById("bio-delete-note-btn")?.addEventListener("click", () => {
    updateState(s => {
      const nextNotes = { ...(s.sahabiNotes || {}) };
      delete nextNotes[sahabi.id];
      return { ...s, sahabiNotes: nextNotes };
    });
    showToast("Tefekkür notunuz silindi.");
    renderBiographyDetailPage(container, slug);
  });

  // Bölüm Ses/Video Kaydını Biyografi Altında Dinleme Oynatıcısı
  const recBtn = document.getElementById("bio-toggle-recording-btn");
  const recLabel = document.getElementById("bio-recording-btn-label");
  const recWrap = document.getElementById("bio-recording-player-wrap");
  if (recBtn && recWrap && videoId) {
    recBtn.addEventListener("click", () => {
      const isOpen = recWrap.style.display !== "none";
      if (isOpen) {
        recWrap.style.display = "none";
        recWrap.innerHTML = "";
        if (recLabel) recLabel.textContent = "Bölüm Ses Kaydını Dinle";
      } else {
        recWrap.style.display = "block";
        recWrap.innerHTML = `
          <div class="bio-recording-embed">
            <iframe
              width="100%"
              height="200"
              src="https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}?playsinline=1&rel=0&autoplay=1"
              title="${escapeHtml(sahabi.sahabiName)} Bölüm Kaydı"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              style="display:block;"
            ></iframe>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:0.75rem;color:var(--text-muted);">
            <span>Muhammed Emin Yıldırım anlatımıyla bölüm kaydı</span>
            <a href="${escapeHtml(sahabi.video.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--heading-color);font-weight:700;">Uygulama Dışında Aç ↗</a>
          </div>
        `;
        if (recLabel) recLabel.textContent = "Bölüm Oynatıcısını Kapat";
      }
    });
  }

  // PNG Ders Kartı İndirme (Duasız)
  function handleDownloadLessonCard() {
    downloadVisualCardPng({
      badgeText: `${sahabi.episodeNumber}. BÖLÜM • ${sahabi.city}`,
      title: sahabi.sahabiName,
      subtitle: sahabi.title,
      sectionHeading: "Hayatından Alınacak Dersler",
      lines: sahabi.lessons || [],
      filename: `${sahabi.sahabiSlug}-ders-karti.png`
    });
  }

  document.getElementById("bio-download-card-top-btn")?.addEventListener("click", handleDownloadLessonCard);
  document.getElementById("bio-download-card-btn")?.addEventListener("click", handleDownloadLessonCard);

  document.getElementById("bio-detail-fav-btn")?.addEventListener("click", () => {
    const added = toggleSahabiFavorite(sahabi.id);
    showToast(added ? "Sahabî favorilere eklendi." : "Sahabî favorilerden çıkarıldı.");
    renderBiographyDetailPage(container, slug);
  });

  document.getElementById("bio-detail-share-btn")?.addEventListener("click", () => {
    shareTextContent({
      title: `${sahabi.sahabiName} — ${sahabi.title} (SAHABEYİ TANI)`,
      text: `${sahabi.sahabiName} (${sahabi.title}): ${sahabi.summary}\n\nHayatından Alınacak Ders: ${sahabi.lessons?.[0] || ""}`
    });
  });
}
