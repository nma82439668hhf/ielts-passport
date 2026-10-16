/* 保留现有数据逻辑，补齐 Sheet 焦点、开关语义与底部导航状态。 */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const sheets = [...document.querySelectorAll(".support-modal,.announcement-modal")];
  const records = new Map();
  const focusable = el => [...el.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(node => !node.disabled && node.getClientRects().length);
  const surfaces = () => [...document.querySelectorAll("main,#sidebar,#mobile-bottom-nav,#study-panel")];

  function prepare() {
    document.querySelectorAll(".setting-row").forEach(row => {
      const control = row.querySelector(".switch");
      if (!control) return;
      row.setAttribute("role", "switch");
      row.setAttribute("aria-checked", String(control.classList.contains("on")));
      control.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll("#mobile-bottom-nav button").forEach(button => {
      if (button.classList.contains("is-active")) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.querySelectorAll(".empty-state:not([data-ios-empty])").forEach(el => {
      el.dataset.iosEmpty = "1";
      el.insertAdjacentHTML("afterbegin", '<svg class="ios-empty-icon" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 10h11c3 0 6 2 6 4 0-2 3-4 6-4h11v28H30c-3 0-6 1-6 3-1-2-3-3-6-3H7zM24 14v27M12 18h6M12 24h6M30 18h6M30 24h6"/></svg>');
    });
  }
  function openSheet(modal) {
    if (modal.hidden || records.has(modal)) return;
    const record = { focus: document.activeElement, inert: surfaces().map(el => [el, el.inert]), closing: false, animation: null };
    records.set(modal, record);
    record.inert.forEach(([el]) => { el.inert = true; });
    document.body.classList.add("ios-sheet-open");
    const card = modal.querySelector('[role="dialog"]');
    if (!reduced.matches && card.animate) {
      record.animation = card.animate([{transform:"translateY(48px)",opacity:0},{transform:"translateY(0)",opacity:1}],{duration:350,easing:"cubic-bezier(.32,.72,0,1)"});
      record.animation.finished.catch(() => {});
    }
    (focusable(card)[0] || card).focus({preventScroll:true});
  }
  function restore(modal) {
    const record = records.get(modal);
    if (!record) return;
    record.animation?.cancel();
    records.delete(modal);
    record.inert.forEach(([el, inert]) => { el.inert = inert; });
    if (!records.size) {
      document.body.classList.remove("ios-sheet-open");
      window.dispatchEvent(new Event("ielts:overlay-closed"));
    }
    if (record.focus?.isConnected && !record.focus.closest("[inert]")) record.focus.focus({preventScroll:true});
  }
  function closeSheet(modal) {
    if (modal.hidden) return;
    const record = records.get(modal);
    if (record?.closing) return;
    if (record) record.closing = true;
    const card = modal.querySelector('[role="dialog"]');
    record?.animation?.cancel();
    const done = () => { modal.hidden = true; restore(modal); };
    if (!reduced.matches && card?.animate) {
      const animation = card.animate([{transform:"translateY(0)",opacity:1},{transform:"translateY(24px)",opacity:0}],{duration:200,easing:"ease-out"});
      if (record) record.animation = animation;
      animation.finished.catch(() => {}).finally(done);
    } else done();
  }
  sheets.forEach(modal => {
    new MutationObserver(() => modal.hidden ? restore(modal) : openSheet(modal)).observe(modal,{attributes:true,attributeFilter:["hidden"]});
    openSheet(modal);
  });
  document.addEventListener("keydown", event => {
    const modal = sheets.find(sheet => !sheet.hidden);
    if (!modal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      modal.querySelector(".support-close,.announcement-close")?.click();
    }
    if (event.key === "Tab") {
      const items = focusable(modal), first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  new MutationObserver(prepare).observe(document.querySelector("#view-root"),{childList:true,subtree:true});
  reduced.addEventListener("change", () => { if (reduced.matches) records.forEach((record, modal) => { record.animation?.cancel(); if (record.closing) { modal.hidden = true; restore(modal); } }); });
  prepare();
  window.IELTSIOS = {closeSheet};
})();
