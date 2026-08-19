/* ============================================================
   ATELIER ALICE & SOPHIE — sw.js
   Service worker : mode hors-ligne minimal mais complet — une fois le
   site visité une première fois avec réseau, cache-first offre à la
   fois vitesse et fonctionnement à 100% en avion (recharger la page
   ne casse rien).

   Stratégie volontairement simple, cohérente avec le reste du site
   (statique, une seule page, pas d'API — data.json est juste un
   fichier statique de plus, chargé via fetch() par app.js) :
   - install  : précharge tout ce qu'il faut pour une utilisation
     complète hors-ligne (la page, le CSS/JS, data.json, tous les
     portraits, les icônes).
   - activate : supprime les anciens caches (versions précédentes du
     site) pour ne jamais accumuler de fichiers obsolètes.
   - fetch    : sert depuis le cache en priorité (cache-first) — plus
     rapide, et ne dépend du réseau que pour aller chercher une MISE
     À JOUR (nouveau sw.js, détecté automatiquement par le navigateur
     à chaque visite quand il y a du réseau ; rien de spécial à coder
     pour ça, comportement natif des service workers).
   Google Fonts NE SONT PAS mises en cache : ressource externe non
   essentielle, le site doit rester utilisable sans elle (police de
   secours "cursive" déjà définie dans --font-elegant, style.css) —
   pas la peine de bloquer l'installation du cache dessus.

   data.json est précaché avec le MÊME `?v=` que app.js utilise pour
   le charger (cache-busting déjà en place, voir loadData() dans
   app.js) — sinon la requête réelle de la page (avec son ?v=) ne
   correspondrait jamais à l'entrée précachée (sans ?v=), et
   retomberait systématiquement sur le réseau, cassant le hors-ligne
   pour ce fichier précisément.

   VERSION doit être bumpée en même temps que le numéro affiché dans
   #version-badge (index.html) à CHAQUE ship qui touche un fichier
   précaché (HTML/CSS/JS/data.json/portraits) : sans ça, soit le
   service worker sert indéfiniment une vieille version en cache, soit
   du contenu neuf n'est jamais mis à disposition hors-ligne. */
const VERSION = '2.72';
const CACHE_NAME = 'alice-sophie-v' + VERSION;

const PRECACHE_URLS = [
  './', 'index.html', 'style.css', 'app.js',
  'data.json?v=v' + VERSION,
  'manifest.json', 'apple-touch-icon.png',
  'icons/icon-192.png', 'icons/icon-512.png',
  'portraits/alice.png', 'portraits/anatole.png', 'portraits/antoine_com.png',
  'portraits/benjamin.png', 'portraits/bossu.png', 'portraits/boucher.png',
  'portraits/charlotte.png', 'portraits/chef_police.png', 'portraits/chifoufly.png',
  'portraits/clothilde.png', 'portraits/cripure.png', 'portraits/ecrivain.png',
  'portraits/entite_aquatique.png', 'portraits/famille.png', 'portraits/fille_algue.png',
  'portraits/homme_lierre.png', 'portraits/jean.png', 'portraits/julie.png',
  'portraits/maria.png', 'portraits/max.png', 'portraits/michael.png',
  'portraits/milan.png', 'portraits/sophie.png', 'portraits/sorciere.png',
  'portraits/vipere.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      // skipWaiting : la nouvelle version prend la main dès son
      // installation terminée, sans attendre la fermeture de tous les
      // onglets — "se reconnecte juste pour les mises à jour" plutôt
      // qu'un service worker qui resterait bloqué sur l'ancienne
      // version tant qu'un onglet traîne.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Laisse passer tel quel tout ce qui n'est pas sur ce domaine
  // (Google Fonts) — jamais mis en cache, jamais ce qui bloque le
  // mode hors-ligne du reste du site si injoignable.
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
