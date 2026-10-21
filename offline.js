(() => {
 'use strict';
 const supported='serviceWorker' in navigator&&/^https?:$/.test(location.protocol);
 const state={completed:0,total:13,ready:false,preparing:false,error:false,checked:false,unavailable:false};
 function message(){
  if(!supported)return location.protocol==='file:'?'直接打开本地文件时，题库从本机读取。HTTP 或安装后的网页可准备离线题库。':'当前浏览器未提供离线准备功能。';
  if(state.unavailable)return '离线功能暂不可用，请检查浏览器对离线存储的设置后重试。在线学习仍可使用。';
  if(state.error)return `准备未完成，已缓存 ${state.completed} / ${state.total} 份题库。已准备内容仍可离线使用，请联网重试。`;
  if(state.ready)return '全部题库已准备，可离线学习词汇和题目。不包含在线发音、云同步及未访问的词典分片。';
  if(state.preparing)return `正在准备 ${state.completed} / ${state.total} 份题库。准备期间可以继续学习。`;
  return '已打开的学习内容会保留供离线使用。需要离线使用全部题库时，可主动准备约 2.2 MB 数据。';
 }
 function label(){return state.ready?'全部题库已准备':state.preparing?'正在准备…':state.error?'重试离线准备':'准备全部题库';}
 function update(){
  const status=document.querySelector('#offline-status'),button=document.querySelector('[data-offline-prepare]'),progress=document.querySelector('#offline-progress');
  if(status)status.textContent=message();
  if(button){button.textContent=label();button.setAttribute('aria-disabled',String(!supported||state.preparing||state.ready));}
  if(progress){progress.max=state.total;progress.value=state.completed;progress.hidden=!state.preparing&&!state.ready&&!state.error;}
 }
 function connect(type,retryRegistration=false){
  return new Promise((resolve,reject)=>{
   let settled=false,channel=null,timer=null,worker=null,changed=null;
   const finish=(error,data)=>{
    if(settled)return;settled=true;clearTimeout(timer);channel?.port1.close();
    if(worker&&changed)worker.removeEventListener('statechange',changed);
    if(error)reject(error);else resolve(data);
   };
   const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>finish(Error('Offline preparation timed out')),type==='offline-status'?10000:120000);};
   arm();
   Promise.resolve().then(async()=>{
    if(retryRegistration){await navigator.serviceWorker.register('sw.js');if(settled)return null;state.unavailable=false;}
    return navigator.serviceWorker.ready;
   }).then(registration=>{
    if(settled)return;worker=registration.active;if(!worker){finish(Error('No active worker'));return;}
    const send=()=>{
     if(settled)return;
     channel=new MessageChannel();
     channel.port1.onmessage=event=>{
      if(settled)return;
      const data=event.data;Object.assign(state,{completed:data.completed,total:data.total,ready:data.ready,checked:true,unavailable:false});update();arm();
      if(['status','complete','error'].includes(data.type))finish(data.type==='error'?Error('Offline data unavailable'):null,data);
     };
     worker.postMessage({type},[channel.port2]);
    };
    changed=()=>{if(worker.state==='activated'){worker.removeEventListener('statechange',changed);send();}else if(worker.state==='redundant')finish(Error('Worker replaced'));};
    if(worker.state==='activated')send();else{worker.addEventListener('statechange',changed);changed();}
   }).catch(error=>finish(error));
  });
 }
 async function prepare(){
  if(!supported||state.preparing||state.ready)return;
  state.preparing=true;state.error=false;update();
  try{
   await connect('prepare-banks',state.unavailable);
  }catch(_){state.error=true;}finally{state.preparing=false;update();}
 }
 window.IELTSOffline={prepare,status:state,registrationFailed(){state.unavailable=true;state.error=true;state.preparing=false;update();},markup:()=>`<section class="panel settings-card offline-card" aria-labelledby="offline-title"><h3 id="offline-title">离线学习</h3><p id="offline-status" role="status" aria-live="polite">${message()}</p><progress id="offline-progress" aria-label="离线题库准备进度" max="${state.total}" value="${state.completed}" ${state.preparing||state.ready||state.error?'':'hidden'}></progress><button class="btn ghost" type="button" data-offline-prepare aria-disabled="${!supported||state.preparing||state.ready}">${label()}</button></section>`};
 document.addEventListener('click',event=>{if(event.target.closest('[data-offline-prepare]'))prepare();});
 if(supported){connect('offline-status').catch(()=>{});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!state.preparing)connect('offline-status').catch(()=>{});});}
})();
