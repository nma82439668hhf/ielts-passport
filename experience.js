(() => {
  'use strict';
  const root=document.documentElement, sample=window.IELTS_EXPERIENCE_WORD;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width:901px)');
  const stage=document.querySelector('.word-stage'),word=document.querySelector('#thread-word');
  const faces=[...stage.querySelectorAll('[data-face]')],points=[...document.querySelectorAll('[data-story-point]')];
  const tracks=[...stage.querySelectorAll('.stage-progress i')];
  const names=['遇见 book','理解词义','放进例句','确认理解','下次复习'];
  const captions=['同一个 book，从这里出发。','书；书籍。先理解这个名词义。',"That's Tom's book. 语境让意思明确。",'答题后，知道哪里已经理解。','带着同一个 book，进入下次复习。'];
  const nextLabels=['看词义','看例句','看反馈','看复习','亲自试一题'];
  const animations=new Set();
  let phase=0,frame=0,geometry=null,visible=!document.hidden,controller=null,revealObserver=null,sizeObserver=null;
  const ease='cubic-bezier(.16,1,.3,1)';
  function animate(element,frames,options={}) {
    if(reduced.matches||!visible||!element.animate)return null;
    const a=element.animate(frames,{duration:260,easing:ease,...options});
    animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;
  }
  function cancelAnimations(){for(const a of animations)a.cancel();animations.clear();}
  function setPhase(next,{motion=true}={}) {
    next=Math.max(0,Math.min(4,next));
    if(next===phase&&word.parentElement===faces[next].querySelector('.word-slot'))return;
    const from=word.getBoundingClientRect();
    cancelAnimations();
    faces[phase].hidden=true;faces[next].hidden=false;
    faces[next].querySelector('.word-slot').append(word);
    phase=next;stage.dataset.phase=String(phase);
    const to=word.getBoundingClientRect();
    if(motion&&from.width&&to.width){
      const limit=desktop.matches?500:40;
      const dx=Math.max(-limit,Math.min(limit,from.left-to.left));
      const dy=Math.max(-limit,Math.min(limit,from.top-to.top));
      animate(word,[{transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`},{transform:'none'}],{duration:desktop.matches?260:220});
    }
    tracks.forEach((el,i)=>el.classList.toggle('is-current',i===phase));
    document.querySelector('#story-caption').textContent=captions[phase];
    document.querySelector('#mobile-story-status').textContent=names[phase];
    document.querySelector('#story-previous').disabled=phase===0;
    document.querySelector('#story-next').textContent=nextLabels[phase];
  }
  function update(){
    frame=0;if(!geometry||!visible||!desktop.matches)return;
    const focus=scrollY+geometry.viewport*.35;
    let next=0;
    for(let i=0;i<geometry.centers.length-1;i++)if(focus>geometry.centers[i]+(geometry.centers[i+1]-geometry.centers[i])*.5)next=i+1;
    setPhase(next);
  }
  function schedule(){if(!frame&&visible)frame=requestAnimationFrame(update);}
  function measure(){
    const y=scrollY;
    geometry={viewport:window.visualViewport?.height||innerHeight,centers:points.map(el=>{const r=el.getBoundingClientRect();return r.top+y+r.height/2;})};
    schedule();
  }
  function setupReveal(){
    revealObserver?.disconnect();
    if(reduced.matches||!('IntersectionObserver' in window))return;
    revealObserver=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){
        animate(entry.target,[{opacity:.8,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:420});
        revealObserver.unobserve(entry.target);
      }
    },{threshold:.12});
    document.querySelectorAll('[data-reveal]').forEach(el=>revealObserver.observe(el));
  }
  function syncPicture(){
    const source=document.querySelector('[data-dark-source]');
    if(source)source.media=root.dataset.theme==='dark'?'all':'not all';
  }
  const question=document.querySelector('#demo-question'),definition=document.querySelector('#demo-definition');
  const options=[...document.querySelectorAll('[data-answer]')],result=document.querySelector('#demo-result');
  const questionTitle=document.querySelector('#demo-question-title'),feedback=document.querySelector('#demo-feedback');
  let answered=false;
  function resetQuestion(){
    answered=false;result.hidden=true;feedback.textContent='';delete feedback.dataset.correct;
    options.forEach((button,i)=>{button.textContent=sample.options[i];button.setAttribute('aria-pressed','false');button.removeAttribute('aria-disabled');delete button.dataset.result;});
  }
  function startQuestion(){
    resetQuestion();question.hidden=false;document.querySelector('#start-quiz').hidden=true;
    definition.open=false;definition.hidden=true;document.querySelector('.word-demo').dataset.step='question';
    questionTitle.focus({preventScroll:true});
  }
  function answer(index){
    if(answered)return;
    answered=true;
    options.forEach((button,i)=>{
      button.setAttribute('aria-disabled','true');button.setAttribute('aria-pressed',String(i===index));
      if(i===index){button.dataset.result=i===sample.correct?'correct':'wrong';button.textContent=sample.options[i]+(i===sample.correct?' · 回答正确':' · 已选，需再巩固');}
      else if(i===sample.correct){button.dataset.result='correct';button.textContent=sample.options[i]+' · 正确答案';}
    });
    result.hidden=false;
    feedback.dataset.correct=String(index===sample.correct);
    feedback.textContent=index===sample.correct?'回答正确。book 在这里是“一本书”。':'还差一点。正确答案是“一本书”。可以看看下面的解释，再答一次。';
    document.querySelector('#demo-explanation').open=true;
    animate(result,[{opacity:.7},{opacity:1}],{duration:160});
    feedback.scrollIntoView({block:'nearest',behavior:'instant'});
  }
  function install(){
    controller?.abort();controller=new AbortController();const signal=controller.signal;
    addEventListener('scroll',schedule,{passive:true,signal});addEventListener('resize',measure,{passive:true,signal});
    window.visualViewport?.addEventListener('resize',measure,{passive:true,signal});
    addEventListener('ielts:theme-change',syncPicture,{signal});
    reduced.addEventListener('change',()=>{cancelAnimations();setupReveal();setPhase(phase,{motion:false});measure();},{signal});
    desktop.addEventListener('change',()=>{cancelAnimations();measure();},{signal});
    document.addEventListener('visibilitychange',()=>{
      visible=!document.hidden;
      if(!visible){cancelAnimationFrame(frame);frame=0;cancelAnimations();}else measure();
    },{signal});
    document.querySelector('#story-previous').addEventListener('click',()=>setPhase(phase-1),{signal});
    document.querySelector('#story-next').addEventListener('click',()=>{if(phase===4){location.hash='try';return;}setPhase(phase+1);},{signal});
    document.querySelector('#start-quiz').addEventListener('click',startQuestion,{signal});
    options.forEach((button,i)=>button.addEventListener('click',()=>answer(i),{signal}));
    document.querySelector('#retry-quiz').addEventListener('click',()=>{resetQuestion();questionTitle.focus({preventScroll:true});questionTitle.scrollIntoView({block:'nearest',behavior:'instant'});},{signal});
    document.querySelector('#restart-demo').addEventListener('click',()=>{resetQuestion();question.hidden=true;definition.hidden=false;definition.open=false;delete document.querySelector('.word-demo').dataset.step;document.querySelector('#start-quiz').hidden=false;definition.querySelector('summary').focus({preventScroll:true});definition.querySelector('summary').scrollIntoView({block:'nearest',behavior:'instant'});},{signal});
    sizeObserver?.disconnect();if('ResizeObserver' in window){sizeObserver=new ResizeObserver(measure);sizeObserver.observe(document.querySelector('main'));}
    document.querySelectorAll('img').forEach(img=>img.addEventListener('load',measure,{once:true,signal}));
    setupReveal();syncPicture();measure();
  }
  document.querySelector('.mobile-story-controls').hidden=false;
  if(sample){document.querySelector('#start-quiz').hidden=false;document.querySelector('#demo-explanation p').textContent=sample.explanation;}
  install();document.fonts?.ready.then(measure);
  document.querySelectorAll('.line>span').forEach((el,i)=>animate(el,[{transform:'translateY(12px)'},{transform:'none'}],{duration:desktop.matches?620:280,delay:i*80}));
  animate(stage.querySelector('.word-visual'),[{opacity:.94,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:desktop.matches?520:280,delay:180});
  addEventListener('pagehide',()=>{controller?.abort();revealObserver?.disconnect();sizeObserver?.disconnect();cancelAnimationFrame(frame);frame=0;cancelAnimations();});
  addEventListener('pageshow',event=>{if(event.persisted)install();else measure();});
})();
