// Privacidade, validação e ligações das três páginas (e da 404).
import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

const PAGINAS = ['/', '/em-breve/', '/privacidade/'];

for (const caminho of [...PAGINAS, '/nao-existe/']) {
  test(`(6) ${caminho}: sem pedidos a domínios externos e sem cookies`, async ({ page, context, baseURL }) => {
    const origem = new URL(baseURL).origin;
    const externos = [];
    await context.route('**/*', (rota) => {
      const url = rota.request().url();
      if (!url.startsWith(origem + '/') && !url.startsWith('data:')) {
        externos.push(url);
        return rota.abort();
      }
      return rota.continue();
    });
    await page.goto(caminho);
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(400, 300);
    await page.waitForLoadState('networkidle');

    expect(externos).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe('');
  });
}

test('cabeçalhos de segurança e 404', async ({ request }) => {
  const r = await request.get('/');
  expect(r.headers()['content-security-policy']).toContain("default-src 'self'");
  expect(r.headers()['x-content-type-options']).toBe('nosniff');
  expect(r.headers()['referrer-policy']).toBeTruthy();
  expect(r.headers()['set-cookie']).toBeUndefined();

  const nada = await request.get('/nao-existe/');
  expect(nada.status()).toBe(404);
  expect(await nada.text()).toContain('Página não encontrada.');
});

test('nenhuma página tem erros de CSP ou de consola', async ({ page }) => {
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(e.message));
  for (const caminho of PAGINAS) {
    await page.goto(caminho);
    await page.waitForLoadState('networkidle');
  }
  expect(erros).toEqual([]);
});

test('(7) html-validate sem erros e ligações internas resolvem', async ({ page, request }) => {
  execSync('npx html-validate "public/**/*.html"', { encoding: 'utf8' });
  execSync('node scripts/ligacoes.mjs', { encoding: 'utf8' });

  // E pelo servidor: cada href/src interno de cada página responde 200.
  const vistos = new Set();
  for (const caminho of [...PAGINAS, '/nao-existe/']) {
    await page.goto(caminho);
    const alvos = await page.evaluate(() =>
      [...document.querySelectorAll('[href], [src]')]
        .map((el) => el.getAttribute('href') ?? el.getAttribute('src'))
        .filter((u) => !/^(https?:|mailto:|data:|#)/.test(u))
        .map((u) => new URL(u, location.href).pathname));
    for (const alvo of alvos) {
      if (vistos.has(alvo)) continue;
      vistos.add(alvo);
      const r = await request.get(alvo);
      expect(r.status(), alvo).toBe(200);
    }
  }
  expect(vistos.size).toBeGreaterThan(8);
});

test('rodapé, metadados e texto em pt-PT nas três páginas', async ({ page }) => {
  for (const caminho of PAGINAS) {
    await page.goto(caminho);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^.{50,160}$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://naptestul.pt/og.png');
    await expect(page.locator('footer')).toContainText('Naptestul, Unipessoal, Lda. · NIF 515906689 · Seixal · geral@naptestul.pt · Privacidade');
    await expect(page.locator('footer a[href="mailto:geral@naptestul.pt"]')).toBeVisible();
  }
  await page.goto('/em-breve/');
  await expect(page.getByRole('link', { name: '← Início' })).toHaveAttribute('href', '/');
  await expect(page.locator('main a[href="mailto:geral@naptestul.pt"]')).toHaveText('geral@naptestul.pt');
  await expect(page.getByRole('img', { name: 'Naptestul · LUZ' })).toBeVisible();
});
