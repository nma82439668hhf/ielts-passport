(function () {
  "use strict";
  let firstVisit=false;
  try {
    const completed=localStorage.getItem("ielts_welcome_completed")||localStorage.getItem("ielts_demo_welcome_completed");
    firstVisit=!completed&&(localStorage.getItem("ielts_welcome_pending")==="1"||(!localStorage.getItem("ielts_passport_v1")&&!localStorage.getItem("ielts_account_session")));
    if(firstVisit)localStorage.setItem("ielts_welcome_pending","1");
  }catch(_){firstVisit=true;}
  window.IELTS_FIRST_VISIT=firstVisit;
  if(firstVisit)document.documentElement.classList.add("welcome-pending");
})();
