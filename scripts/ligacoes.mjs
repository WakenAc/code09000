// Verifica que todas as ligações e recursos internos de public/ existem.
// Lê href/src/content dos HTML, url() do CSS e os ícones do manifest.
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('../public', import.meta.url)));

async function* ficheiros(pasta) {
  for (const e of await readdir(pasta, { withFileTypes: true })) {
    const c = join(pasta, e.name);
    if (e.isDirectory()) yield* ficheiros(c);
    else yield c;
  }
}

async function existe(caminho) {
  try {
    const s = await stat(caminho);
    return s.isDirectory() ? existe(join(caminho, 'index.html')) : true;
  } catch { return false; }
}

const falhas = [];
let total = 0;

for await (const f of ficheiros(raiz)) {
  let alvos = [];
  const texto = await readFile(f, 'utf8').catch(() => '');
  if (f.endsWith('.html')) {
    alvos = [...texto.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    // og:image aponta para o domínio; verifica-se o ficheiro local equivalente.
    alvos.push(...[...texto.matchAll(/content="https:\/\/naptestul\.pt(\/[^"]*\.png)"/g)].map((m) => m[1]));
  } else if (f.endsWith('.css')) {
    alvos = [...texto.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);
  } else if (f.endsWith('.webmanifest')) {
    alvos = JSON.parse(texto).icons.map((i) => i.src);
  }
  for (const alvo of alvos) {
    if (/^(https?:|mailto:|data:|#)/.test(alvo)) continue;
    total++;
    const caminho = alvo.split(/[?#]/)[0];
    const absoluto = caminho.startsWith('/') ? join(raiz, caminho) : join(dirname(f), caminho);
    if (!(await existe(absoluto))) falhas.push(`${relative(raiz, f)} → ${alvo}`);
  }
}

if (falhas.length) {
  console.error(`Ligações internas partidas (${falhas.length}):\n  ` + falhas.join('\n  '));
  process.exit(1);
}
console.log(`Ligações internas: ${total} verificadas, todas resolvem.`);
