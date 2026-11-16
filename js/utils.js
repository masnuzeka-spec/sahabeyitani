// Yardımcı fonksiyonlar, sembol SVG üreticisi ve ortak bileşen şablonları

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeTr(str) {
  if (!str) return "";
  return String(str)
    .toLocaleLowerCase("tr-TR")
    .replace(/[âä]/g, "a")
    .replace(/[îï]/g, "i")
    .replace(/[ûü]/g, "u")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/['’‘`´\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shuffleArray(array) {
  const copy = Array.isArray(array) ? [...array] : [];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function formatNumber(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("tr-TR");
}

export function getIconSvg(name, size = 20) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  switch (name) {
    case "book":
      return `<svg ${attrs}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    case "compass":
      return `<svg ${attrs}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
    case "lamp":
      return `<svg ${attrs}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>`;
    case "star":
      return `<svg ${attrs}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    case "seal":
      return `<svg ${attrs}><path d="M12 2l2.9 2.1 3.5-.4 1.1 3.4 3 1.9-1.5 3.2 1.5 3.2-3 1.9-1.1 3.4-3.5-.4L12 22l-2.9-2.1-3.5.4-1.1-3.4-3-1.9 1.5-3.2-1.5-3.2 3-1.9 1.1-3.4 3.5.4L12 2z"/><circle cx="12" cy="12" r="4"/></svg>`;
    case "road":
      return `<svg ${attrs}><path d="M4 19L9 5"/><path d="M15 5l5 14"/><path d="M12 6v2"/><path d="M12 11v2"/><path d="M12 16v2"/></svg>`;
    case "pattern":
      return `<svg ${attrs}><rect x="4" y="4" width="16" height="16" rx="2" transform="rotate(45 12 12)"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
    case "home":
      return `<svg ${attrs}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>`;
    case "user":
      return `<svg ${attrs}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    case "heart":
      return `<svg ${attrs}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    case "heart-filled":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    case "search":
      return `<svg ${attrs}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    case "sun":
      return `<svg ${attrs}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    case "moon":
      return `<svg ${attrs}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    case "share":
      return `<svg ${attrs}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
    case "grid":
      return `<svg ${attrs}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
    case "list":
      return `<svg ${attrs}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
    case "chevron-down":
      return `<svg class="accordion-chevron" ${attrs}><polyline points="6 9 12 15 18 9"/></svg>`;
    case "chevron-right":
      return `<svg ${attrs}><polyline points="9 18 15 12 9 6"/></svg>`;
    case "arrow-left":
      return `<svg ${attrs}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
    case "check":
      return `<svg ${attrs}><polyline points="20 6 9 17 4 12"/></svg>`;
    case "info":
      return `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    case "play":
      return `<svg ${attrs}><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    case "volume":
      return `<svg ${attrs}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
    case "download":
      return `<svg ${attrs}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    case "send":
      return `<svg ${attrs}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    case "external-link":
      return `<svg ${attrs}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
    case "smartphone":
      return `<svg ${attrs}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
    case "palette":
      return `<svg ${attrs}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
    case "headphones":
      return `<svg ${attrs}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`;
    case "close":
      return `<svg ${attrs}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    default:
      return `<svg ${attrs}><circle cx="12" cy="12" r="9"/></svg>`;
  }
}

export function renderDuaBannerHtml(dua) {
  if (!dua) return "";
  const text = dua.text || dua.turkish || "";
  if (!text) return "";
  return `
    <div class="dua-banner-card" role="complementary" aria-label="Dua Notu">
      <p class="dua-text-small">${escapeHtml(text)}</p>
    </div>
  `;
}

export function renderContactCardHtml(contact) {
  if (!contact) return "";
  return `
    <div class="contact-card">
      <h3 class="contact-card-title">${escapeHtml(contact.title)}</h3>
      <p class="contact-card-desc">${escapeHtml(contact.description)}</p>
      <a href="${escapeHtml(contact.telegramUrl)}" target="_blank" rel="noopener noreferrer" class="contact-card-btn">
        ${getIconSvg("send", 13)}
        <span>${escapeHtml(contact.buttonLabel || "Telegram ile Mesaj Gönder")}</span>
      </a>
    </div>
  `;
}

export function showToast(message, durationMs = 2800) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  root.appendChild(item);
  setTimeout(() => {
    if (item.parentNode) item.parentNode.removeChild(item);
  }, durationMs);
}
