"use strict";

// bingo.html のみをキャッシュ対象とする（撮影画像はIndexedDB側で管理するためキャッシュ不要）
var CACHE_NAME = "bingo-cache-v3";
var CACHE_URL = "./bingo.html";

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll([CACHE_URL]); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names
          .filter(function(name){ return name !== CACHE_NAME; })
          .map(function(name){ return caches.delete(name); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  if (event.request.url.indexOf("bingo.html") === -1) return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if (response && response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        }
        return response;
      }).catch(function(){ return cached; });

      // オフライン時はキャッシュ、オンライン時は最新を取得しつつキャッシュも更新する
      return cached || networkFetch;
    })
  );
});
