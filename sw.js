/* Service worker da Bíblia Sagrada
   Guarda a própria página (e ícones) no aparelho para o site abrir sem internet.
   Os textos das versões (ACF/AA/NVI) são guardados pela página no Cache Storage
   (cache "biblia-versoes-v1"), que este arquivo não toca. */

const SHELL = "biblia-shell-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./recursos.css",
  "./recursos.js",
  "./dados-geo.js",
  "./dados-mapas.js",
  "./dados-ligacoes.js",
  "./arte.js",
  "./imagens.css",
  "./imagens.js",
  "./imagens/manifest.json"
];
const IMGS = "biblia-imagens-v1"; // imagens próprias: sobrevivem à troca de versão do shell

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith("biblia-shell-") && k !== SHELL).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Só cuida de arquivos do próprio site. Os JSON das versões e o VLibras
  // (outros domínios) seguem o caminho normal.
  if (url.origin !== self.location.origin) return;

  // Imagens próprias: o manifest vem da rede primeiro (para enxergar novidades) e cai no
  // guardado sem internet; as imagens têm nome único e são guardadas na primeira vez.
  if (url.pathname.indexOf("/imagens/") !== -1) {
    const isManifest = url.pathname.endsWith("/manifest.json");
    event.respondWith(
      caches.open(IMGS).then(cache => {
        const net = () => fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        });
        if (isManifest) {
          return net().catch(() => cache.match(req).then(h => h || caches.match("./imagens/manifest.json")));
        }
        return cache.match(req).then(hit => hit || net());
      })
    );
    return;
  }

  // Abrir o site: responde na hora com a página guardada e atualiza em segundo plano.
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then(cached => {
        const refresh = fetch(req)
          .then(res => {
            if (res && res.ok && !res.redirected) {
              const copy = res.clone();
              caches.open(SHELL).then(c => c.put("./index.html", copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || refresh;
      })
    );
    return;
  }

  // Demais arquivos do site: usa o guardado e, se não houver, busca e guarda.
  event.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
