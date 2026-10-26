// A placa de circuito por trás da página inicial, e a luz ambiente a 0 %.
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import {
  ACESO, alfaPlaca, caixaDe, capturar, contarFrames, esconderPlaca, luz, maximo, referencia, revelado,
} from './ajudas.js';

const DESKTOP = { viewport: { width: 1280, height: 800 } };
const FIM_DA_IGNICAO = 3000;

const caixaEm = (x, y, r) => ({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

async function zonaLivre(page) {
  const m = await page.locator('.marca svg').boundingBox();
  return { x: Math.ceil(m.x), y: Math.ceil(m.y), width: Math.floor(m.width), height: Math.floor(m.height) };
}

// Escolhe um ponto P0 numa pista, o ponto Pf 150 px mais à frente na mesma pista
// e um ponto Q a 400 px de P0, todos dentro da janela e longe do encapsulamento.
async function escolherPista(page) {
  return page.evaluate(() => {
    const { pistas, pacote } = document.getElementById('placa').geometria();
    const dentro = (x, y, m) => x > m && y > m && x < innerWidth - m && y < innerHeight - m;
    const longeDoPacote = (x, y) =>
      x < pacote.x0 - 60 || x > pacote.x1 + 60 || y < pacote.y0 - 60 || y > pacote.y1 + 60;
    for (const p of pistas.filter((q) => q.principal)) {
      for (let k = 0; k < p.x.length; k++) {
        const [x0, y0] = [p.x[k], p.y[k]];
        if (!dentro(x0, y0, 80) || !longeDoPacote(x0, y0)) continue;
        const j = p.s.findIndex((s) => s - p.s[k] >= 150);
        if (j < 0 || !dentro(p.x[j], p.y[j], 20) || Math.hypot(p.x[j] - x0, p.y[j] - y0) < 110) continue;
        for (let a = 0; a < 16; a++) {
          const qx = x0 + 400 * Math.cos((a * Math.PI) / 8);
          const qy = y0 + 400 * Math.sin((a * Math.PI) / 8);
          if (dentro(qx, qy, 30)) return { p0: [x0, y0], pf: [p.x[j], p.y[j]], q: [qx, qy] };
        }
      }
    }
    return null;
  });
}

test.describe('placa (desktop)', () => {
  test.use(DESKTOP);

  test('o canvas existe, cobre a janela, está atrás do conteúdo e tem aria-hidden', async ({ page }) => {
    await page.goto('/');
    const placa = page.locator('canvas#placa');
    await expect(placa).toHaveAttribute('aria-hidden', 'true');
    const r = await page.evaluate(() => {
      const t = document.getElementById('placa');
      const m = document.querySelector('.marca svg').getBoundingClientRect();
      t.style.pointerEvents = 'auto'; // só para ver a ordem de empilhamento
      const pilha = document.elementsFromPoint(m.left + m.width / 2, m.top + m.height / 2);
      t.style.pointerEvents = '';
      const c = t.getBoundingClientRect();
      return {
        cobre: c.width === innerWidth && c.height === innerHeight,
        resolucao: t.width === Math.round(innerWidth * devicePixelRatio),
        atras: pilha.indexOf(t) > pilha.indexOf(document.getElementById('palco')),
      };
    });
    expect(r).toEqual({ cobre: true, resolucao: true, atras: true });
  });

  test('(a) 3 s após o carregamento, sem ponteiro, a página é só fundo (peso de latão incluído)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(FIM_DA_IGNICAO);
    const vp = page.viewportSize();
    const img = PNG.sync.read(await page.screenshot());
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 5; i++) {
        const x = Math.round(((i + 0.5) * vp.width) / 5);
        const y = Math.round(((j + 0.5) * vp.height) / 4);
        const o = (y * img.width + x) * 4;
        expect([img.data[o], img.data[o + 1], img.data[o + 2]], `(${x}, ${y})`).toEqual([0x0B, 0x0C, 0x10]);
      }
    }
    // O peso de latão também está apagado: nenhum píxel acima do fundo.
    const c = await capturar(page, await caixaDe(page.locator('#peso')));
    let acesos = 0;
    for (let i = 0; i < c.rgba.length; i += 4) {
      if (c.rgba[i] > 0x0B + 2 || c.rgba[i + 1] > 0x0C + 2 || c.rgba[i + 2] > 0x10 + 2) acesos++;
    }
    expect(acesos).toBe(0);
  });

  test('(b) ignição com frames nos primeiros 2 s; 3 s depois de parar o ponteiro, ~0 fps', async ({ page }) => {
    const frames = await contarFrames(page);
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(await frames(), 'frames da ignição').toBeGreaterThan(30);

    await page.mouse.move(150, 650);
    await page.mouse.move(350, 120, { steps: 25 });
    await page.waitForTimeout(3000);
    const a = await frames();
    await page.waitForTimeout(1000);
    expect((await frames()) - a, 'frames por segundo com o ponteiro parado').toBeLessThanOrEqual(1);
  });

  test('(c) a corrente entra junto ao ponteiro e propaga-se pela pista', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(FIM_DA_IGNICAO);
    const alvo = await escolherPista(page);
    expect(alvo, 'há uma pista utilizável').not.toBeNull();
    const { p0, pf, q } = alvo;

    await page.mouse.move(p0[0], p0[1]);
    const t0 = Date.now();
    await page.waitForTimeout(60);
    expect(await alfaPlaca(page, caixaEm(p0[0], p0[1], 3)), 'junto ao ponteiro').toBeGreaterThan(ACESO);
    expect(await alfaPlaca(page, caixaEm(pf[0], pf[1], 2)), '150 px à frente, ainda não').toBeLessThan(ACESO);
    expect(await alfaPlaca(page, caixaEm(q[0], q[1], 12)), 'a 400 px').toBe(0);

    await page.waitForTimeout(Math.max(0, 400 - (Date.now() - t0)));
    expect(await alfaPlaca(page, caixaEm(pf[0], pf[1], 2)), '150 px à frente, 400 ms depois').toBeGreaterThan(ACESO);
  });

  test('(d) nada se acende dentro da zona livre do logótipo, nem com o ponteiro em cima', async ({ page }) => {
    await page.goto('/');
    const z = await zonaLivre(page);
    let maior = 0;
    // Durante a ignição…
    for (let i = 0; i < 6; i++) {
      maior = Math.max(maior, await alfaPlaca(page, z));
      await page.waitForTimeout(150);
    }
    // …e com o ponteiro a passar por cima e à volta.
    const passos = [
      [z.x - 80, z.y + z.height / 2], [z.x + z.width / 3, z.y + 10], [z.x + z.width / 2, z.y + z.height / 2],
      [z.x + z.width - 5, z.y + z.height - 5], [z.x + z.width + 80, z.y + z.height / 2], [z.x + z.width / 2, z.y - 40],
    ];
    for (const [x, y] of passos) {
      await page.mouse.move(x, y, { steps: 8 });
      for (let i = 0; i < 3; i++) {
        maior = Math.max(maior, await alfaPlaca(page, z));
        await page.waitForTimeout(80);
      }
    }
    expect(maior).toBe(0);
  });

  test('(g) Tab chega a «Em breve…», a luz desloca-se para lá e o clique leva a /em-breve/', async ({ page }) => {
    await page.goto('/');
    const ligacao = page.getByRole('link', { name: 'Em breve…' });
    await page.keyboard.press('Tab');
    await expect(ligacao).toBeFocused();
    const b = await ligacao.boundingBox();
    await expect.poll(async () => {
      const p = await luz(page);
      return Math.hypot(p.x - (b.x + b.width / 2), p.y - (b.y + b.height / 2));
    }, { timeout: 3000 }).toBeLessThan(1.5);
    await esconderPlaca(page);
    expect(maximo(await capturar(page, await caixaDe(ligacao)))).toBeGreaterThanOrEqual(0.98);
    await ligacao.click();
    await expect(page).toHaveURL(/\/em-breve\/$/);
  });
});

test.describe('placa com movimento reduzido', () => {
  test.use({ ...DESKTOP, reducedMotion: 'reduce' });

  test('(e) sem frames de animação; pistas junto à marca a 30 %; marca a 100 % no carregamento', async ({ page }) => {
    const frames = await contarFrames(page);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(100, 600);
    await page.mouse.move(300, 650, { steps: 15 });
    await page.waitForTimeout(600);
    expect(await frames()).toBe(0);

    // Pistas acesas estaticamente a 30 % (traço a 0,3 × 80 %); só as junções pino/pista se sobrepõem.
    const h = await page.evaluate(() => {
      const t = document.getElementById('placa');
      const d = t.getContext('2d').getImageData(0, 0, t.width, t.height).data;
      let acesos = 0;
      let nivel = 0;
      let acima = 0;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] < 13) continue;
        acesos++;
        if (d[i] >= 0.15 * 255 && d[i] <= 0.35 * 255) nivel++;
        if (d[i] > 0.35 * 255) acima++;
      }
      return { acesos, nivel, acima };
    });
    expect(h.nivel, 'pistas acesas estaticamente').toBeGreaterThan(500);
    expect(h.acima / h.acesos, '…a 30 %, não mais').toBeLessThan(0.02);

    await esconderPlaca(page);
    const caixa = await caixaDe(page.locator('.marca svg'));
    const r = revelado(await capturar(page, caixa), await referencia(page, caixa), 0.97);
    expect(r.fracao, `${r.ok}/${r.letra}`).toBe(1);
  });
});

test.describe('placa com mais contraste', () => {
  test.use({ ...DESKTOP, contrast: 'more' });

  test('(f) o canvas não é renderizado e o conteúdo está a 100 %', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('canvas#placa')).toBeHidden();
    expect(await page.locator('canvas#placa').evaluate((t) => getComputedStyle(t).display)).toBe('none');
    expect(maximo(await capturar(page, await caixaDe(page.locator('#wordmark'))))).toBeGreaterThanOrEqual(0.98);
    expect(maximo(await capturar(page, await caixaDe(page.getByRole('link', { name: 'Em breve…' }))))).toBeGreaterThanOrEqual(0.98);
    // Rodapé em cinza de apoio (#8E9097), a 100 %.
    expect(maximo(await capturar(page, await caixaDe(page.locator('.rodape p'))))).toBeGreaterThan(0.5);
  });
});

test('(h) a página inicial não faz pedidos externos e pesa menos de 150 KB', async ({ page, baseURL }) => {
  const origem = new URL(baseURL).origin;
  const externos = [];
  page.on('request', (r) => { if (!r.url().startsWith(origem + '/') && !r.url().startsWith('data:')) externos.push(r.url()); });
  await page.goto('/');
  await page.mouse.move(300, 300);
  await page.waitForLoadState('networkidle');
  expect(externos).toEqual([]);
  const bytes = await page.evaluate(() =>
    [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')]
      .reduce((s, e) => s + (e.encodedBodySize || e.transferSize || 0), 0));
  expect(bytes).toBeGreaterThan(10_000);
  expect(bytes).toBeLessThan(150 * 1024);
});
