// Corre o Lighthouse CI em desktop e mobile. Os relatórios ficam em .lighthouseci/ (nada é publicado).
// Usa o Chromium do Playwright quando CHROME_PATH não está definido.
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const env = { ...process.env, CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath() };
for (const perfil of ['desktop', 'mobile']) {
  console.log(`\n— Lighthouse (${perfil}) —`);
  execSync(`npx lhci autorun --config=lighthouserc.${perfil}.json`, { stdio: 'inherit', env });
}
