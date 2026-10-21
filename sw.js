const CACHE_NAME = 'ielts-passport-responsive-web-v4';
const APP_SHELL = [
 './','./index.html','./experience.html','./experience.css','./experience.js','./experience-word.js',
 './styles.css','./design.css','./motion.css','./study-panel.css','./theme.css','./theme.js','./ios.css','./ios.js',
 './motion.js','./shell.js','./welcome-bootstrap.js','./study-panel.js','./app.js','./bank-loader.js','./offline.js','./hybrid-update.js',
 './version.json','./manifest.webmanifest','./favicon.svg','./assets/vega-support.jpg','./icons/icon-192.png','./icons/icon-512.png',
 './vendor/lucide-study.js','./data/learn.js','./data/vocab-index.js','./data/sources.js','./data/vocab-meta.js',
 './data/version.js','./data/cloud-config.js','./data/changelog.js','./data/remote-version.js'
];
const BANK_FILES=['A1','A2','B1','B2','C1'].map(level=>'./data/vocab/'+level+'.js').concat(
 ['vocab-quiz','staged','library','grammar','reading','listening','writing','speaking'].map(name=>'./data/'+name+'.js')
);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME),oldKeys=(await caches.keys()).filter(key=>key.startsWith('ielts-passport-')&&key!==CACHE_NAME);
 for(const key of oldKeys){
  const old=await caches.open(key);
  for(const request of await old.keys()){
   if(/\/data\/(?:dict\/|vocab\/|(?:vocab-quiz|staged|library|grammar|reading|listening|writing|speaking)\.js$)|\/assets\/experience\//.test(new URL(request.url).pathname)){
    if(!await cache.match(request)){const response=await old.match(request);if(response)await cache.put(request,response);}
   }
  }
  const legacy=await old.match(new URL('./data/vocab-levels.js',self.location).href);
  if(legacy){
   try{
    const text=await legacy.text(),prefix='window.IELTS_BANK.vocabLevels = ',start=text.indexOf(prefix);
    if(start>=0){
     const levels=JSON.parse(text.slice(start+prefix.length).trim().replace(/;\s*$/,''));
     for(const [level,items] of Object.entries(levels))if(['A1','A2','B1','B2','C1'].includes(level)){
      const url=new URL('./data/vocab/'+level+'.js',self.location).href;
      if(!await cache.match(url))await cache.put(url,new Response('window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.vocabLevels = window.IELTS_BANK.vocabLevels || {};\nwindow.IELTS_BANK.vocabLevels['+JSON.stringify(level)+'] = '+JSON.stringify(items)+';\n',{headers:{'Content-Type':'text/javascript; charset=utf-8'}}));
     }
    }
   }catch(_){/* An invalid old cache is never treated as a completed offline bank. */}
  }
 }
 for(const key of oldKeys)await caches.delete(key);
 await self.clients.claim();
})()));
async function bankStatus(){const cache=await caches.open(CACHE_NAME);let completed=0;for(const file of BANK_FILES)if(await cache.match(file))completed++;return {completed,total:BANK_FILES.length,ready:completed===BANK_FILES.length};}
let preparation=null;const ports=new Set();
function broadcast(message){for(const port of ports){try{port.postMessage(message);}catch(_){ports.delete(port);}}}
self.addEventListener('message',event=>{
 const port=event.ports[0];if(!port)return;
 if(event.data?.type==='offline-status'){event.waitUntil(bankStatus().then(status=>port.postMessage({type:'status',...status})));return;}
 if(event.data?.type!=='prepare-banks')return;
 ports.add(port);
 if(!preparation)preparation=(async()=>{
  const cache=await caches.open(CACHE_NAME);
  for(const file of BANK_FILES){
   if(!await cache.match(file)){
    const response=await fetch(new URL(file,self.location));if(!response.ok)throw Error('Bank unavailable');await cache.put(file,response);
   }
   broadcast({type:'progress',...await bankStatus()});
  }
  broadcast({type:'complete',...await bankStatus()});
 })().catch(async()=>broadcast({type:'error',...await bankStatus()})).finally(()=>{preparation=null;ports.clear();});
 event.waitUntil(preparation);
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 const networkFirst=request.mode==='navigate'||/(?:experience(?:-word)?\.(?:html|css|js)|app\.js|bank-loader\.js|offline\.js|lucide-study\.js|styles\.css|design\.css|motion\.(?:css|js)|theme\.(?:css|js)|ios\.(?:css|js)|study-panel\.(?:css|js)|shell\.js|welcome-bootstrap\.js|index\.html|manifest\.webmanifest|sw\.js|version\.json|data\/(?:vocab-index|cloud-config|changelog|version|remote-version)\.js)$/.test(url.pathname);
 if(networkFirst){
  event.respondWith(fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}return response;}).catch(async()=>await caches.match(request)||(request.mode==='navigate'?await caches.match('./index.html'):Response.error())));return;
 }
 event.respondWith((async()=>{
  const cached=await caches.match(request);
  const network=fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}return response;}).catch(()=>cached||Response.error());
  if(cached){event.waitUntil(network);return cached;}return network;
 })());
});
