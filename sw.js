
const CACHE_NAME='fl-standards-cache-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME&&caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(ASSETS.some(a=>url.pathname.endsWith(a.replace('./','/')))){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));return;
  }
  e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return resp;}).catch(()=>caches.match(e.request)));
});
