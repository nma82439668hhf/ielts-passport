(function () {
  "use strict";
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const root=document.querySelector("#view-root");
  const positions=new Map(),entered=new Set();
  const details=new Set(["lesson","reading","listening","writing","quiz","session"]);
  let previous=null,activeAnimations=[],lastAction="",lastOrigin=null,tabFrame=0;
  let capsuleLayer=null,capsuleFrame=0,capsuleTimers=[];
  const capsuleActions=new Set(["open-lesson","open-test","start-challenge","start-mock","start-review","resume-study","start-vocab-review","vocab-check","open-library-item"]);
  const animate=(el,frames,options)=>{
    if(reduced.matches||!el||!el.animate)return null;
    const animation=el.animate(frames,options);activeAnimations.push(animation);
    animation.finished.catch(()=>{});return animation;
  };
  function cancel(){
    activeAnimations.forEach(a=>a.cancel());activeAnimations=[];
    cancelAnimationFrame(capsuleFrame);capsuleFrame=0;
    capsuleTimers.forEach(clearTimeout);capsuleTimers=[];
    if(capsuleLayer){capsuleLayer.remove();capsuleLayer=null;}
    root.classList.remove("motion-reduced-reveal");
  }
  function visualCopy(element){
    // Freeze resolved layout before removing ID/data selectors. A clone must not
    // expose hidden toolbar controls or reflow text outside its original parent.
    const properties=["display","visibility","position","top","right","bottom","left","z-index","box-sizing","width","height","min-width","max-width","min-height","max-height","margin","padding","border","border-radius","outline","box-shadow","background","color","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","white-space","word-break","overflow-wrap","text-decoration","text-transform","flex","flex-direction","flex-wrap","align-items","align-self","justify-content","align-content","gap","grid-template-columns","grid-template-rows","grid-column","grid-row","overflow","opacity","transform","transform-origin","perspective","backface-visibility","object-fit","fill","stroke","stroke-width","filter","backdrop-filter","isolation"];
    const freeze=original=>{
      if(original.nodeType!==Node.ELEMENT_NODE)return original.cloneNode(true);
      if(original.matches("script,iframe,audio,video,.motion-ripple,.motion-ghost"))return null;
      const copy=original.cloneNode(false),style=getComputedStyle(original),rect=original.getBoundingClientRect();
      properties.forEach(property=>copy.style.setProperty(property,style.getPropertyValue(property)));
      copy.style.animation="none";copy.style.transition="none";copy.style.caretColor="transparent";
      ["id","name","autofocus","aria-live","aria-busy","aria-controls","aria-labelledby","aria-describedby","for"].forEach(attribute=>copy.removeAttribute(attribute));
      [...copy.attributes].filter(attribute=>attribute.name.startsWith("data-")).forEach(attribute=>copy.removeAttribute(attribute.name));
      if(copy.matches("button,a,input,textarea,select,[tabindex]"))copy.tabIndex=-1;
      if(copy.matches("input,textarea,select"))copy.value=original.value;
      // Offscreen branches keep their measured box but need no visual children.
      const visible=style.display!=="none"&&style.visibility!=="hidden"&&rect.right>0&&rect.left<innerWidth&&rect.bottom>0&&rect.top<innerHeight;
      if(visible)[...original.childNodes].forEach(child=>{const frozen=freeze(child);if(frozen)copy.append(frozen);});
      return copy;
    };
    const copy=freeze(element);
    copy.inert=true;copy.setAttribute("aria-hidden","true");return copy;
  }
  function sceneCopy(){
    const scene=document.createElement("div");scene.className="motion-capsule-scene";scene.inert=true;scene.setAttribute("aria-hidden","true");
    // Freeze visible surfaces at their real geometry. Text stays at its original
    // size while the container opens, rather than stretching a page screenshot.
    [root,document.querySelector(".topbar"),document.querySelector(".sidebar"),document.querySelector(".mobile-bottom-nav"),document.querySelector(".footer")].forEach(element=>{
      if(!element)return;
      const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
      if(style.display==="none"||style.visibility==="hidden"||rect.right<=0||rect.left>=innerWidth||rect.bottom<=0||rect.top>=innerHeight)return;
      const copy=visualCopy(element);
      Object.assign(copy.style,{position:"absolute",left:rect.left+"px",top:rect.top+"px",right:"auto",bottom:"auto",width:rect.width+"px",height:rect.height+"px",maxWidth:"none",minHeight:"0",margin:"0",transform:"none",boxSizing:"border-box"});
      scene.append(copy);
    });
    return scene;
  }
  function captureOrigin(target){
    if(!target||target.disabled||target.dataset.motion==="none")return null;
    const action=target.dataset.action||"",back=target.dataset.motion==="back"||target.matches(".back-btn")||!!target.querySelector('.lucide-arrow-left,[data-lucide="arrow-left"]');
    if(!back&&target.dataset.motion!=="capsule"&&!target.hasAttribute("data-view")&&!capsuleActions.has(action))return null;
    const eligible=target.dataset.motion==="capsule"||capsuleActions.has(action)||(root.dataset.view==="home"&&target.dataset.view==="vocab"&&!!target.closest(".primary-task"));
    const source=eligible?target.closest(".primary-task,.test-card,.module-card,.library-card,.study-row,.exam-start,.vocab-complete,.exam-result,.review-item,.panel")||target:target;
    const rect=source.getBoundingClientRect();
    if(rect.width<1||rect.height<1||rect.right<=0||rect.bottom<=0||rect.left>=innerWidth||rect.top>=innerHeight)return null;
    const style=getComputedStyle(source),copy=eligible?visualCopy(source):null;
    return {left:Math.max(0,rect.left),top:Math.max(0,rect.top),right:Math.min(innerWidth,rect.right),bottom:Math.min(innerHeight,rect.bottom),seedRect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},radius:Math.min(20,rect.height/2,parseFloat(style.borderTopLeftRadius)||20),background:style.backgroundColor,copy,back,eligible,time:performance.now()};
  }
  function clip(rect,radius){return `inset(${rect.top}px ${innerWidth-rect.right}px ${innerHeight-rect.bottom}px ${rect.left}px round ${radius}px)`;}
  function prepareCapsule(origin){
    const layer=document.createElement("div");layer.className="motion-capsule";layer.inert=true;layer.setAttribute("aria-hidden","true");
    const outgoing=sceneCopy();outgoing.classList.add("motion-capsule-outgoing");layer.append(outgoing);
    const surface=document.createElement("div");surface.className="motion-capsule-surface";surface.style.clipPath=clip(origin,origin.radius);surface.style.backgroundColor=origin.background;layer.append(surface);
    const seed=origin.copy;seed.classList.add("motion-capsule-seed");
    // The mask is clipped to the viewport; the source itself keeps its raw box.
    // Scrolled cards may begin above the screen without moving their contents.
    const seedRect=origin.seedRect;
    Object.assign(seed.style,{position:"absolute",left:seedRect.left+"px",top:seedRect.top+"px",width:seedRect.width+"px",height:seedRect.height+"px",minHeight:"0",maxWidth:"none",margin:"0",transform:"none",boxSizing:"border-box",borderRadius:origin.radius+"px"});
    surface.append(seed);document.body.append(layer);capsuleLayer=layer;
    const burst={left:Math.max(0,origin.left-32),top:Math.max(0,origin.top-24),right:Math.min(innerWidth,origin.right+32),bottom:Math.min(innerHeight,origin.bottom+24)};
    const geometry={from:{left:origin.left,top:origin.top,right:origin.right,bottom:origin.bottom,radius:origin.radius},burst:{...burst,radius:20},to:{left:0,top:0,right:innerWidth,bottom:innerHeight,radius:0},burstMs:90,expandMs:350,settleMs:140,duration:580};
    layer.dataset.geometry=JSON.stringify(geometry);layer.dataset.phase="burst";root.dataset.motionGeometry=layer.dataset.geometry;
    return {layer,surface,outgoing,seed,origin,burst,geometry};
  }
  function openCapsule(capsule){
    const {layer,surface,outgoing,seed,origin,burst,geometry}=capsule;
    root.dataset.motionTransition="capsule";
    // The application has already rendered and scrolled synchronously. Capturing
    // on the next frame gives the new scene its final responsive layout.
    capsuleFrame=requestAnimationFrame(()=>{
      capsuleFrame=0;if(capsuleLayer!==layer)return;
      const incoming=sceneCopy();incoming.classList.add("motion-capsule-incoming");surface.prepend(incoming);
      animate(surface,[
        {clipPath:clip(origin,origin.radius),easing:"cubic-bezier(.12,.8,.2,1)"},
        {clipPath:clip(burst,20),offset:90/440,easing:"cubic-bezier(.2,.72,.18,1)"},
        {clipPath:"inset(0px 0px 0px 0px round 0px)"}
      ],{duration:440,fill:"forwards"});
      animate(seed,[{opacity:1},{opacity:1,offset:.25},{opacity:0}],{duration:240,fill:"forwards",easing:"ease-out"});
      animate(incoming,[{opacity:0},{opacity:1}],{duration:260,delay:90,fill:"backwards",easing:"ease-out"});
      animate(outgoing,[{opacity:1},{opacity:0}],{duration:90,delay:350,fill:"forwards",easing:"ease-out"});
      animate(layer,[{opacity:1},{opacity:0}],{duration:140,delay:440,fill:"forwards",easing:"ease-out"});
      capsuleTimers.push(setTimeout(()=>{if(capsuleLayer===layer)layer.dataset.phase="expand";},90));
      capsuleTimers.push(setTimeout(()=>{if(capsuleLayer===layer){layer.dataset.phase="settle";surface.style.clipPath="inset(0px 0px 0px 0px round 0px)";}},440));
      capsuleTimers.push(setTimeout(()=>{if(capsuleLayer===layer){layer.remove();capsuleLayer=null;capsuleTimers=[];}},geometry.duration+20));
    });
  }
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
  function beforeRender(context){
    const origin=lastOrigin;lastOrigin=null;
    cancel();rememberTabs();
    const oldView=root.dataset.view,oldKey=root.dataset.contentKey;
    const changed=oldView&&oldView!==context.view;
    const nested=oldView===context.view&&context.key!==oldKey&&((context.view==="library")||lastAction==="open-library-item");
    const forward=(changed&&details.has(context.view))||(nested&&!!context.detail);
    const backward=(changed&&details.has(oldView)&&!details.has(context.view))||(nested&&!context.detail)||(origin?.back&&(changed||nested));
    const wordChange=["vocab-known","vocab-again"].includes(lastAction);
    const stateChange=["submit-session","check-answers","account-mode","ai-reset","set-ai-scenario"].includes(lastAction);
    const tabs=lastAction.startsWith("set-");
    const capsule=oldView&&!reduced.matches&&!backward&&(changed||nested)&&origin?.eligible&&performance.now()-origin.time<1200?prepareCapsule(origin):null;
    const fade=!capsule&&oldView&&!reduced.matches&&(changed||nested||stateChange||tabs||context.result);
    const active=document.activeElement,focus=active&&root.contains(active)?{id:active.id,action:active.dataset.action,value:active.dataset.level||active.dataset.skill||active.dataset.tab||""}:null;
    const fields={};
    if(oldView===context.view)root.querySelectorAll(".ai-settings-content input,.ai-settings-content select,textarea[id]").forEach(el=>{fields[el.id]=el.value;});
    previous={...context,oldView,changed,nested,forward,backward,fade,wordChange,capsule,focus,fields,action:lastAction};
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
    root.dataset.motionTransition=p.capsule?"capsule":p.backward?"back":p.changed?"fade":"state";
    if(p.capsule){
      root.dataset.transition=p.forward?"forward":"crossfade";
      openCapsule(p.capsule);
    }else if(p.wordChange){
      root.dataset.transition="state";
      animate(root.querySelector(".flash-card"),[{opacity:.86},{opacity:1}],{duration:110,easing:"ease-out"});
    }else if(p.fade){
      root.dataset.transition=p.forward?"forward":p.backward?"backward":"crossfade";
      // Opacity never establishes a containing block for the fixed decision dock.
      animate(root,[{opacity:.82},{opacity:1}],{duration:p.backward?120:160,easing:"ease-out"});
    }else if(reduced.matches&&p.oldView&&(p.changed||p.nested)){
      root.classList.add("motion-reduced-reveal");
    }
    const view=root.dataset.view;
    if(!entered.has(view)){entered.add(view);if(!p.oldView)stageList();}
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
  document.addEventListener("pointerdown",event=>{if(capsuleLayer)cancel();const button=event.target.closest("button,[role=button]");if(button&&event.button===0)ripple(button,event);},{capture:true});
  document.addEventListener("click",event=>{
    if(capsuleLayer)cancel();
    const target=event.target.closest("[data-action],[data-view]");lastAction=target?.dataset.action||"navigation";lastOrigin=captureOrigin(target);
    if(event.detail===0){const button=event.target.closest("button,[role=button]");if(button)ripple(button,event);}
    scheduleTabs();
  },{capture:true});
  const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches(".motion-tab-indicator,.motion-ripple,.motion-ghost"))))scheduleTabs();});observer.observe(root,{childList:true,subtree:true});
  new ResizeObserver(scheduleTabs).observe(root);
  window.addEventListener("resize",()=>{if(capsuleLayer)cancel();scheduleTabs();});
  document.addEventListener("keydown",()=>{if(capsuleLayer)cancel();},{capture:true});
  window.addEventListener("wheel",()=>{if(capsuleLayer)cancel();},{passive:true});
  window.addEventListener("touchmove",()=>{if(capsuleLayer)cancel();},{passive:true});
  const sentinel=document.createElement("span");sentinel.className="scroll-sentinel";sentinel.setAttribute("aria-hidden","true");root.before(sentinel);
  new IntersectionObserver(([entry])=>document.querySelector(".topbar").classList.toggle("is-compact",!entry.isIntersecting&&entry.boundingClientRect.top<0)).observe(sentinel);
  reduced.addEventListener("change",()=>{if(reduced.matches)cancel();syncTabs();});
  window.addEventListener("ielts:welcome-complete",()=>{stageList();growChart();});
  const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle("is-visible",entry.isIntersecting)));
  new MutationObserver(()=>document.querySelectorAll(".motion-skeleton:not([data-observed])").forEach(el=>{el.dataset.observed="1";visibility.observe(el);})).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("visibilitychange",()=>{document.body.classList.toggle("page-hidden",document.hidden);if(document.hidden)cancel();});
  window.IELTSMotion={beforeRender,afterRender,enhance:syncTabs,cancel,revealState(el){animate(el,[{opacity:.3,transform:"translateY(4px)"},{opacity:1,transform:"translateY(0)"}],{duration:210,easing:"ease-out"});},skeleton(label){return `<div class="motion-skeleton" role="status" aria-label="${label}" aria-busy="true"><span class="skeleton-line long" aria-hidden="true"></span><span class="skeleton-line" aria-hidden="true"></span><span class="skeleton-line short" aria-hidden="true"></span><span class="skeleton-caption">${label}</span></div>`;}};
})();
