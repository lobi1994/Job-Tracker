/* Careerway – starts the app from the device cache.
 * App page: loaded fresh from the network first (no browser cache), device copy only when offline or slow.
 * Fonts: cached once. Calls to Google (your list) are never cached here. */
var CACHE = 'jt-shell-v47';
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
    // App-Seite: zuerst frisch aus dem Netz (ohne Browser-Cache), damit Updates sofort da sind.
    // Offline oder nach 4 s ohne Antwort: Version aus dem Gerät.
    e.respondWith(caches.open(CACHE).then(function (c) {
      var net = fetch(req.url, { cache: 'no-store' }).then(function (res) {
        if (res && res.ok) c.put('index.html', res.clone());
        return res;
      });
      var slow = new Promise(function (ok) { setTimeout(ok, 4000); }).then(function () { return c.match('index.html'); });
      return Promise.race([net.catch(function () { return c.match('index.html'); }), slow.then(function (hit) { return hit || net; })]);
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
