
const CACHE='kidvision-v1269';
const ASSETS=['./','./index.html','./app.js','./styles.css','./manifest.webmanifest','./icon-192.png','./icon-512.png','./owner_login.html','./owner.js','./standards.v1271.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;}).catch(()=>caches.match(e.request)));
});
