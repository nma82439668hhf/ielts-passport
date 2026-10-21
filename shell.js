(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const menu = $("#shell-menu");
  const sidebar = $("#sidebar");
  const mobile = window.matchMedia("(max-width: 1020px)");
  function syncMenu() {
    const blocked = document.body.classList.contains("ios-sheet-open") || !!$("#welcome-screen:not([hidden]):not(.is-leaving)");
    sidebar.inert = blocked || (mobile.matches && !document.body.classList.contains("sidebar-open"));
    [$("main"), $("#mobile-bottom-nav")].forEach(el => {el.inert = blocked || (mobile.matches && document.body.classList.contains("sidebar-open"));});
  }
  menu.addEventListener("click", () => {
    const open = document.body.classList.toggle("sidebar-open");
    menu.setAttribute("aria-expanded", String(open));
    syncMenu();
    if (open) ($(".nav-item.is-active") || $(".nav-item")).focus();
  });
  const closeMenu = () => {
    document.body.classList.remove("sidebar-open");
    menu.setAttribute("aria-expanded", "false");
    syncMenu();
  };
  $("#shell-close-menu").addEventListener("click", () => { closeMenu(); menu.focus(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) { closeMenu(); menu.focus(); }
  });
  $("#scrim").addEventListener("click", closeMenu);
  $("#sidebar").addEventListener("click", event => { if (event.target.closest("[data-view]") && mobile.matches) {closeMenu();$("#view-title").setAttribute("tabindex","-1");$("#view-title").focus();} });
  mobile.addEventListener("change", () => {
    const active = document.activeElement;
    closeMenu();
    if (document.body.classList.contains("ios-sheet-open")) return;
    if (mobile.matches && sidebar.contains(active)) menu.focus();
    else if (!mobile.matches && (active === menu || active === $("#shell-close-menu"))) ($(".nav-item.is-active") || $(".nav-item")).focus();
  });
  window.addEventListener("ielts:overlay-closed", syncMenu);
  sidebar.addEventListener("keydown", event => {
    if (event.key !== "Tab" || !mobile.matches) return;
    const focusable=[...sidebar.querySelectorAll('button,a[href],input,summary')].filter(el=>el.getClientRects().length&&!el.disabled);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  syncMenu();
  $("#shell-date").textContent = new Intl.DateTimeFormat("zh-CN", {month:"long",day:"numeric",weekday:"long"}).format(new Date());
  // Make the existing non-button practice cards keyboard-operable in the workbench.
  function prepareView() {
    document.querySelectorAll("#view-root [data-action]:not(button):not(a):not(input):not(textarea):not(select)").forEach(el => {
      if (el.closest("[data-action]") !== el || el.matches(".lookup-word,.speakable")) return;
      el.setAttribute("role", "button");
      el.tabIndex = 0;
    });
    document.querySelectorAll("#view-root input:not([name]), #view-root textarea:not([name])").forEach(el => {if(el.id) el.name=el.id;});
    const active = $(".nav-item.is-active");
    document.querySelectorAll(".nav-item").forEach(el => el.removeAttribute("aria-current"));
    if (active) active.setAttribute("aria-current", "page");
  }
  $("#view-root").addEventListener("keydown", event => {
    const el = event.target.closest('[role="button"][data-action]');
    if (el && event.target === el && (event.key === "Enter" || event.key === " ")) {event.preventDefault(); el.click();}
  });
  new MutationObserver(prepareView).observe($("#view-root"), {childList: true});
  prepareView();

  const welcome = $("#welcome-screen");
  if (!window.IELTS_FIRST_VISIT) { welcome.remove(); return; }
  const appSurfaces = [$("#sidebar"), $("main"), $("#mobile-bottom-nav")];
  appSurfaces.forEach(el => {el.inert=true;});
  welcome.hidden=false;
  const enter = $("#welcome-enter");
  enter.focus({preventScroll:true});
  let finished = false;
  let autoExit;
  function finish() {
    if (finished) return;
    finished=true;
    clearTimeout(autoExit);
    try {localStorage.setItem("ielts_welcome_completed", "1");localStorage.removeItem("ielts_welcome_pending");} catch (_) {}
    welcome.classList.add("is-leaving");
    document.documentElement.classList.remove("welcome-pending");
    appSurfaces.forEach(el => {el.inert=false;});
    syncMenu();
    const focusTarget = $("#view-title");
    focusTarget.setAttribute("tabindex", "-1");
    focusTarget.focus({preventScroll:true});
    window.setTimeout(() => {welcome.remove();window.dispatchEvent(new Event("ielts:welcome-complete"));}, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300);
  }
  enter.addEventListener("click", finish);
  $("#welcome-skip").addEventListener("click", finish);
  welcome.addEventListener("keydown", event => {
    if(event.key === "Escape") finish();
    if(event.key === "Tab") {
      const first = $("#welcome-skip"), last = enter;
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) autoExit=window.setTimeout(finish, 3600);
})();
