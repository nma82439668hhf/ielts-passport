(function () {
  "use strict";
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const root=document.querySelector("#view-root");
  const positions=new Map(),entered=new Set();
  const details=new Set(["lesson","reading","listening","writing","quiz","session"]);
  let previous=null,activeAnimations=[],ghost=null,lastAction="",tabFrame=0;
  const animate=(el,frames,options)=>{
    if(reduced.matches||!el||!el.animate)return null;
    const animation=el.animate(frames,options);activeAnimations.push(animation);
    animation.finished.catch(()=>{});return animation;
  };
  function cancel(){activeAnimations.forEach(a=>a.cancel());activeAnimations=[];if(ghost){ghost.remove();ghost=null;}}
  function tabKey(el,index){return (el.querySelector("button[data-action]")?.dataset.action||"tabs")+":"+index;}
  function tabState(group){const active=group.querySelector("button.is-active");if(!active)return null;return {x:active.offsetLeft,y:active.offsetTop,width:active.offsetWidth,height:active.offsetHeight};}
  function rememberTabs(){root.querySelectorAll(".seg,.section-tabs").forEach((group,i)=>{const value=tabState(group);if(value)positions.set(tabKey(group,i),value);});}
  function syncTabs(){
    root.querySelectorAll(".seg,.section-tabs").forEach((group,i)=>{
      if(!group.querySelector("button.is-active"))return;
      group.classList.add("motion-tabs");
      group.setAttribute("role","group");
      if(!group.hasAttribute("aria-label"))group.setAttribute("aria-label","选择栏目或学习阶段");
      group.querySelectorAll("button").forEach(button=>button.setAttribute("aria-pressed",String(button.classList.contains("is-active"))));
      let indicator=group.querySelector(":scope > .motion-tab-indicator");
      if(!indicator){indicator=document.createElement("span");indicator.className="motion-tab-indicator";indicator.setAttribute("aria-hidden","true");group.append(indicator);}
      const target=tabState(group),key=tabKey(group,i),old=positions.get(key);
      if(!target)return;
      indicator.style.width=target.width+"px";indicator.style.height=target.height+"px";indicator.style.transform=`translate(${target.x}px,${target.y}px)`;
      if(old&&(old.x!==target.x||old.y!==target.y||old.width!==target.width)){
        indicator.getAnimations().forEach(a=>a.cancel());
        animate(indicator,[{transform:`translate(${old.x}px,${old.y}px) scaleX(${old.width/target.width})`},{transform:`translate(${target.x}px,${target.y}px) scaleX(1)`}],{duration:230,easing:"cubic-bezier(.2,0,0,1)"});
      }
      positions.set(key,target);
    });
  }
  function scheduleTabs(){cancelAnimationFrame(tabFrame);tabFrame=requestAnimationFrame(syncTabs);}
  function snapshot(){
    const copy=root.cloneNode(true);copy.removeAttribute("id");copy.className="motion-ghost";copy.inert=true;copy.setAttribute("aria-hidden","true");
    [copy,...copy.querySelectorAll("*")].forEach(el=>{el.removeAttribute("id");el.removeAttribute("name");el.removeAttribute("aria-live");[...el.attributes].filter(a=>a.name.startsWith("data-")).forEach(a=>el.removeAttribute(a.name));if(el.matches("input,textarea,select,button"))el.disabled=true;});
    copy.style.width=root.clientWidth+"px";return copy;
  }
  function beforeRender(context){
    cancel();rememberTabs();
    const oldView=root.dataset.view,oldKey=root.dataset.contentKey;
    const changed=oldView&&oldView!==context.view;
    const nested=oldView===context.view&&context.key!==oldKey&&((context.view==="library")||lastAction==="open-library-item");
    const forward=(changed&&details.has(context.view))||(nested&&!!context.detail);
    const backward=(changed&&details.has(oldView)&&!details.has(context.view))||(nested&&!context.detail);
    const stateChange=["submit-session","check-answers","vocab-known","vocab-again","speak-next","account-mode","ai-send","ai-reset","set-ai-scenario"].includes(lastAction);
    const tabs=lastAction.startsWith("set-");
    let copy=null;
    if(oldView&&!reduced.matches&&(changed||nested||stateChange||tabs||context.result))copy=snapshot();
    const active=document.activeElement,focus=active&&root.contains(active)?{id:active.id,action:active.dataset.action,value:active.dataset.level||active.dataset.skill||active.dataset.tab||""}:null;
    const fields={};
    if(oldView===context.view)root.querySelectorAll(".ai-settings-content input,.ai-settings-content select,textarea[id]").forEach(el=>{fields[el.id]=el.value;});
    previous={...context,oldView,changed,nested,forward,backward,copy,focus,fields,action:lastAction};
    root.dataset.view=context.view;root.dataset.contentKey=context.key||"";lastAction="";
  }
  function stageList(){
    const elements=[...root.querySelectorAll(".study-row,.test-card,.module-card,.library-card,.review-item,.ai-scenario")].filter(el=>!el.closest(".motion-ghost")).slice(0,5);
    elements.forEach((el,i)=>animate(el,[{opacity:.25,transform:"translateY(8px)"},{opacity:1,transform:"translateY(0)"}],{duration:350,delay:i*40,easing:"cubic-bezier(.32,.72,0,1)",fill:"backwards"}));
  }
  function growChart(){
    root.querySelectorAll("[data-chart-bar]").forEach((el,i)=>{
      animate(el,[{transform:"scaleY(0)"},{transform:"scaleY(1)"}],{duration:520,delay:i*55,easing:"cubic-bezier(.16,1,.3,1)"});
      const number=el.closest(".skill-column")?.querySelector(".skill-value");
      animate(number,[{opacity:0,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:250,delay:160+i*55,easing:"ease-out",fill:"backwards"});
    });
  }
  function afterRender(){
    const p=previous||{};previous=null;
    Object.entries(p.fields||{}).forEach(([id,value])=>{const el=document.getElementById(id);if(el&&root.contains(el))el.value=value;});
    syncTabs();
    if(p.copy){
      ghost=p.copy;root.append(ghost);
      const distance=Math.min(96,root.clientWidth*.18),forward=p.forward,backward=p.backward;
      root.dataset.transition=forward?"forward":backward?"backward":"crossfade";
      const duration=forward||backward?350:200;
      animate(ghost,[{opacity:1,transform:"translateX(0)"},{opacity:0,transform:`translateX(${forward?-22:backward?distance:0}px)`}],{duration:Math.min(duration,210),easing:"ease-out",fill:"forwards"});
      [...root.children].filter(el=>el!==ghost).forEach(el=>animate(el,[{opacity:0,transform:`translateX(${forward?distance:backward?-22:0}px) scale(${forward?.99:1})`},{opacity:1,transform:"translateX(0) scale(1)"}],{duration,easing:"cubic-bezier(.32,.72,0,1)"}));
      const thisGhost=ghost;setTimeout(()=>{thisGhost.remove();if(ghost===thisGhost)ghost=null;},duration+20);
    }
    const view=root.dataset.view;
    if(!entered.has(view)){entered.add(view);if(!p.forward&&!p.backward)stageList();}
    if(view==="home"&&(!p.oldView||p.changed))growChart();
    if(p.focus&&p.oldView===view){
      let target=p.focus.id?document.getElementById(p.focus.id):null;
      if(!target&&p.focus.action)target=[...root.querySelectorAll("[data-action]")].find(el=>el.dataset.action===p.focus.action&&(el.dataset.level||el.dataset.skill||el.dataset.tab||"")===p.focus.value);
      if(target)target.focus({preventScroll:true});
    }else if(p.changed&&p.oldView){const heading=document.querySelector("#view-title");heading.tabIndex=-1;heading.focus({preventScroll:true});}
    const heading=root.querySelector("h2"),title=document.querySelector(".topbar-title");
    let scrollTitle=title.querySelector(".scroll-context");
    if(!scrollTitle){scrollTitle=document.createElement("span");scrollTitle.className="scroll-context";scrollTitle.setAttribute("aria-hidden","true");title.append(scrollTitle);}
    scrollTitle.textContent=heading?.textContent||document.querySelector("#view-title").textContent;
  }
  function ripple(button,event){
    if(button.disabled||reduced.matches)return;
    button.classList.add("motion-ripple-host");
    const rect=button.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*2;
    const span=document.createElement("span");span.className="motion-ripple";span.setAttribute("aria-hidden","true");span.style.width=span.style.height=size+"px";
    span.style.left=(event.clientX?event.clientX-rect.left:rect.width/2)-size/2+"px";span.style.top=(event.clientY?event.clientY-rect.top:rect.height/2)-size/2+"px";button.append(span);
    const wave=span.animate([{transform:"scale(0)",opacity:.22},{transform:"scale(1)",opacity:0}],{duration:420,easing:"ease-out"});wave.finished.catch(()=>{}).finally(()=>span.remove());
    button.getAnimations().filter(a=>a.effect?.target===button).forEach(a=>a.cancel());
    button.animate([{scale:"1"},{scale:".97",offset:.4},{scale:"1"}],{duration:180,easing:"ease-out"}).finished.catch(()=>{});
  }
  document.addEventListener("pointerdown",event=>{const button=event.target.closest("button,[role=button]");if(button&&event.button===0)ripple(button,event);},{capture:true});
  document.addEventListener("click",event=>{
    const target=event.target.closest("[data-action],[data-view]");lastAction=target?.dataset.action||"navigation";
    if(event.detail===0){const button=event.target.closest("button,[role=button]");if(button)ripple(button,event);}
    scheduleTabs();
  },{capture:true});
  const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches(".motion-tab-indicator,.motion-ripple,.motion-ghost"))))scheduleTabs();});observer.observe(root,{childList:true,subtree:true});
  new ResizeObserver(scheduleTabs).observe(root);
  const sentinel=document.createElement("span");sentinel.className="scroll-sentinel";sentinel.setAttribute("aria-hidden","true");root.before(sentinel);
  new IntersectionObserver(([entry])=>document.querySelector(".topbar").classList.toggle("is-compact",!entry.isIntersecting&&entry.boundingClientRect.top<0)).observe(sentinel);
  reduced.addEventListener("change",()=>{if(reduced.matches)cancel();syncTabs();});
  window.addEventListener("ielts:welcome-complete",()=>{stageList();growChart();});
  const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle("is-visible",entry.isIntersecting)));
  new MutationObserver(()=>document.querySelectorAll(".motion-skeleton:not([data-observed])").forEach(el=>{el.dataset.observed="1";visibility.observe(el);})).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("visibilitychange",()=>document.body.classList.toggle("page-hidden",document.hidden));
  window.IELTSMotion={beforeRender,afterRender,enhance:syncTabs,cancel,revealState(el){animate(el,[{opacity:.3,transform:"translateY(4px)"},{opacity:1,transform:"translateY(0)"}],{duration:210,easing:"ease-out"});},skeleton(label){return `<div class="motion-skeleton" role="status" aria-label="${label}" aria-busy="true"><span class="skeleton-line long" aria-hidden="true"></span><span class="skeleton-line" aria-hidden="true"></span><span class="skeleton-line short" aria-hidden="true"></span><span class="skeleton-caption">${label}</span></div>`;}};
})();
