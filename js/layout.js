// Üst bar (Tüm sayfayı büyütüp küçültme A-/A+, Tema Seçici, Profil, Hakkında), 5 sekmeli alt menü (Favoriler dahil) ve Açılış ekranı
import APP_CONTENT from "../data/app-content.js";
import APP_SETTINGS from "../data/app-settings.js";
import { getIconSvg, escapeHtml, renderDuaBannerHtml, renderContactCardHtml, showToast } from "./utils.js";
import { loadState, updateState, applyTheme, resolveEffectiveTheme, applyFontScale } from "./storage.js";
import { navigateTo } from "./router.js";
import { syncTelegramBackButton } from "./telegram.js";

const NAV_ITEMS = [
  { id: "home", label: "Ana Sayfa", route: "#/home", icon: "home" },
  { id: "categories", label: "Kategoriler", route: "#/categories", icon: "compass" },
  { id: "biographies", label: "Sahabîleri Tanı", route: "#/biographies", icon: "book" },
  { id: "tests", label: "Testler", route: "#/tests", icon: "star" },
  { id: "favorites", label: "Favoriler", route: "#/favorites", icon: "heart" }
];

const FONT_SCALES = [85, 92, 100, 108, 116, 125];

let deferredInstallPrompt = null;

export function initPwaInstallListener() {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showToast("SAHABEYİ TANI cihazınıza başarıyla yüklendi!");
  });
}

export function triggerPwaInstall() {
  showPwaInstallGuideModal();
}

export function showPwaInstallGuideModal() {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pwa-guide-title">
      <div class="modal-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <img src="${escapeHtml(APP_CONTENT.logoUrl)}" alt="Sahabeyi Tanı Logo" style="width:48px;height:48px;border-radius:11px;border:1px solid var(--border-strong);object-fit:cover;">
          <div>
            <h2 id="pwa-guide-title" class="card-title" style="font-size:1.2rem;">Telefonuna Uygulama Olarak Yükle</h2>
            <p class="card-desc" style="text-align:left;">İnternetsiz erişim ve tam ekran uygulama deneyimi</p>
          </div>
        </div>
        ${deferredInstallPrompt ? `
          <button type="button" id="pwa-native-install-btn" class="btn btn-primary btn-block" style="margin-bottom:12px;">
            ${getIconSvg("smartphone", 18)}
            <span>Şimdi Tek Tıkla Cihaza Yükle</span>
          </button>
        ` : ""}
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;font-size:0.84rem;line-height:1.5;color:var(--text-main);">
          <div style="padding:10px 12px;background:var(--bg-body);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <strong style="color:var(--heading-color);display:block;margin-bottom:2px;">Android (Chrome / Edge / Samsung Internet):</strong>
            Tarayıcının sağ üst köşesindeki <strong>⋮ (Üç Nokta)</strong> menüsüne dokunun ve <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana ekrana ekle"</strong> seçeneğini seçin.
          </div>
          <div style="padding:10px 12px;background:var(--bg-body);border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <strong style="color:var(--heading-color);display:block;margin-bottom:2px;">iPhone / iPad (Safari):</strong>
            Alt barda yer alan <strong>Paylaş</strong> simgesine dokunun, aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğine basın.
          </div>
        </div>
        <button type="button" id="pwa-guide-close-btn" class="btn btn-primary btn-block">Anladım, Kapat</button>
      </div>
    </div>
  `;

  const nativeBtn = document.getElementById("pwa-native-install-btn");
  if (nativeBtn && deferredInstallPrompt) {
    nativeBtn.addEventListener("click", async () => {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          deferredInstallPrompt = null;
          modalRoot.innerHTML = "";
        }
      } catch (e) {
        // ignore
      }
    });
  }

  const closeBtn = document.getElementById("pwa-guide-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modalRoot.innerHTML = "";
    });
  }
}

export function showThemeSelectorModal(routeInfo) {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;
  const state = loadState();
  const currentTheme = resolveEffectiveTheme(state.theme);
  const currentScale = state.fontScale || 100;
  const themes = APP_SETTINGS.themes || [
    { id: "light", name: "Fildişi & Zümrüt", desc: "Ferah klasik görünüm", preview: "#0F3D35" },
    { id: "sepia", name: "Kitap Kağıdı (Sepya)", desc: "Sıcak okuma modu", preview: "#7C4D25" },
    { id: "slate", name: "Modern Lacivert", desc: "Kurumsal arduvaz tonları", preview: "#1E3A5F" },
    { id: "dark", name: "Gece Modu", desc: "Koyu antrasit görünüm", preview: "#0D151C" }
  ];

  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
      <div class="modal-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h2 id="theme-modal-title" class="card-title" style="font-size:1.25rem;">Tema ve Görünüm Ayarları</h2>
          <button type="button" id="theme-modal-close" class="fav-btn" style="min-width:34px;min-height:34px;" aria-label="Kapat">
            ${getIconSvg("close", 16)}
          </button>
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:6px;">RENK TEMASI SEÇİMİ</div>
          <div class="theme-grid">
            ${themes.map(t => `
              <button
                type="button"
                class="theme-option-btn ${currentTheme === t.id ? "active" : ""}"
                data-pick-theme="${escapeHtml(t.id)}"
              >
                <span class="theme-swatch" style="background:${escapeHtml(t.preview)};"></span>
                <div style="min-width:0;">
                  <div style="font-weight:700;font-size:0.82rem;line-height:1.2;">${escapeHtml(t.name)}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">${escapeHtml(t.desc)}</div>
                </div>
              </button>
            `).join("")}
          </div>
        </div>

        <div style="margin-bottom:16px;padding-top:12px;border-top:1px solid var(--border-color);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:0.78rem;font-weight:700;color:var(--text-muted);">TÜM SAYFA YAZI BOYUTU</span>
            <strong id="modal-scale-label" style="font-size:0.84rem;color:var(--heading-color);">%${currentScale}</strong>
          </div>
          <div style="display:flex;gap:6px;">
            ${FONT_SCALES.map(sc => `
              <button
                type="button"
                class="btn ${currentScale === sc ? "btn-primary" : "btn-secondary"} btn-sm"
                style="flex:1;padding:6px 4px;font-size:0.76rem;"
                data-pick-scale="${sc}"
              >
                %${sc}
              </button>
            `).join("")}
          </div>
        </div>

        <button type="button" id="theme-modal-done" class="btn btn-primary btn-block">Tamam</button>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll("[data-pick-theme]").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosen = btn.getAttribute("data-pick-theme");
      updateState(s => ({ ...s, theme: chosen }));
      applyTheme(chosen);
      showThemeSelectorModal(routeInfo);
      if (routeInfo) renderHeaderAndNav(routeInfo);
    });
  });

  modalRoot.querySelectorAll("[data-pick-scale]").forEach(btn => {
    btn.addEventListener("click", () => {
      const sc = Number(btn.getAttribute("data-pick-scale")) || 100;
      updateState(s => ({ ...s, fontScale: sc }));
      applyFontScale(sc);
      showThemeSelectorModal(routeInfo);
    });
  });

  const closeFn = () => { modalRoot.innerHTML = ""; };
  document.getElementById("theme-modal-close")?.addEventListener("click", closeFn);
  document.getElementById("theme-modal-done")?.addEventListener("click", closeFn);
}

export function renderHeaderAndNav(routeInfo) {
  const headerEl = document.getElementById("app-header");
  const navEl = document.getElementById("app-bottom-nav");

  syncTelegramBackButton(!routeInfo.isRoot);

  if (headerEl) {
    const showBack = !routeInfo.isRoot;
    headerEl.innerHTML = `
      <div class="header-inner">
        <div class="header-left">
          ${showBack ? `
            <button type="button" id="header-back-btn" class="header-back-btn" aria-label="Geri Dön">
              ${getIconSvg("arrow-left", 18)}
            </button>
          ` : ""}
          <a href="#/home" class="brand-link" aria-label="SAHABEYİ TANI Ana Sayfa">
            <span class="brand-mark">
              <img src="${escapeHtml(APP_CONTENT.logoUrl)}" alt="Sahabeyi Tanı Logo" class="brand-logo-img">
            </span>
            <span>${escapeHtml(APP_CONTENT.appName)}</span>
          </a>
        </div>
        <div class="header-actions">
          <div class="header-zoom-group" role="group" aria-label="Sayfa Yazı Boyutu">
            <button type="button" id="header-font-dec" class="header-zoom-btn" aria-label="Yazıları Küçült" title="Sayfa Yazılarını Küçült">A-</button>
            <span class="header-zoom-divider"></span>
            <button type="button" id="header-font-inc" class="header-zoom-btn" aria-label="Yazıları Büyüt" title="Sayfa Yazılarını Büyüt">A+</button>
          </div>
          <button type="button" id="header-theme-btn" class="icon-btn" aria-label="Tema Seçenekleri" title="Tema Seçenekleri">
            ${getIconSvg("palette", 17)}
          </button>
          <a href="#/profile" class="icon-btn" aria-label="Profil ve İstatistikler" title="Profil ve İstatistikler">
            ${getIconSvg("user", 17)}
          </a>
          <a href="#/about" class="icon-btn" aria-label="Hakkında" title="Hakkında">
            ${getIconSvg("info", 17)}
          </a>
        </div>
      </div>
    `;

    const backBtn = document.getElementById("header-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (routeInfo.name === "category-detail") navigateTo("#/categories");
        else if (routeInfo.name === "biography-detail") navigateTo("#/biographies");
        else if (routeInfo.name.startsWith("test-")) navigateTo("#/tests");
        else if (routeInfo.name === "who-am-i") navigateTo("#/home");
        else if (routeInfo.name === "about") navigateTo("#/home");
        else navigateTo("#/home");
      });
    }

    const changeGlobalScale = (delta) => {
      const cur = loadState().fontScale || 100;
      const idx = FONT_SCALES.indexOf(cur);
      const nextIdx = Math.max(0, Math.min(FONT_SCALES.length - 1, (idx === -1 ? 2 : idx) + delta));
      const nextScale = FONT_SCALES[nextIdx];
      updateState(s => ({ ...s, fontScale: nextScale }));
      applyFontScale(nextScale);
      showToast(`Sayfa yazı boyutu: %${nextScale}`, 1600);
    };

    document.getElementById("header-font-dec")?.addEventListener("click", () => changeGlobalScale(-1));
    document.getElementById("header-font-inc")?.addEventListener("click", () => changeGlobalScale(1));

    const themeBtn = document.getElementById("header-theme-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        showThemeSelectorModal(routeInfo);
      });
    }
  }

  if (navEl) {
    navEl.innerHTML = `
      <div class="bottom-nav-inner">
        ${NAV_ITEMS.map(item => {
          const isActive = routeInfo.navTab === item.id;
          return `
            <a href="${item.route}" class="bottom-nav-item ${isActive ? "active" : ""}" aria-current="${isActive ? "page" : "false"}">
              ${getIconSvg(item.icon, 19)}
              <span class="bottom-nav-label">${escapeHtml(item.label)}</span>
            </a>
          `;
        }).join("")}
      </div>
    `;
  }
}

export function showOnboardingModal(forceShow = false) {
  const state = loadState();
  if (state.onboardingCompleted && !forceShow) return;

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  const ob = APP_CONTENT.onboarding;
  const features = Array.isArray(ob.features) ? ob.features : [];

  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div class="modal-card onboarding-card">
        <img src="${escapeHtml(APP_CONTENT.logoUrl)}" alt="SAHABEYİ TANI Logo" class="onboarding-logo-img">
        <h1 id="onboarding-title" class="onboarding-title">${escapeHtml(ob.title)}</h1>
        <p class="onboarding-subtitle">${escapeHtml(ob.subtitle)}</p>
        <p class="onboarding-purpose">${escapeHtml(ob.purposeText)}</p>

        ${features.length > 0 ? `
          <div style="text-align:left;margin-bottom:0.5rem;margin-top:0.5rem;">
            <div style="font-size:0.74rem;font-weight:800;color:#FBBF24;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;text-align:center;">
              ${escapeHtml(ob.featuresTitle || "Uygulama İçeriğinde Neler Var?")}
            </div>
            <div class="onboarding-features-grid">
              ${features.map(f => `
                <div class="onboarding-feature-item">
                  <span class="symbol-badge">${getIconSvg(f.icon || "star", 15)}</span>
                  <div class="onboarding-feature-text">
                    <strong>${escapeHtml(f.title)}</strong>
                    <span>${escapeHtml(f.text)}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <div class="onboarding-source-box">
          <p>${escapeHtml(ob.sourceCard)}</p>
        </div>



        <div class="onboarding-actions">
          <button type="button" id="onboarding-explore-btn" class="btn btn-gold btn-block">
            ${escapeHtml(ob.exploreButton)}
          </button>
          <a href="${escapeHtml(APP_CONTENT.playlistUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-block">
            ${escapeHtml(ob.sourceButton)}
          </a>
        </div>
      </div>
    </div>
  `;

  const exploreBtn = document.getElementById("onboarding-explore-btn");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, onboardingCompleted: true }));
      modalRoot.innerHTML = "";
      navigateTo("#/home");
    });
  }
}

export function showConfirmModal({ title, message, confirmLabel = "Onayla", cancelLabel = "Vazgeç", onConfirm }) {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div class="modal-card">
        <h2 id="confirm-modal-title" class="card-title" style="font-size:1.2rem;margin-bottom:0.5rem;">${escapeHtml(title)}</h2>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.1rem;">${escapeHtml(message)}</p>
        <div style="display:flex;gap:0.65rem;justify-content:flex-end;flex-wrap:wrap;">
          <button type="button" id="confirm-cancel-btn" class="btn btn-secondary">${escapeHtml(cancelLabel)}</button>
          <button type="button" id="confirm-accept-btn" class="btn btn-danger">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("confirm-cancel-btn")?.addEventListener("click", () => { modalRoot.innerHTML = ""; });
  document.getElementById("confirm-accept-btn")?.addEventListener("click", () => {
    modalRoot.innerHTML = "";
    if (typeof onConfirm === "function") onConfirm();
  });
}

export function renderAboutPage(container) {
  const ab = APP_CONTENT.about;
  container.innerHTML = `
    <section class="page-header" style="display:flex;align-items:center;gap:12px;">
      <img src="${escapeHtml(APP_CONTENT.logoUrl)}" alt="Sahabeyi Tanı Logo" style="width:56px;height:56px;border-radius:14px;border:1px solid var(--border-strong);object-fit:cover;flex-shrink:0;">
      <div>
        <h1 class="page-title">Hakkında</h1>
        <p class="page-subtitle">${escapeHtml(APP_CONTENT.subSlogan)}</p>
      </div>
    </section>

    <div class="card" style="margin-bottom:var(--space-md);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span class="symbol-badge">${getIconSvg("book", 20)}</span>
        <h2 class="card-title" style="font-size:1.2rem;">${escapeHtml(ab.whyTitle)}</h2>
      </div>
      <p class="about-prose">
        ${escapeHtml(ab.whyText)}
      </p>
    </div>

    <div class="card" style="margin-bottom:var(--space-md);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span class="symbol-badge">${getIconSvg("seal", 20)}</span>
        <h2 class="card-title" style="font-size:1.2rem;">${escapeHtml(ab.sourceTitle)}</h2>
      </div>
      <p class="about-prose" style="margin-bottom:10px;">
        ${escapeHtml(ab.sourceText)}
      </p>
      <div style="background:var(--bg-surface-alt);padding:10px 12px;border-radius:var(--radius-sm);font-size:0.84rem;color:var(--text-muted);">
        ${escapeHtml(ab.noteText)}
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:var(--space-md);">
      <a href="${escapeHtml(ab.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block">
        ${getIconSvg("play", 17)}
        <span>${escapeHtml(ab.openPlaylistButton)}</span>
      </a>
      <button type="button" id="about-install-pwa-btn" class="btn btn-secondary btn-block">
        ${getIconSvg("smartphone", 17)}
        <span>Uygulamayı Telefonuna İndir / Kur</span>
      </button>
      <button type="button" id="reopen-onboarding-btn" class="btn btn-secondary btn-block">
        ${getIconSvg("lamp", 17)}
        <span>${escapeHtml(ab.showOnboardingButton)}</span>
      </button>
    </div>

    ${renderContactCardHtml(APP_CONTENT.contact)}
  `;

  document.getElementById("reopen-onboarding-btn")?.addEventListener("click", () => showOnboardingModal(true));
  document.getElementById("about-install-pwa-btn")?.addEventListener("click", () => triggerPwaInstall());
}
