/**
 * sw.js — Service worker: hace que Forja abra sin internet.
 *
 * Estrategia "stale-while-revalidate": responde al instante con lo guardado y,
 * por detrás, descarga la versión nueva para la próxima vez que abras la app.
 * Al publicar cambios grandes, sube el número de CACHE para limpiar lo viejo.
 */
const CACHE = 'forja-v2';
const ARCHIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/datos.js',
  'js/rutina.js',
  'js/calculos.js',
  'js/formato.js',
  'js/graficas.js',
  'js/iconos.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  // Fotos de técnica (inicio y final de cada ejercicio).
  'img/ejercicios/abductora-0.jpg',
  'img/ejercicios/abductora-1.jpg',
  'img/ejercicios/curl-barra-0.jpg',
  'img/ejercicios/curl-barra-1.jpg',
  'img/ejercicios/curl-biceps-0.jpg',
  'img/ejercicios/curl-biceps-1.jpg',
  'img/ejercicios/curl-martillo-0.jpg',
  'img/ejercicios/curl-martillo-1.jpg',
  'img/ejercicios/curl-predicador-0.jpg',
  'img/ejercicios/curl-predicador-1.jpg',
  'img/ejercicios/elevaciones-laterales-0.jpg',
  'img/ejercicios/elevaciones-laterales-1.jpg',
  'img/ejercicios/extension-cuadriceps-0.jpg',
  'img/ejercicios/extension-cuadriceps-1.jpg',
  'img/ejercicios/extension-triceps-cabeza-0.jpg',
  'img/ejercicios/extension-triceps-cabeza-1.jpg',
  'img/ejercicios/face-pull-0.jpg',
  'img/ejercicios/face-pull-1.jpg',
  'img/ejercicios/femoral-acostado-0.jpg',
  'img/ejercicios/femoral-acostado-1.jpg',
  'img/ejercicios/hack-squat-0.jpg',
  'img/ejercicios/hack-squat-1.jpg',
  'img/ejercicios/hip-thrust-0.jpg',
  'img/ejercicios/hip-thrust-1.jpg',
  'img/ejercicios/jalon-polea-alta-0.jpg',
  'img/ejercicios/jalon-polea-alta-1.jpg',
  'img/ejercicios/pantorrillas-0.jpg',
  'img/ejercicios/pantorrillas-1.jpg',
  'img/ejercicios/pec-deck-0.jpg',
  'img/ejercicios/pec-deck-1.jpg',
  'img/ejercicios/prensa-0.jpg',
  'img/ejercicios/prensa-1.jpg',
  'img/ejercicios/press-banca-barra-0.jpg',
  'img/ejercicios/press-banca-barra-1.jpg',
  'img/ejercicios/press-hombro-mancuernas-0.jpg',
  'img/ejercicios/press-hombro-mancuernas-1.jpg',
  'img/ejercicios/press-inclinado-barra-0.jpg',
  'img/ejercicios/press-inclinado-barra-1.jpg',
  'img/ejercicios/press-inclinado-mancuernas-0.jpg',
  'img/ejercicios/press-inclinado-mancuernas-1.jpg',
  'img/ejercicios/remo-mancuerna-0.jpg',
  'img/ejercicios/remo-mancuerna-1.jpg',
  'img/ejercicios/remo-polea-0.jpg',
  'img/ejercicios/remo-polea-1.jpg',
  'img/ejercicios/sentadilla-libre-0.jpg',
  'img/ejercicios/sentadilla-libre-1.jpg',
  'img/ejercicios/triceps-polea-0.jpg',
  'img/ejercicios/triceps-polea-1.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const peticion = e.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== location.origin) return;
  const deRed = fetch(peticion).then(async (respuesta) => {
    if (respuesta.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(peticion, respuesta.clone());
    }
    return respuesta;
  });
  e.waitUntil(deRed.catch(() => {}));
  e.respondWith(
    caches.match(peticion, { ignoreSearch: true }).then((guardada) =>
      guardada || deRed.catch(() => (peticion.mode === 'navigate' ? caches.match('./') : Response.error()))),
  );
});
