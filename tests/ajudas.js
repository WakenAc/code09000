// Medição da "opacidade efetiva" a partir dos píxeis do ecrã.
// O fundo é #0B0C10 e a marca é #F4EFE6: no canal verde, 12 → 0 % e 239 → 100 %.
import { PNG } from 'pngjs';

const FUNDO_G = 0x0C;
const BRANCO_G = 0xEF;

export async function capturar(page, caixa) {
  const png = PNG.sync.read(await page.screenshot({ clip: caixa, animations: 'disabled', caret: 'hide' }));
  const op = new Float32Array(png.width * png.height);
  for (let i = 0; i < op.length; i++) {
    op[i] = Math.max(0, (png.data[i * 4 + 1] - FUNDO_G) / (BRANCO_G - FUNDO_G));
  }
  return { largura: png.width, altura: png.height, op, rgba: png.data };
}

export function maximo(cap) {
  let m = 0;
  for (const v of cap.op) if (v > m) m = v;
  return m;
}

// Caixa inteira em píxeis do ecrã (as capturas pedem inteiros estáveis).
export async function caixaDe(locator) {
  const b = await locator.boundingBox();
  const x = Math.floor(b.x);
  const y = Math.floor(b.y);
  return { x, y, width: Math.ceil(b.x + b.width) - x, height: Math.ceil(b.y + b.height) - y };
}

// Fração dos píxeis de letra (no estado de referência, sem máscara) que, em `cap`,
// chegam a pelo menos `limiar` da opacidade de referência.
export function revelado(cap, ref, limiar = 0.95) {
  let letra = 0;
  let ok = 0;
  for (let i = 0; i < ref.op.length; i++) {
    if (ref.op[i] < 0.6) continue;
    letra++;
    if (cap.op[i] >= ref.op[i] * limiar) ok++;
  }
  return { letra, ok, fracao: ok / letra };
}

// Referência sem máscara: a mesma página com prefers-contrast: more.
export async function referencia(page, caixa) {
  await page.emulateMedia({ contrast: 'more' });
  const ref = await capturar(page, caixa);
  await page.emulateMedia({ contrast: 'no-preference' });
  return ref;
}

export async function luz(page) {
  return page.locator('#palco').evaluate((el) => {
    const s = getComputedStyle(el);
    return { x: parseFloat(s.getPropertyValue('--x')), y: parseFloat(s.getPropertyValue('--y')) };
  });
}

// A placa é fundo: para medir a opacidade da camada de conteúdo, tira-se da imagem.
export async function esconderPlaca(page) {
  await page.evaluate(() => {
    const p = document.getElementById('placa');
    if (p) p.style.visibility = 'hidden';
  });
}

// Conta chamadas a requestAnimationFrame (instalar antes de abrir a página).
export async function contarFrames(page) {
  await page.addInitScript(() => {
    window.__frames = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (fn) => { window.__frames++; return original(fn); };
  });
  return () => page.evaluate(() => window.__frames);
}

// Alfa máximo dos píxeis do canvas num retângulo em px CSS (0 = apagado).
export async function alfaPlaca(page, caixa) {
  return page.evaluate(({ x, y, width, height }) => {
    const tela = document.getElementById('placa');
    const r = window.devicePixelRatio || 1;
    const d = tela.getContext('2d')
      .getImageData(Math.round(x * r), Math.round(y * r), Math.max(1, Math.round(width * r)), Math.max(1, Math.round(height * r))).data;
    let alfa = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > alfa) alfa = d[i];
    return alfa / 255;
  }, caixa);
}

// Uma pista "acesa" tem o traço a mais de 25 % (o brilho sozinho fica abaixo de 15 %).
export const ACESO = 0.25;
