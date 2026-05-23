/**
 * JobNinja — Service Worker v1.0
 * 离线缓存：核心文件缓存后可离线打开查看简历和求职记录
 */
var CACHE_NAME = 'jobninja-v1.0.0-' + Date.now().toString(36);
var CORE_FILES = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/i18n.js',
  'js/resume.js',
  'js/job-search.js',
  'js/resume-tools.js',
  'js/resume-templates.js',
  'js/template-community.js',
  'js/job-tracker.js',
  'js/interview-exp.js',
  'js/industry-db.js',
  'js/channel.js',
  'js/evaluate.js',
  'js/interview.js',
  'js/settings.js',
  'manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_FILES).catch(function(err) {
        // 个别文件失败不影响整体
        console.warn('[SW] Cache install partial:', err.message);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;
  // 跳过CDN资源（由浏览器缓存处理）
  var url = event.request.url;
  if (url.indexOf('cdn.') !== -1 || url.indexOf('unpkg.') !== -1) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        return response;
      }).catch(function() {
        // 离线时返回空
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
