// Ana uygulama başlatıcı ve rota dağıtıcısı (Bölüm 28, 29)
import { loadState, applyTheme, applyFontScale } from "./storage.js";
import { initRouter, navigateTo } from "./router.js";
import { renderHeaderAndNav, showOnboardingModal, renderAboutPage, initPwaInstallListener } from "./layout.js";
import { renderHomePage } from "./home.js";
import { renderCategoriesPage, renderCategoryDetailPage } from "./categories.js";
import { renderBiographiesPage, renderBiographyDetailPage, stopBiographySpeech } from "./biographies.js";
import { renderTestsPage } from "./tests.js";
import {
  renderSahabiTestRoute,
  renderCategoryTestRoute,
  renderMixedTestRoute,
  renderMistakesTestRoute,
  renderFavoritesTestRoute
} from "./quiz.js";
import { renderWhoAmIPage } from "./who-am-i.js";
import { renderProfilePage, renderFavoritesPage } from "./profile.js";
import { initTelegramMiniApp } from "./telegram.js";

function handleRoute(routeInfo) {
  const mainEl = document.getElementById("app-main");
  if (!mainEl) return;

  if (routeInfo.name !== "biography-detail") {
    stopBiographySpeech();
  }

  renderHeaderAndNav(routeInfo);

  switch (routeInfo.name) {
    case "home":
      renderHomePage(mainEl);
      break;
    case "categories":
      renderCategoriesPage(mainEl);
      break;
    case "category-detail":
      renderCategoryDetailPage(mainEl, routeInfo.params.slug);
      break;
    case "biographies":
      renderBiographiesPage(mainEl);
      break;
    case "biography-detail":
      renderBiographyDetailPage(mainEl, routeInfo.params.slug);
      break;
    case "tests":
      renderTestsPage(mainEl);
      break;
    case "test-sahabi":
      renderSahabiTestRoute(mainEl, routeInfo.params.slug, routeInfo.query);
      break;
    case "test-category":
      renderCategoryTestRoute(mainEl, routeInfo.params.slug, routeInfo.query);
      break;
    case "test-mixed":
      renderMixedTestRoute(mainEl, routeInfo.query);
      break;
    case "test-mistakes":
      renderMistakesTestRoute(mainEl);
      break;
    case "test-favorites":
      renderFavoritesTestRoute(mainEl);
      break;
    case "who-am-i":
      renderWhoAmIPage(mainEl);
      break;
    case "favorites":
      renderFavoritesPage(mainEl);
      break;
    case "profile":
      renderProfilePage(mainEl);
      break;
    case "about":
      renderAboutPage(mainEl);
      break;
    default:
      renderHomePage(mainEl);
      break;
  }

  window.scrollTo({ top: 0, behavior: "auto" });
}

function bootstrapApp() {
  const state = loadState();
  applyTheme(state.theme);
  applyFontScale(state.fontScale || 100);
  initPwaInstallListener();

  initTelegramMiniApp({
    onThemeChange: scheme => {
      if (loadState().theme === "auto") {
        applyTheme(scheme === "dark" ? "dark" : "light");
      }
    },
    onBackClick: () => {
      navigateTo("#/home");
    }
  });

  initRouter(handleRoute);
  showOnboardingModal(false);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js?v=1.3", { updateViaCache: "none" })
        .then(reg => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", bootstrapApp);
