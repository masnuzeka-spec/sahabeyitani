// Hash tabanlı yönlendirici (Bölüm 29)

let routeChangeHandler = null;

export function parseCurrentHash() {
  const rawHash = window.location.hash || "#/home";
  const cleaned = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  const [pathPart, queryPart] = cleaned.split("?");
  const normalizedPath = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const segments = normalizedPath.split("/").filter(Boolean);
  const query = {};

  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    for (const [k, v] of params.entries()) {
      query[k] = v;
    }
  }

  // Rotalar:
  // #/home
  // #/categories
  // #/category/:slug
  // #/biographies
  // #/biography/:slug
  // #/tests
  // #/test/sahabi/:slug
  // #/test/category/:slug
  // #/test/mixed
  // #/test/mistakes
  // #/test/favorites
  // #/who-am-i
  // #/profile
  // #/about
  const first = segments[0] || "home";

  if (first === "home") {
    return { name: "home", params: {}, query, raw: rawHash, navTab: "home", isRoot: true };
  }
  if (first === "categories") {
    return { name: "categories", params: {}, query, raw: rawHash, navTab: "categories", isRoot: true };
  }
  if (first === "category" && segments[1]) {
    return { name: "category-detail", params: { slug: segments[1] }, query, raw: rawHash, navTab: "categories", isRoot: false };
  }
  if (first === "biographies") {
    return { name: "biographies", params: {}, query, raw: rawHash, navTab: "biographies", isRoot: true };
  }
  if (first === "biography" && segments[1]) {
    return { name: "biography-detail", params: { slug: segments[1] }, query, raw: rawHash, navTab: "biographies", isRoot: false };
  }
  if (first === "tests") {
    return { name: "tests", params: {}, query, raw: rawHash, navTab: "tests", isRoot: true };
  }
  if (first === "test") {
    const sub = segments[1] || "";
    if (sub === "sahabi" && segments[2]) {
      return { name: "test-sahabi", params: { slug: segments[2] }, query, raw: rawHash, navTab: "tests", isRoot: false };
    }
    if (sub === "category" && segments[2]) {
      return { name: "test-category", params: { slug: segments[2] }, query, raw: rawHash, navTab: "tests", isRoot: false };
    }
    if (sub === "mixed") {
      return { name: "test-mixed", params: {}, query, raw: rawHash, navTab: "tests", isRoot: false };
    }
    if (sub === "mistakes") {
      return { name: "test-mistakes", params: {}, query, raw: rawHash, navTab: "tests", isRoot: false };
    }
    if (sub === "favorites") {
      return { name: "test-favorites", params: {}, query, raw: rawHash, navTab: "tests", isRoot: false };
    }
  }
  if (first === "who-am-i") {
    return { name: "who-am-i", params: {}, query, raw: rawHash, navTab: "tests", isRoot: false };
  }
  if (first === "favorites") {
    return { name: "favorites", params: {}, query, raw: rawHash, navTab: "favorites", isRoot: true };
  }
  if (first === "profile") {
    return { name: "profile", params: {}, query, raw: rawHash, navTab: "profile", isRoot: true };
  }
  if (first === "about") {
    return { name: "about", params: {}, query, raw: rawHash, navTab: "profile", isRoot: false };
  }

  return { name: "home", params: {}, query, raw: "#/home", navTab: "home", isRoot: true };
}

export function navigateTo(hashUrl) {
  const target = hashUrl.startsWith("#") ? hashUrl : `#${hashUrl}`;
  if (window.location.hash === target) {
    if (typeof routeChangeHandler === "function") {
      routeChangeHandler(parseCurrentHash());
    }
  } else {
    window.location.hash = target;
  }
}

export function initRouter(onRoute) {
  routeChangeHandler = onRoute;
  window.addEventListener("hashchange", () => {
    if (typeof routeChangeHandler === "function") {
      routeChangeHandler(parseCurrentHash());
    }
  });
  if (!window.location.hash) {
    window.history.replaceState(null, "", "#/home");
  }
  if (typeof routeChangeHandler === "function") {
    routeChangeHandler(parseCurrentHash());
  }
}
