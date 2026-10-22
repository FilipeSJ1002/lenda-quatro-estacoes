
const CAIXA = 'lenda-v3';
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

// A PAGINA vem da rede primeiro; o JOGO, da caixa.
//
// Antes tudo era "caixa primeiro", e o efeito colateral mordeu de verdade: subiu
// versao nova, o site servia o novo, e quem ja tinha aberto continuava jogando a
// antiga -- o navegador nao tinha motivo para buscar nada. "Abra duas vezes"
// resolvia, mas depender de instrucao para o jogador receber uma atualizacao e
// um conserto ruim.
//
// Agora o documento e o carregador tentam a rede antes (sao poucos KB e trazem
// a versao de hoje), e caem na caixa se estiver sem internet. Os pedacos do
// jogo, que sao 40 MB, continuam vindo da caixa: eles ja foram trocados na
// instalacao desta versao, e buscar 40 MB a cada abertura seria desperdicio.
const DA_REDE = /\/$|\.html$|\.webmanifest$|loader\.js$/;

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;

  const url = new URL(evento.request.url);
  if (DA_REDE.test(url.pathname)) {
    evento.respondWith(
      fetch(evento.request)
        .then((resposta) => {
          if (resposta && resposta.ok && resposta.type === 'basic') {
            const copia = resposta.clone();
            caches.open(CAIXA).then((caixa) => caixa.put(evento.request, copia));
          }
          return resposta;
        })
        .catch(() => caches.match(evento.request, { ignoreSearch: true }))
    );
    return;
  }

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
