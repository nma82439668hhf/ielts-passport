/* A local session timer. Only its dock preference is stored; elapsed time is never invented. */
(() => {
  "use strict";
  const DOCK_KEY = "ielts_study_panel_dock";
  const svg = content => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;

  function initialize() {
    const opener = document.getElementById("open-study-panel");
    if (!opener || document.getElementById("study-panel")) return;
    const panel = document.createElement("aside");
    panel.id = "study-panel";
    panel.className = "study-panel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "study-panel-title");
    panel.dataset.running = "false";
    panel.innerHTML = `
      <div class="study-panel-header">
        <button class="study-panel-handle" id="study-panel-handle" type="button" aria-label="拖动专注面板；方向键移动，回车吸附" title="拖动调整位置，也可用方向键移动，回车吸附">
          ${svg('<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke-width="3"/>')}
          <span id="study-panel-title">专注计时</span>
        </button>
        <button class="study-panel-close" id="study-panel-close" type="button" aria-label="关闭并暂停计时">${svg('<path d="m6 6 12 12M18 6 6 18"/>')}</button>
      </div>
      <div class="study-panel-body">
        <p class="study-panel-caption" id="study-panel-clock-label">本次专注已用时</p>
        <output class="study-panel-clock" id="study-panel-clock" role="timer" aria-live="off" aria-labelledby="study-panel-clock-label">00:00</output>
        <p class="study-panel-status" id="study-panel-status" role="status">准备好后开始</p>
        <div class="study-panel-actions">
          <button class="study-panel-toggle" id="study-panel-toggle" type="button">开始计时</button>
          <button id="study-panel-reset" type="button" disabled>重置</button>
        </div>
        <div class="study-panel-dock">
          <span>拖动顶部可调整位置</span>
          <div class="study-panel-dock-buttons" role="group" aria-label="面板停靠位置">
            <button id="study-panel-dock-left" type="button" aria-label="停靠左下方" aria-pressed="false">${svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M5.5 9v6"/>')}</button>
            <button id="study-panel-dock-right" type="button" aria-label="停靠右下方" aria-pressed="true">${svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 4v16M18.5 9v6"/>')}</button>
          </div>
        </div>
      </div>`;
    document.body.append(panel);
    const handle = panel.querySelector("#study-panel-handle");
    const toggle = panel.querySelector("#study-panel-toggle");
    const reset = panel.querySelector("#study-panel-reset");
    const clock = panel.querySelector("#study-panel-clock");
    const status = panel.querySelector("#study-panel-status");
    const dockButtons = [panel.querySelector("#study-panel-dock-left"), panel.querySelector("#study-panel-dock-right")];
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let dock = "right";
    try { dock = localStorage.getItem(DOCK_KEY) === "left" ? "left" : "right"; } catch (_) { /* Storage can be disabled. */ }
    let elapsed = 0;
    let startedAt = null;
    let interval = null;
    let animation = null;
    let drag = null;
    let returnFocus = null;

    function currentElapsed() { return elapsed + (startedAt === null ? 0 : performance.now() - startedAt); }
    function paintClock() {
      const total = Math.floor(currentElapsed() / 1000);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;
      const pad = n => String(n).padStart(2, "0");
      clock.textContent = (hours ? `${pad(hours)}:` : "") + `${pad(minutes)}:${pad(seconds)}`;
      reset.disabled = currentElapsed() === 0 && startedAt === null;
    }
    function setRunning(running) {
      if (running && startedAt === null) {
        startedAt = performance.now();
        interval = setInterval(paintClock, 250);
      } else if (!running && startedAt !== null) {
        elapsed = currentElapsed();
        startedAt = null;
        clearInterval(interval);
        interval = null;
      }
      panel.dataset.running = String(startedAt !== null);
      toggle.textContent = startedAt !== null ? "暂停计时" : elapsed > 0 ? "继续计时" : "开始计时";
      status.textContent = startedAt !== null ? "正在计时" : elapsed > 0 ? "计时已暂停" : "准备好后开始";
      paintClock();
    }
    function visibleBounds() {
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0;
      const top = viewport?.offsetTop || 0;
      const width = viewport?.width || innerWidth;
      const height = viewport?.height || innerHeight;
      const panelStyle = getComputedStyle(panel);
      const safeTop = parseFloat(panelStyle.scrollMarginTop) || 12;
      const safeRight = parseFloat(panelStyle.scrollMarginRight) || 12;
      const safeBottom = parseFloat(panelStyle.scrollMarginBottom) || 12;
      const safeLeft = parseFloat(panelStyle.scrollMarginLeft) || 12;
      const sidebar = document.querySelector(".sidebar");
      const sidebarRect = sidebar?.getBoundingClientRect();
      const sidebarVisible = sidebarRect && getComputedStyle(sidebar).display !== "none" && sidebarRect.left >= -1 && sidebarRect.right > left && sidebarRect.width < width / 2;
      const nav = document.querySelector(".mobile-bottom-nav");
      const navRect = nav?.getBoundingClientRect();
      const navVisible = navRect && getComputedStyle(nav).display !== "none" && navRect.bottom > top && navRect.top < top + height && getComputedStyle(nav).position === "fixed";
      const bottom = navVisible ? Math.min(top + height, navRect.top) - 12 : top + height - safeBottom;
      panel.style.setProperty("--study-bottom-space", `${Math.max(12, top + height - bottom)}px`);
      const minX = sidebarVisible ? sidebarRect.right + 12 : left + safeLeft;
      const maxX = Math.max(left + safeLeft, left + width - panel.offsetWidth - safeRight);
      return {
        minX: Math.min(minX, maxX), maxX,
        minY: top + safeTop,
        maxY: Math.max(top + safeTop, bottom - panel.offsetHeight)
      };
    }
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    function stopAnimation() {
      const rect = panel.getBoundingClientRect();
      animation?.cancel();
      animation = null;
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      return { x: rect.left, y: rect.top };
    }
    function place(x, y) {
      const bounds = visibleBounds();
      panel.style.left = `${clamp(x, bounds.minX, bounds.maxX)}px`;
      panel.style.top = `${clamp(y, bounds.minY, bounds.maxY)}px`;
    }
    function setDock(nextDock, animate = true) {
      const start = stopAnimation();
      dock = nextDock === "left" ? "left" : "right";
      const bounds = visibleBounds();
      const x = dock === "left" ? bounds.minX : bounds.maxX;
      const y = bounds.maxY;
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.dataset.dock = dock;
      dockButtons.forEach((button, index) => button.setAttribute("aria-pressed", String((index === 0 ? "left" : "right") === dock)));
      try { localStorage.setItem(DOCK_KEY, dock); } catch (_) { /* Position is optional. */ }
      if (animate && !reducedMotion.matches && panel.animate && Math.hypot(start.x - x, start.y - y) > 1) {
        const dx = start.x - x;
        const dy = start.y - y;
        // A short damped return. Every overshoot stays inside the usable viewport.
        const reboundX = clamp(x - dx * .025, bounds.minX, bounds.maxX) - x;
        const reboundY = clamp(y - dy * .025, bounds.minY, bounds.maxY) - y;
        animation = panel.animate([
          { transform: `translate(${dx}px, ${dy}px)`, offset: 0 },
          { transform: `translate(${reboundX}px, ${reboundY}px)`, offset: .66 },
          { transform: `translate(${dx * .006}px, ${dy * .006}px)`, offset: .84 },
          { transform: "translate(0, 0)", offset: 1 }
        ], { duration: 420, easing: "cubic-bezier(.2,.7,.3,1)" });
        animation.onfinish = () => { animation = null; };
      }
    }
    function nearestDock() {
      const bounds = visibleBounds();
      return panel.getBoundingClientRect().left < (bounds.minX + bounds.maxX) / 2 ? "left" : "right";
    }
    function open() {
      if (!panel.hidden) { toggle.focus(); return; }
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : opener;
      panel.hidden = false;
      opener.setAttribute("aria-expanded", "true");
      setDock(dock, false);
      toggle.focus({ preventScroll: true });
    }
    function endDrag() {
      if (!drag) return;
      const pointerId = drag.pointerId;
      drag = null;
      panel.classList.remove("is-dragging");
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      setDock(nearestDock());
    }
    function close() {
      endDrag();
      animation?.cancel();
      animation = null;
      setRunning(false);
      panel.hidden = true;
      opener.setAttribute("aria-expanded", "false");
      const focusTarget = returnFocus?.isConnected ? returnFocus : opener;
      focusTarget.focus({ preventScroll: true });
    }
    opener.setAttribute("aria-controls", panel.id);
    opener.setAttribute("aria-expanded", "false");
    opener.addEventListener("click", () => panel.hidden ? open() : close());
    panel.querySelector("#study-panel-close").addEventListener("click", close);
    toggle.addEventListener("click", () => setRunning(startedAt === null));
    reset.addEventListener("click", () => { setRunning(false); elapsed = 0; setRunning(false); });
    dockButtons[0].addEventListener("click", () => setDock("left"));
    dockButtons[1].addEventListener("click", () => setDock("right"));
    panel.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    });
    handle.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0) return;
      const start = stopAnimation();
      drag = { pointerId: event.pointerId, pointerX: event.clientX, pointerY: event.clientY, x: start.x, y: start.y };
      panel.classList.add("is-dragging");
      handle.setPointerCapture(event.pointerId);
      handle.focus({ preventScroll: true });
    });
    handle.addEventListener("pointermove", event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      place(drag.x + event.clientX - drag.pointerX, drag.y + event.clientY - drag.pointerY);
    });
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
    handle.addEventListener("lostpointercapture", endDrag);
    handle.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const start = stopAnimation();
        const step = event.shiftKey ? 1 : 12;
        place(start.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), start.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0));
        dockButtons.forEach(button => button.setAttribute("aria-pressed", "false"));
      } else if (["Enter", " ", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        setDock(event.key === "Home" ? "left" : event.key === "End" ? "right" : nearestDock());
      }
    });
    const onResize = () => {
      if (panel.hidden) return;
      if (drag && handle.hasPointerCapture(drag.pointerId)) handle.releasePointerCapture(drag.pointerId);
      drag = null;
      panel.classList.remove("is-dragging");
      setDock(dock, false);
    };
    addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    reducedMotion.addEventListener("change", () => { if (reducedMotion.matches && animation) { animation.cancel(); animation = null; } });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) paintClock(); });
    window.IELTSStudyPanel = Object.freeze({ open, close, dock: side => setDock(side), getState: () => ({ open: !panel.hidden, running: startedAt !== null, elapsedMs: currentElapsed(), dock }) });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
