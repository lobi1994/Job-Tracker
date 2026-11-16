/* Careerway – starts the app from the device cache.
 * App page: fresh from the network when it answers within 0.7 s, otherwise the device copy at once
 * (the page is told when a newer version arrived and reloads itself).
 * Fonts: cached once. Calls to Google (your list) are never cached here. */
var CACHE = 'jt-shell-v59';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-32.png', 'icons/logo.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin && req.mode === 'navigate') {
    // App-Seite: frisch aus dem Netz, wenn es schnell antwortet (dann ist nie eine alte Version zu sehen).
    // Braucht das Netz länger als 0,7 s oder fehlt es: sofort die Version aus dem Gerät zeigen, im Hintergrund
    // weiterladen und der Seite Bescheid geben, falls es eine neuere Version gibt (sie lädt sich dann selbst neu).
    e.respondWith(caches.open(CACHE).then(function (c) {
      var served = '';
      var net = fetch(req.url, { cache: 'no-store' }).then(function (res) {
        if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status)); // Serverfehler wie „kein Netz“ behandeln
        var fresh = res.clone();
        var job = Promise.all([c.match('index.html').then(function (old) { return old ? old.text() : ''; }), res.clone().text()]).then(function (t) {
          return c.put('index.html', fresh).then(function () {
            if (served === 'cache' && t[0] && t[0] !== t[1]) {
              return self.clients.matchAll({ type: 'window' }).then(function (cl) { cl.forEach(function (w) { w.postMessage('jt-update'); }); });
            }
          });
        });
        e.waitUntil(job.catch(function () {}));
        return res;
      });
      var fromCache = function () { return c.match('index.html').then(function (hit) { if (hit) served = 'cache'; return hit; }); };
      var slow = new Promise(function (ok) { setTimeout(ok, 700); }).then(fromCache);
      return Promise.race([
        net.then(function (res) { if (served !== 'cache') served = 'net'; return res; }).catch(function () { return fromCache().then(function (hit) { return hit || fetch(req); }); }),
        slow.then(function (hit) { return hit || net.catch(function () { return fetch(req); }); })
      ]);
    }));
    return;
  }

  if (url.origin === self.location.origin) {
    var key = req;
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(key).then(function (hit) {
        var net = fetch(req, { cache: 'no-cache' }).then(function (res) {
          if (res && res.ok) c.put(key, res.clone());
          return res;
        }).catch(function () { return hit; });
        if (hit) { e.waitUntil(net); return hit; }
        return net;
      });
    }));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; });
      });
    }));
  }
});
