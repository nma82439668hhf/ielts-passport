const markDesktop = () => { document.documentElement.dataset.desktopApp = "true"; };
if (document.documentElement) markDesktop();
else window.addEventListener("DOMContentLoaded", markDesktop, {once: true});
