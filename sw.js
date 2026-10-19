
const CAIXA = 'lenda-v1';
const ARQUIVOS = ["./", "./index.html", "./lenda.html", "./manifest.webmanifest", "./jogo/loader.js", "./jogo/framework.js", "./jogo/codigo.0.wasm", "./jogo/dados.0.wasm", "./jogo/dados.1.wasm"];

self.addEventListener('install', (evento) => {
  // waitUntil: a instalacao so termina quando os 41 MB estiverem guardados.
  evento.waitUntil(caches.open(CAIXA).then((caixa) => caixa.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  // Versao nova do jogo: as caixas antigas saem, senao o aparelho enche.
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CAIXA).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request, { ignoreSearch: true }).then((guardado) => {
      if (guardado) return guardado;
      return fetch(evento.request).then((resposta) => {
        // Guarda o que vier novo, para a proxima abertura ja ter.
        if (resposta && resposta.ok && resposta.type === 'basic') {
          const copia = resposta.clone();
          caches.open(CAIXA).then((caixa) => caixa.put(evento.request, copia));
        }
        return resposta;
      });
    })
  );
});
