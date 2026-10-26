// Gera public/og.png (1200×630): a marca acento-escuro, tal como está, sobre #0B0C10.
// Correr: node scripts/og.mjs
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../brand/01-marca-principal/naptestul-marca-acento-escuro.svg', import.meta.url), 'utf8');
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(`<!doctype html><style>
  html, body { margin: 0; width: 1200px; height: 630px; background: #0B0C10; }
  body { display: grid; place-items: center; }
  svg { width: 760px; height: auto; display: block; }
</style>${svg}`);
await pagina.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') });
await navegador.close();
console.log('public/og.png');
