(function () {
  "use strict";

  const STORAGE_KEY = "ielts_user_settings";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const labels = { light: "白天模式", dark: "黑夜模式" };
  const colors = { light: "#f2f2f7", dark: "#000000" };
  let preference = "auto";
  let theme = "light";

  function normalize(value) {
    return ["light", "dark"].includes(value) ? value : "auto";
  }

  function readSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) {
      return {};
    }
  }

  function syncControls() {
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      const next = theme === "dark" ? "light" : "dark";
      const description = `当前${labels[theme]}，切换到${labels[next]}`;
      toggle.setAttribute("aria-label", description);
      toggle.title = description;
      toggle.dataset.currentTheme = theme;
      const label = toggle.querySelector(".theme-toggle-label");
      if (label) label.textContent = labels[theme];
    }
    const select = document.getElementById("theme-preference");
    if (select) select.value = preference;
    const status = document.getElementById("theme-status");
    if (status) status.textContent = preference === "auto" ? `随系统自动切换，当前为${labels[theme]}。` : `已固定为${labels[theme]}。`;
  }

  function apply() {
    theme = preference === "auto" ? (system.matches ? "dark" : "light") : preference;
    // This script runs in the head, before styles or content can paint.
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = colors[theme];
    syncControls();
    window.dispatchEvent(new CustomEvent("ielts:theme-change", { detail: { preference, theme } }));
  }

  function setPreference(value) {
    preference = normalize(value);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSettings(), theme: preference }));
    } catch (_) {
      // The selected appearance remains usable when browser storage is unavailable.
    }
    apply();
    return theme;
  }

  function toggle() {
    return setPreference(theme === "dark" ? "light" : "dark");
  }

  window.IELTSTheme = {
    getPreference: () => preference,
    getResolvedTheme: () => theme,
    setPreference,
    toggle,
    syncControls,
  };

  preference = normalize(readSettings().theme);
  apply();

  const followSystem = () => { if (preference === "auto") apply(); };
  if (system.addEventListener) system.addEventListener("change", followSystem);
  else if (system.addListener) system.addListener(followSystem);

  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    preference = normalize(readSettings().theme);
    apply();
  });

  document.addEventListener("click", event => {
    if (event.target.closest && event.target.closest("#theme-toggle")) toggle();
  });
  document.addEventListener("change", event => {
    if (event.target.id === "theme-preference") setPreference(event.target.value);
  });
  document.addEventListener("DOMContentLoaded", syncControls, { once: true });
})();
