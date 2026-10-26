// Servidor estático local para desenvolvimento e testes, sem dependências.
// Imita o Cloudflare Pages no essencial: /pasta/ → /pasta/index.html,
// 404.html com estado 404 e cabeçalhos lidos de public/_headers.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('../public', import.meta.url)));
const porta = Number(process.env.PORT || 4173);

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// _headers: blocos "padrão de caminho" seguidos de linhas indentadas "Nome: valor".
async function lerCabecalhos() {
  const regras = [];
  let texto = '';
  try { texto = await readFile(join(raiz, '_headers'), 'utf8'); } catch { return regras; }
  for (const linha of texto.split(/\r?\n/)) {
    if (!linha.trim() || linha.trim().startsWith('#')) continue;
    if (!/^\s/.test(linha)) { regras.push({ padrao: linha.trim(), cabecalhos: [] }); continue; }
    const i = linha.indexOf(':');
    regras.at(-1)?.cabecalhos.push([linha.slice(0, i).trim(), linha.slice(i + 1).trim()]);
  }
  return regras;
}

function corresponde(padrao, caminho) {
  const re = new RegExp('^' + padrao.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(caminho);
}

async function ficheiro(caminho) {
  const alvo = normalize(join(raiz, decodeURIComponent(caminho)));
  if (!alvo.startsWith(raiz)) return null;
  try {
    const s = await stat(alvo);
    if (s.isDirectory()) return ficheiro(join(caminho, 'index.html'));
    return alvo;
  } catch { return null; }
}

const regras = await lerCabecalhos();

createServer(async (pedido, resposta) => {
  const { pathname } = new URL(pedido.url, 'http://localhost');
  // /em-breve → /em-breve/ (como o Pages faz)
  if (!pathname.endsWith('/') && !extname(pathname)) {
    const alvo = await ficheiro(pathname);
    if (alvo?.endsWith('index.html')) {
      resposta.writeHead(308, { Location: pathname + '/' });
      return resposta.end();
    }
  }
  let alvo = pathname.startsWith('/_') ? null : await ficheiro(pathname);
  let estado = 200;
  if (!alvo) { alvo = join(raiz, '404.html'); estado = 404; }
  for (const { padrao, cabecalhos } of regras) {
    if (corresponde(padrao, pathname)) for (const [n, v] of cabecalhos) resposta.setHeader(n, v);
  }
  resposta.setHeader('Content-Type', tipos[extname(alvo)] || 'application/octet-stream');
  resposta.writeHead(estado);
  resposta.end(pedido.method === 'HEAD' ? undefined : await readFile(alvo));
}).listen(porta, '127.0.0.1', () => {
  console.log(`naptestul.pt local: http://localhost:${porta}/`);
});
