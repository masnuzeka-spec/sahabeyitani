// Telegram Mini App entegrasyonu (Bölüm 37)
// Telegram SDK bulunmadığında normal web uygulaması olarak sorunsuz çalışır.

let tgInstance = null;
let backButtonHandler = null;

export function detectTelegramWebApp() {
  try {
    if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
      tgInstance = window.Telegram.WebApp;
      return tgInstance;
    }
  } catch (err) {
    tgInstance = null;
  }
  return null;
}

export function initTelegramMiniApp({ onThemeChange, onBackClick } = {}) {
  const tg = detectTelegramWebApp();
  if (!tg) return { isTelegram: false };

  try {
    if (typeof tg.ready === "function") tg.ready();
    if (typeof tg.expand === "function") tg.expand();

    if (tg.colorScheme && typeof onThemeChange === "function") {
      onThemeChange(tg.colorScheme);
    }

    if (typeof tg.onEvent === "function" && typeof onThemeChange === "function") {
      tg.onEvent("themeChanged", () => {
        if (tg.colorScheme) onThemeChange(tg.colorScheme);
      });
    }

    if (tg.BackButton && typeof onBackClick === "function") {
      backButtonHandler = onBackClick;
      if (typeof tg.BackButton.onClick === "function") {
        tg.BackButton.onClick(backButtonHandler);
      }
    }
  } catch (err) {
    // Güvenli geri dönüş
  }

  return {
    isTelegram: true,
    colorScheme: tg.colorScheme || null,
    themeParams: tg.themeParams || {}
  };
}

export function syncTelegramBackButton(isSubPage) {
  const tg = detectTelegramWebApp();
  if (!tg || !tg.BackButton) return;
  try {
    if (isSubPage) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  } catch (err) {
    // Yoksay
  }
}

export function triggerHaptic(type = "light") {
  const tg = detectTelegramWebApp();
  if (!tg || !tg.HapticFeedback) return;
  try {
    if (type === "success" || type === "error" || type === "warning") {
      tg.HapticFeedback.notificationOccurred(type);
    } else if (type === "selection") {
      tg.HapticFeedback.selectionChanged();
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (err) {
    // Yoksay
  }
}
