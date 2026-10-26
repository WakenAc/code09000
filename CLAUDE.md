# naptestul.pt — site da Naptestul, Unipessoal, Lda.

Site estático de uma página (mais /em-breve/ e /privacidade/), publicado no Cloudflare Pages a partir de `public/`.
Sem framework, sem build obrigatório, sem pedidos a domínios externos, sem cookies, sem analytics.

## Regras
- Tudo o que o visitante vê é em português europeu.
- A marca vem de `brand/` e segue `brand/diretrizes.md` à letra: ficheiros SVG tal como estão, zona livre,
  tamanhos mínimos, cores da paleta. Nunca escrever "Naptestul" com a fonte em vez de usar o SVG do logótipo.
- Paleta: fundo #0B0C10, branco quente #F4EFE6, cinza de apoio #8E9097, latão #C9A45C (só como ponto, nunca texto).
- Tipografia: Manrope, alojada localmente a partir de `brand/fontes/` (converter para woff2; manter OFL.txt).
- Acessibilidade primeiro: o conteúdo existe sempre no DOM e é legível com teclado, leitor de ecrã,
  `prefers-reduced-motion` e `prefers-contrast: more`. O efeito de luz é decoração, nunca a única forma de ler.
- Peso total da página inicial < 150 KB; Lighthouse ≥ 95 em desempenho, acessibilidade e boas práticas.
- Testes em `tests/` (Playwright) e CI em `.github/workflows/ci.yml`; nada se publica com testes a falhar.

## Comandos
npm run dev · npm test · npm run lighthouse · npm run check (html-validate + links)