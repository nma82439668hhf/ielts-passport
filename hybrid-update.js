(function () {
  "use strict";

  const REMOTE_BASE = "https://nma82439668hhf.github.io/ielts-passport/";
  const CHECK_KEY = "ielts_hybrid_update_checked";
  const localVersion = (window.IELTS_BANK && window.IELTS_BANK.version && window.IELTS_BANK.version.webVersion) || "0.0.0";

  function isAppRuntime() {
    const capacitor = window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform();
    return Boolean(capacitor || document.documentElement.dataset.desktopApp === "true" || location.protocol === "file:");
  }

  function compareVersion(a, b) {
    const pa = String(a || "0").split(".").map((n) => Number(n) || 0);
    const pb = String(b || "0").split(".").map((n) => Number(n) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
  }

  function showUpdateBanner(text) {
    if (document.getElementById("hybrid-update-banner")) return;
    const banner = document.createElement("div");
    banner.id = "hybrid-update-banner";
    banner.textContent = text;
    banner.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:200;padding:10px 16px;border-radius:999px;background:rgba(20,33,26,.92);color:#fff;font:13px/1.4 sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.22)";
    document.body.appendChild(banner);
    window.setTimeout(() => banner.remove(), 1600);
  }

  function loadRemoteVersion() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${REMOTE_BASE}data/remote-version.js?t=${Date.now()}`;
      script.onload = () => resolve(window.IELTS_REMOTE_VERSION || null);
      script.onerror = () => reject(new Error("remote version unavailable"));
      document.head.appendChild(script);
    });
  }

  async function check(manual = false) {
    if (!navigator.onLine) {
      if (manual) alert("当前网络离线，继续使用内置本地版本。 ");
      return { status: "offline", localVersion };
    }
    try {
      const remote = await loadRemoteVersion();
      if (!remote || !remote.webVersion) throw new Error("invalid remote version");
      const comparison = compareVersion(remote.webVersion, localVersion);
      if (comparison > 0 && isAppRuntime()) {
        sessionStorage.setItem(CHECK_KEY, remote.webVersion);
        showUpdateBanner("发现云端新版本，正在切换…");
        window.setTimeout(() => {
          location.replace(`${remote.siteUrl || REMOTE_BASE}?cloud=1&fromApp=${encodeURIComponent(localVersion)}`);
        }, 700);
        return { status: "updating", localVersion, remoteVersion: remote.webVersion };
      }
      if (manual) alert(`当前已是最新版本：${localVersion}`);
      return { status: "current", localVersion, remoteVersion: remote.webVersion };
    } catch (e) {
      if (manual) alert("暂时无法连接云端，继续使用内置本地版本。 ");
      return { status: "error", localVersion, error: e.message };
    }
  }

  window.IELTS_HYBRID_UPDATE = { check, localVersion, isAppRuntime };
  window.addEventListener("DOMContentLoaded", () => check(false));
})();
