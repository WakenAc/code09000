// O foco de luz da página inicial, em cada modo exigido.
import { test, expect, devices } from '@playwright/test';
import { capturar, caixaDe, maximo, revelado, referencia, luz, esconderPlaca } from './ajudas.js';

// Mede-se a camada de conteúdo (marca, «Em breve…», rodapé) sem a placa por trás.
async function abrir(page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await esconderPlaca(page);
}

test.describe('desktop (rato)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('(1) o rato no centro do logótipo revela o nome; «Em breve…» leva a /em-breve/', async ({ page }) => {
    await abrir(page);
    const nome = await caixaDe(page.locator('#wordmark'));

    const antes = maximo(await capturar(page, nome));
    expect(antes, 'nome antes de mover o rato').toBeLessThanOrEqual(0.05);

    // O peso de latão também começa apagado, como o resto da marca.
    const peso = await capturar(page, await caixaDe(page.locator('#peso')));
    expect(maximo(peso), 'peso de latão antes de mover o rato').toBeLessThanOrEqual(0.05);

    const logo = await page.locator('.marca svg').boundingBox();
    const cx = logo.x + logo.width / 2;
    const cy = logo.y + logo.height / 2;
    await page.mouse.move(cx, cy);
    await expect.poll(async () => luz(page)).toEqual({ x: expect.closeTo(cx, 0), y: expect.closeTo(cy, 0) });

    // À volta do cursor, as letras estão a 100 %.
    const perto = { x: Math.round(cx - 50), y: nome.y, width: 100, height: nome.height };
    expect(maximo(await capturar(page, perto)), 'nome sob a luz').toBeGreaterThanOrEqual(0.98);

    // Lá longe, continua a ≤ 5 %.
    const ultimaLetra = { x: nome.x + nome.width - 24, y: nome.y, width: 24, height: nome.height };
    expect(maximo(await capturar(page, ultimaLetra))).toBeLessThanOrEqual(0.05);

    await page.getByRole('link', { name: 'Em breve…' }).click();
    await expect(page).toHaveURL(/\/em-breve\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Em breve.');
  });

  test('o cursor do sistema mantém-se visível', async ({ page }) => {
    await abrir(page);
    const cursores = await page.evaluate(() =>
      [document.body, document.getElementById('palco'), document.querySelector('.marca')]
        .map((el) => getComputedStyle(el).cursor));
    expect(cursores.every((c) => c !== 'none')).toBe(true);
  });

  test('(5) teclado: Tab chega a «Em breve…» e a luz segue-o', async ({ page }) => {
    await abrir(page);
    const ligacao = page.getByRole('link', { name: 'Em breve…' });
    await page.keyboard.press('Tab');
    await expect(ligacao).toBeFocused();

    const b = await ligacao.boundingBox();
    await expect.poll(async () => {
      const p = await luz(page);
      return Math.hypot(p.x - (b.x + b.width / 2), p.y - (b.y + b.height / 2));
    }, { timeout: 3000 }).toBeLessThan(1.5);
    expect(maximo(await capturar(page, await caixaDe(ligacao))), '«Em breve…» iluminado').toBeGreaterThanOrEqual(0.98);

    // E continua a seguir o foco pelo rodapé.
    await page.keyboard.press('Tab');
    const email = page.locator('.rodape a[href^="mailto:"]');
    await expect(email).toBeFocused();
    const e = await email.boundingBox();
    await expect.poll(async () => {
      const p = await luz(page);
      return Math.hypot(p.x - (e.x + e.width / 2), p.y - (e.y + e.height / 2));
    }, { timeout: 3000 }).toBeLessThan(1.5);
  });
});

test.describe('telemóvel (toque)', () => {
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  test.use(pixel);

  test('(2) sem toque, a luz deriva e revela o nome inteiro em menos de 3 s', async ({ page }) => {
    const inicio = Date.now();
    await abrir(page);
    const caixa = await caixaDe(page.locator('.marca svg'));
    expect(await page.evaluate(() => matchMedia('(hover: none), (pointer: coarse)').matches)).toBe(true);

    // Máximo por píxel ao longo do tempo, até aos 3 s desde o pedido da página.
    let acumulado = null;
    let capturas = 0;
    while (Date.now() - inicio < 2900) {
      const cap = await capturar(page, caixa);
      capturas++;
      if (!acumulado) acumulado = cap;
      else for (let i = 0; i < cap.op.length; i++) acumulado.op[i] = Math.max(acumulado.op[i], cap.op[i]);
    }
    const ref = await referencia(page, caixa);
    const r = revelado(acumulado, ref);
    expect(capturas).toBeGreaterThan(5);
    expect(r.fracao, `${r.ok}/${r.letra} píxeis de letra revelados em ${capturas} capturas`).toBeGreaterThanOrEqual(0.995);

    // Nunca está tudo aceso ao mesmo tempo: é mesmo uma luz que passa.
    const agora = revelado(await capturar(page, caixa), ref);
    expect(agora.fracao).toBeLessThan(0.9);
  });

  test('o dedo leva a luz e, parado, ela volta a derivar', async ({ page }) => {
    await abrir(page);
    const vp = page.viewportSize();
    await page.touchscreen.tap(vp.width / 2, vp.height - 40);
    await expect.poll(async () => (await luz(page)).y, { timeout: 1000 }).toBeGreaterThan(vp.height - 120);
    // Depois da espera, a deriva traz a luz de volta para junto do nome.
    const logo = await page.locator('.marca svg').boundingBox();
    await expect.poll(async () => Math.abs((await luz(page)).y - (logo.y + logo.height / 2)), { timeout: 5000 })
      .toBeLessThan(logo.height);
  });
});

for (const [nome, opcoes] of [
  ['desktop', { viewport: { width: 1280, height: 800 } }],
  ['telemóvel', (({ defaultBrowserType, ...d }) => d)(devices['Pixel 7'])],
]) {
  test.describe(`movimento reduzido (${nome})`, () => {
    test.use({ ...opcoes, reducedMotion: 'reduce' });

    test('(3) o nome está a 100 % logo no carregamento, e a luz não deriva', async ({ page }) => {
      await abrir(page);
      const caixa = await caixaDe(page.locator('.marca svg'));
      const cap = await capturar(page, caixa);
      const r = revelado(cap, await referencia(page, caixa), 0.97);
      expect(r.fracao, `${r.ok}/${r.letra}`).toBe(1);

      const antes = await luz(page);
      await page.waitForTimeout(800);
      expect(await luz(page)).toEqual(antes);
      // «Em breve…» também está dentro da luz.
      const ligacao = page.getByRole('link', { name: 'Em breve…' });
      expect(maximo(await capturar(page, await caixaDe(ligacao)))).toBeGreaterThanOrEqual(0.98);
    });
  });
}

test.describe('mais contraste', () => {
  test.use({ viewport: { width: 1280, height: 800 }, contrast: 'more' });

  test('(4) sem máscara: tudo a 100 %', async ({ page }) => {
    await abrir(page);
    const mascaras = await page.locator('#palco').evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.maskImage, s.webkitMaskImage];
    });
    expect(mascaras).toEqual(['none', 'none']);
    expect(maximo(await capturar(page, await caixaDe(page.locator('#wordmark'))))).toBeGreaterThanOrEqual(0.98);
    const rodape = await capturar(page, await caixaDe(page.locator('.rodape p')));
    // O rodapé é cinza de apoio (#8E9097): G = 0x90 → ≈ 58 % na escala branco/fundo.
    expect(maximo(rodape)).toBeGreaterThan(0.5);
  });
});
