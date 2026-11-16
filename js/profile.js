// Profil, istatistikler, rozetler, yedekleme/geri yükleme ve ayarlar modülü (Bölüm 24, 33, 34)
import APP_CONTENT from "../data/app-content.js";
import ACHIEVEMENTS from "../data/achievements.js";
import SAHABIS from "../data/sahabis-index.js";
import { getIconSvg, escapeHtml, formatNumber, showToast, renderDuaBannerHtml, renderContactCardHtml } from "./utils.js";
import {
  loadState,
  updateState,
  resetAllProgress,
  exportProgressJson,
  importProgressJson,
  applyTheme
} from "./storage.js";
import { computeDynamicTotalStars, renderStarsHtml } from "./stars.js";
import { showConfirmModal, triggerPwaInstall } from "./layout.js";
import { downloadCertificatePng } from "./sharing.js";

export function renderProfilePage(container) {
  const state = loadState();
  const totalStars = computeDynamicTotalStars(state);
  const completedSahabisCount = state.completedSahabis.length;
  const completedCategoriesCount = state.completedCategories.length;
  const totalSolved = Number(state.totalQuestionsSolved) || 0;
  const totalCorrect = Number(state.totalCorrect) || 0;
  const totalWrong = Number(state.totalWrong) || 0;
  const accuracyRate = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  const wai = state.whoAmIStats || {};
  const avgHints = wai.totalCorrect > 0 ? (wai.totalHintsUsed / wai.totalCorrect).toFixed(1) : "0.0";

  const favSahabiObjects = SAHABIS.filter(s => state.favoriteSahabis.includes(s.id));
  const recentTests = Array.isArray(state.recentTests) ? state.recentTests : [];

  container.innerHTML = `
    <section class="page-header">
      <h1 class="page-title">Profil ve İlerleme</h1>
      <p class="page-subtitle">Kişisel öğrenme istatistiklerin, favorilerin, rozetlerin ve uygulama ayarların.</p>
    </section>

    <!-- Genel İlerleme İstatistikleri -->
    <section class="home-section-block" aria-labelledby="prof-stats-heading">
      <h2 id="prof-stats-heading" class="section-heading">Genel İstatistikler</h2>
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
          <div class="stat-mini-val">${completedSahabisCount} / ${SAHABIS.length}</div>
          <div class="stat-mini-label">Tamamlanan Sahabî</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${completedCategoriesCount} / 14</div>
          <div class="stat-mini-label">Tamamlanan Kategori</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${formatNumber(totalSolved)}</div>
          <div class="stat-mini-label">Çözülen Toplam Soru</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val" style="color:var(--color-success);">${formatNumber(totalCorrect)}</div>
          <div class="stat-mini-label">Doğru Cevap Sayısı</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val" style="color:var(--color-error);">${formatNumber(totalWrong)}</div>
          <div class="stat-mini-label">Yanlış Cevap Sayısı</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">%${accuracyRate} • Seri: ${state.bestStreak}</div>
          <div class="stat-mini-label">Doğruluk ve En Uzun Seri</div>
        </div>
      </div>
    </section>

    <!-- Kimim Ben İstatistikleri -->
    <section class="home-section-block" aria-labelledby="prof-wai-heading">
      <h2 id="prof-wai-heading" class="section-heading">Kimim Ben? İstatistikleri</h2>
      <div class="summary-stats-grid">
        <div class="stat-mini-card">
          <div class="stat-mini-val">${formatNumber(wai.totalScore || 0)}</div>
          <div class="stat-mini-label">Kimim Ben Puanı</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${formatNumber(wai.totalCorrect || 0)} / ${formatNumber(wai.totalWrong || 0)}</div>
          <div class="stat-mini-label">Doğru / Yanlış Tahmin</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${formatNumber(wai.firstHintCorrect || 0)}</div>
          <div class="stat-mini-label">1. İpucunda Bilinenler</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-val">${avgHints} • Seri: ${wai.bestStreak || 0}</div>
          <div class="stat-mini-label">Ort. İpucu ve En İyi Seri</div>
        </div>
      </div>
    </section>

    <!-- Favorilerim -->
    <section class="home-section-block" aria-labelledby="prof-favs-heading">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:var(--space-sm);">
        <h2 id="prof-favs-heading" class="section-heading" style="margin-bottom:0;">Favori Sahabîler (${favSahabiObjects.length})</h2>
        <a href="#/test/favorites" class="btn btn-secondary btn-sm">Favori Sorularım (${state.favoriteQuestions.length})</a>
      </div>
      ${favSahabiObjects.length > 0 ? `
        <div class="list-stack">
          ${favSahabiObjects.map(s => `
            <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="list-row card-interactive">
              <div class="list-row-main">
                <span class="symbol-badge" style="font-weight:800;font-size:0.85rem;">${s.episodeNumber}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(s.sahabiName)}</div>
                  <div class="list-row-sub">${escapeHtml(s.title)} • ${escapeHtml(s.city)}</div>
                </div>
              </div>
              <div class="list-row-right">
                ${renderStarsHtml(state.testStars[s.id] || 0, 5)}
                <span style="color:var(--color-dark-gold);">${getIconSvg("chevron-right", 20)}</span>
              </div>
            </a>
          `).join("")}
        </div>
      ` : `
        <div class="card">
          <p class="card-desc">Henüz favoriye eklediğiniz bir sahabî bulunmuyor. Sahabîleri Tanı bölümünden kalp düğmesine dokunarak ekleyebilirsiniz.</p>
        </div>
      `}
    </section>

    <!-- Kazanılan Rozetler -->
    <section class="home-section-block" aria-labelledby="prof-badges-heading">
      <h2 id="prof-badges-heading" class="section-heading">Kazanılan Rozetler (${state.badges.length} / ${ACHIEVEMENTS.length})</h2>
      <div class="cards-grid">
        ${ACHIEVEMENTS.map(ach => {
          const unlocked = state.badges.includes(ach.id);
          return `
            <div class="card" style="opacity:${unlocked ? "1" : "0.55"};border-color:${unlocked ? "var(--color-gold)" : "var(--border-color)"};">
              <div style="display:flex;align-items:center;gap:12px;">
                <span class="symbol-badge">${getIconSvg(ach.icon, 20)}</span>
                <div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <h3 class="card-title" style="font-size:0.98rem;">${escapeHtml(ach.title)}</h3>
                    ${unlocked ? `<span class="badge badge-gold">Kazanıldı</span>` : `<span class="badge">Kilitli</span>`}
                  </div>
                  <p class="card-desc" style="margin-top:3px;">${escapeHtml(ach.description)}</p>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    <!-- Son Oynanan Testler -->
    <section class="home-section-block" aria-labelledby="prof-recent-heading">
      <h2 id="prof-recent-heading" class="section-heading">Son Oynanan Testler</h2>
      ${recentTests.length > 0 ? `
        <div class="list-stack">
          ${recentTests.slice(0, 6).map(rt => `
            <a href="${escapeHtml(rt.route || "#/tests")}" class="list-row card-interactive">
              <div class="list-row-main">
                <span class="symbol-badge">${getIconSvg("star", 18)}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(rt.title)}</div>
                  <div class="list-row-sub">Puan: ${formatNumber(rt.score)} • Doğruluk: %${rt.accuracyPercent} (${rt.correctCount}/${rt.totalQuestions})</div>
                </div>
              </div>
              <div class="list-row-right">
                ${renderStarsHtml(rt.earnedStars || 0, 5)}
              </div>
            </a>
          `).join("")}
        </div>
      ` : `
        <div class="card">
          <p class="card-desc">Henüz tamamlanmış bir test kaydı bulunmuyor.</p>
        </div>
      `}
    </section>

    <!-- İsimli Başarı ve Tamamlama Belgesi (PNG) -->
    <section class="home-section-block" aria-labelledby="prof-cert-heading">
      <h2 id="prof-cert-heading" class="section-heading">İsimli Başarı Belgesi Oluştur (PNG)</h2>
      <div class="card" style="display:flex;flex-direction:column;gap:10px;">
        <p class="card-desc">Kendi adınızı veya öğrencinizin adını yazarak mevcut puan ve yıldız ilerlemenizi içeren görsel başarı belgesini PNG olarak indirebilirsiniz.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input
            type="text"
            id="prof-cert-name-input"
            class="search-input"
            style="padding-left:12px;flex:1 1 200px;"
            placeholder="Belgede görünecek ad soyad..."
            aria-label="Belgede görünecek ad soyad"
          >
          <button type="button" id="prof-cert-download-btn" class="btn btn-primary">
            ${getIconSvg("download", 16)}
            <span>Başarı Belgesini İndir (PNG)</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Ayarlar ve Yedekleme -->
    <section class="home-section-block" aria-labelledby="prof-settings-heading">
      <h2 id="prof-settings-heading" class="section-heading">Ayarlar ve Veri Yönetimi</h2>
      <div class="card" style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <strong style="display:block;font-size:0.95rem;">Tema Tercihi</strong>
            <span class="card-desc">Açık, koyu veya sistem teması</span>
          </div>
          <select id="prof-theme-select" class="select-control" style="max-width:210px;" aria-label="Tema Tercihi">
            <option value="light" ${state.theme === "light" ? "selected" : ""}>Fildişi & Zümrüt (Açık)</option>
            <option value="sepia" ${state.theme === "sepia" ? "selected" : ""}>Kitap Kağıdı (Sepya)</option>
            <option value="slate" ${state.theme === "slate" ? "selected" : ""}>Modern Lacivert</option>
            <option value="dark" ${state.theme === "dark" ? "selected" : ""}>Gece Modu (Koyu)</option>
            <option value="auto" ${state.theme === "auto" ? "selected" : ""}>Sistem (Otomatik)</option>
          </select>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border-color);">
          <div>
            <strong style="display:block;font-size:0.95rem;">Varsayılan Görünüm Tercihi</strong>
            <span class="card-desc">Kategoriler, Biyografiler ve Testler için</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button type="button" id="prof-all-card-btn" class="btn btn-secondary btn-sm ${state.categoryView === "card" ? "btn-gold" : ""}">Kart Görünümü</button>
            <button type="button" id="prof-all-list-btn" class="btn btn-secondary btn-sm ${state.categoryView === "list" ? "btn-gold" : ""}">Liste Görünümü</button>
          </div>
        </div>

        <div style="padding-top:10px;border-top:1px solid var(--border-color);display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;">
          <button type="button" id="prof-export-btn" class="btn btn-primary">
            İlerlemeyi Yedekle (JSON)
          </button>
          <label for="prof-import-input" class="btn btn-secondary" style="cursor:pointer;">
            Yedeği Geri Yükle
            <input type="file" id="prof-import-input" accept=".json,application/json" style="display:none;">
          </label>
          <button type="button" id="prof-reset-btn" class="btn btn-danger">
            İlerlemeyi Sıfırla
          </button>
          <button type="button" id="prof-install-pwa-btn" class="btn btn-gold">
            ${getIconSvg("smartphone", 17)}
            <span>Telefona Uygulama Olarak Kur</span>
          </button>
          <a href="#/about" class="btn btn-secondary">
            Hakkında ve Kaynak
          </a>
        </div>
      </div>
    </section>

    ${renderContactCardHtml(APP_CONTENT.contact)}
    
  `;

  const themeSel = document.getElementById("prof-theme-select");
  if (themeSel) {
    themeSel.addEventListener("change", e => {
      const val = e.target.value;
      updateState(s => ({ ...s, theme: val }));
      applyTheme(val);
      showToast("Tema tercihi kaydedildi.");
    });
  }

  const allCardBtn = document.getElementById("prof-all-card-btn");
  const allListBtn = document.getElementById("prof-all-list-btn");
  if (allCardBtn) {
    allCardBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, categoryView: "card", biographyView: "card", testView: "card" }));
      showToast("Tüm listeler için Kart görünümü seçildi.");
      renderProfilePage(container);
    });
  }
  if (allListBtn) {
    allListBtn.addEventListener("click", () => {
      updateState(s => ({ ...s, categoryView: "list", biographyView: "list", testView: "list" }));
      showToast("Tüm listeler için Liste görünümü seçildi.");
      renderProfilePage(container);
    });
  }

  const exportBtn = document.getElementById("prof-export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const jsonStr = exportProgressJson();
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sahabeyi-tani-yedek-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("İlerleme yedeği JSON dosyası olarak indirildi.");
    });
  }

  const importInput = document.getElementById("prof-import-input");
  if (importInput) {
    importInput.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const res = importProgressJson(String(reader.result || ""));
        if (res.ok) {
          applyTheme(res.state.theme);
          showToast("Yedek başarıyla doğrulandı ve geri yüklendi.");
          renderProfilePage(container);
        } else {
          showToast(res.error || "Yedek dosyası geçersiz.");
        }
      };
      reader.onerror = () => {
        showToast("Dosya okunurken bir hata oluştu.");
      };
      reader.readAsText(file);
    });
  }

  const certBtn = document.getElementById("prof-cert-download-btn");
  if (certBtn) {
    certBtn.addEventListener("click", () => {
      const nameVal = (document.getElementById("prof-cert-name-input")?.value || "").trim() || "Değerli Katılımcı";
      const readCnt = Array.isArray(state.readSahabis) ? state.readSahabis.length : 0;
      downloadCertificatePng({
        recipientName: nameVal,
        achievementTitle: "Sahabeyi Tanı Başarı ve Tamamlama Belgesi",
        statsLine: `Toplam Puan: ${formatNumber(state.totalScore)} • Yıldız: ${formatNumber(totalStars)} • Tamamlanan Sahabî: ${completedSahabisCount}/82 • Okunan Biyografi: ${readCnt}/82`
      });
    });
  }

  const installPwaBtn = document.getElementById("prof-install-pwa-btn");
  if (installPwaBtn) {
    installPwaBtn.addEventListener("click", () => {
      triggerPwaInstall();
    });
  }

  const resetBtn = document.getElementById("prof-reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      showConfirmModal({
        title: "İlerlemeyi Sıfırla",
        message: "Tüm puanlarınız, yıldızlarınız, favorileriniz ve test kayıtlarınız sıfırlanacaktır. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
        confirmLabel: "Evet, Sıfırla",
        cancelLabel: "Vazgeç",
        onConfirm: () => {
          resetAllProgress();
          showToast("Tüm ilerleme verileri sıfırlandı.");
          renderProfilePage(container);
        }
      });
    });
  }
}


export function renderFavoritesPage(container) {
  const state = loadState();
  const favSahabiObjects = SAHABIS.filter(s => state.favoriteSahabis.includes(s.id));
  const favQuestionIds = Array.isArray(state.favoriteQuestions) ? state.favoriteQuestions : [];

  // Favori soruların detaylarını bul
  const favQuestionItems = [];
  for (const s of SAHABIS) {
    for (const q of (s.questions || [])) {
      if (favQuestionIds.includes(q.id)) {
        favQuestionItems.push({ ...q, sahabiName: s.sahabiName, sahabiSlug: s.sahabiSlug });
      }
    }
  }

  container.innerHTML = `
    <section class="page-header">
      <h1 class="page-title">Favorilerim</h1>
      <p class="page-subtitle">Kaydettiğin favori sahabîlerin biyografilerine, testlerine ve favori sorularına buradan hızlıca ulaşabilirsin.</p>
    </section>

    <section class="home-section-block" aria-labelledby="fav-sahabis-heading">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <h2 id="fav-sahabis-heading" class="section-heading" style="margin-bottom:0;">Favori Sahabîlerim (${favSahabiObjects.length})</h2>
        <a href="#/biographies" class="btn btn-secondary btn-sm">Tüm Sahabîler</a>
      </div>

      ${favSahabiObjects.length > 0 ? `
        <div class="list-stack">
          ${favSahabiObjects.map(s => `
            <div class="list-row card-interactive">
              <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="list-row-main">
                <span class="symbol-badge" style="font-weight:800;font-size:0.84rem;">${s.episodeNumber}</span>
                <div class="list-row-text">
                  <div class="list-row-title">${escapeHtml(s.sahabiName)}</div>
                  <div class="list-row-sub">${escapeHtml(s.title)} • ${escapeHtml(s.city)}</div>
                </div>
              </a>
              <div class="list-row-right">
                ${renderStarsHtml(state.testStars[s.id] || 0, 5)}
                <a href="#/biography/${escapeHtml(s.sahabiSlug)}" class="btn btn-secondary btn-sm">Biyografi</a>
                <a href="#/test/sahabi/${escapeHtml(s.sahabiSlug)}" class="btn btn-primary btn-sm">Test</a>
              </div>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="card">
          <p class="card-desc">Henüz favoriye eklediğiniz bir sahabî bulunmuyor. Sahabîleri Tanı sayfasında kalp simgesine dokunarak favori ekleyebilirsiniz.</p>
        </div>
      `}
    </section>

    <section class="home-section-block" aria-labelledby="fav-questions-heading">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <h2 id="fav-questions-heading" class="section-heading" style="margin-bottom:0;">Favori Sorularım (${favQuestionItems.length})</h2>
        ${favQuestionItems.length > 0 ? `
          <a href="#/test/favorites" class="btn btn-primary btn-sm">Favori Sorularımı Çöz (${favQuestionItems.length})</a>
        ` : ""}
      </div>

      ${favQuestionItems.length > 0 ? `
        <div class="list-stack">
          ${favQuestionItems.map((q, idx) => `
            <div class="card" style="padding:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
                <span class="badge badge-gold">${idx + 1}. Favori Soru</span>
                <a href="#/biography/${escapeHtml(q.sahabiSlug)}" class="badge">${escapeHtml(q.sahabiName)}</a>
              </div>
              <p style="font-weight:700;font-size:0.88rem;color:var(--text-main);margin-top:4px;">${escapeHtml(q.question)}</p>
              <p style="font-size:0.8rem;color:var(--color-success);font-weight:700;margin-top:4px;">Doğru Cevap: ${escapeHtml(q.correctAnswer)}</p>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="card">
          <p class="card-desc">Henüz favorilerinize eklediğiniz bir soru bulunmuyor. Test çözerken üst bardaki kalp simgesine dokunarak soruları favorilerinize ekleyebilirsiniz.</p>
        </div>
      `}
    </section>

    <section class="home-section-block" aria-labelledby="fav-notes-heading">
      <h2 id="fav-notes-heading" class="section-heading">Kişisel Tefekkür Notlarım (${Object.keys(state.sahabiNotes || {}).length})</h2>
      ${Object.keys(state.sahabiNotes || {}).length > 0 ? `
        <div class="list-stack">
          ${Object.entries(state.sahabiNotes || {}).map(([sid, noteText]) => {
            const sh = SAHABIS.find(x => x.id === sid);
            if (!sh) return "";
            return `
              <div class="card" style="padding:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
                  <strong style="font-family:var(--font-heading);font-size:1.05rem;color:var(--heading-color);">${escapeHtml(sh.sahabiName)}</strong>
                  <a href="#/biography/${escapeHtml(sh.sahabiSlug)}" class="btn btn-secondary btn-sm">Biyografiyi Aç</a>
                </div>
                <p class="card-desc" style="color:var(--text-main);">${escapeHtml(noteText)}</p>
              </div>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="card">
          <p class="card-desc">Henüz kaydettiğiniz bir kişisel tefekkür notu bulunmuyor. Sahabî biyografi sayfalarının altındaki not alanından kendi ders ve notlarınızı kaydedebilirsiniz.</p>
        </div>
      `}
    </section>
  `;
}
