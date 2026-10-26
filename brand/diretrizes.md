# Naptestul — diretrizes do logótipo

Guia compacto, escrito para quem não é designer. Mais «faz assim» do que «não faças».

## 1. O logótipo

**A ideia.** A primeira perna do N é um fio-de-prumo: o instrumento de quem mede antes de fazer. «A prumo» é compostura e exatidão — o que a Naptestul promete a quem lhe entrega o telefone e as faturas. O símbolo é a própria inicial de «Naptestul», por isso marca e nome são a mesma coisa.

**Versões.**

| Versão | Quando usar | Pasta |
|---|---|---|
| Marca principal (horizontal) | Quase sempre: site, assinatura de email, faturas, apresentações | `01-marca-principal/` |
| Símbolo (o N a prumo) | Espaços pequenos ou quadrados: favicon, ícone de app, avatar, carimbo | `02-simbolo/` |
| Wordmark isolado (N normal) | Só ao lado do símbolo, quando este já aparece noutro sítio (ex.: empilhado) | `03-wordmark/` |
| Marca empilhada | Formatos quadrados ou altos: sinalética, cartão de visita, perfis sociais | `04-empilhado/` |
| «Naptestul · LUZ» | Sempre que a empresa assina ao lado do produto | `05-naptestul-luz/` |

**Cores de cada versão.** Cada pasta tem quatro ficheiros: `-preto` (fundos claros, impressão), `-branco` (fundos escuros), `-latao` (uma só cor em latão — gravação, relevo, selo) e `-acento-escuro` (branco quente com o peso em latão: a versão principal sobre o quase-preto do site).

**Ficheiros.** `.svg` é o original — usa-o sempre que puderes (site, apps, documentos digitais, gráfica). Os `.png` servem para onde o SVG não entra (assinaturas de email, redes sociais, Office). Os `.svg` são contornos puros: não dependem de fontes instaladas.

## 2. Zona livre

Em volta do logótipo, deixa sempre livre **metade da altura do N** (a altura das maiúsculas), medida a partir dos pontos mais exteriores — incluindo a ponta do prumo. A zona escala com o logótipo; nunca é uma distância fixa. Nada de texto, imagens ou margens de caixa dentro desta zona.

## 3. Tamanhos mínimos

| Versão | Ecrã | Impressão |
|---|---|---|
| Marca principal | 110 px de largura | 25 mm de largura |
| «Naptestul · LUZ» | 160 px de largura | 36 mm de largura |
| Marca empilhada | 64 px de altura | 15 mm de altura |
| Símbolo | 24 px de altura | 6 mm de altura |
| Símbolo, corte pequeno (`-pequeno`) | 16 a 32 px — favicon e ícones | — |

Abaixo de 32 px usa sempre o **corte pequeno** do símbolo (fio mais grosso, sem anel): é o que está nos ícones web da pasta `06-icones-web/`.

## 4. Cor

**Paleta neutra** (a base de tudo):

| Nome | HEX | RGB | CMYK (aprox.) | Uso |
|---|---|---|---|---|
| Quase-preto | `#0B0C10` | 11 · 12 · 16 | 31 · 25 · 0 · 94 | Fundo do site e de superfícies escuras |
| Branco quente | `#F4EFE6` | 244 · 239 · 230 | 0 · 2 · 6 · 4 | Logótipo e texto sobre escuro |
| Preto | `#111111` | 17 · 17 · 17 | 0 · 0 · 0 · 93 | Logótipo e texto sobre branco (faturas, documentos) |
| Cinza de apoio | `#8E9097` | 142 · 144 · 151 | 6 · 5 · 0 · 41 | Texto secundário, linhas, legendas |

**Paleta com acento** (a neutra mais uma cor, usada só como ponto):

| Nome | HEX | RGB | CMYK (aprox.) | Uso |
|---|---|---|---|---|
| Latão | `#C9A45C` | 201 · 164 · 92 | 0 · 18 · 54 · 21 | O peso do prumo sobre fundos escuros; versão a uma cor para gravação |

Contrastes medidos: branco quente sobre quase-preto 17,1:1; latão sobre quase-preto 8,3:1; cinza de apoio sobre quase-preto 6,1:1; preto sobre branco 18,9:1. O latão sobre branco fica em 2,3:1 — por isso **sobre fundos claros o logótipo é sempre preto, sem acento**, e o latão nunca é usado para texto.

**Pares aprovados.** Acento-escuro sobre quase-preto (principal) · branco sobre quase-preto ou outro escuro liso · preto sobre branco ou fundos muito claros · latão a uma cor em gravação, relevo ou selo. Sobre fotografias, usa a versão branca numa zona calma e escura, ou a versão preta numa zona clara; se não houver zona calma, coloca o símbolo no quadrado escuro (`naptestul-simbolo-app-icon`).

Equivalentes Pantone: a confirmar com a gráfica a partir dos valores CMYK (o latão aproxima-se dos tons 7407 C / 465 C — verificar em prova).

## 5. Tipografia

- Logótipo: letras da **Manrope** (peso 700; 660 na versão para fundo escuro), já convertidas em contornos nos ficheiros. O N a prumo é construído a partir das medidas da fonte (haste de 18 unidades por 108 de altura de maiúscula; diagonal a 56,6°).
- Títulos e texto corrente: **Manrope** (Regular 400 e SemiBold 600). Alternativa de sistema quando a Manrope não puder ser carregada: `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Licença: Manrope é distribuída sob a SIL Open Font License 1.1 (Mikhail Sharanda; disponível em Google Fonts), que permite o uso em logótipos e a conversão em contornos. Guarda uma cópia da fonte e da licença com os ficheiros originais.
- No lockup com o produto, «LUZ» escreve-se em capitais, no mesmo corpo e peso, separado por um ponto a meia altura («·») com um espaço de cada lado.

## 6. Faz / não faças

**Faz:** usa os ficheiros tal como estão · escolhe a versão certa para o fundo · respeita a zona livre e os tamanhos mínimos · usa o corte pequeno abaixo de 32 px · sobre o quase-preto, deixa o peso em latão ser o único acento.

**Não faças:** não estiques nem comprimas · não rodes (o prumo tem de ficar vertical — é a ideia toda) · não mudes as cores fora da paleta · não acrescentes sombras, contornos, gradientes ou brilhos · não separes nem redimensiones as partes de um lockup · não escrevas «Naptestul» com a fonte instalada em vez de usar o ficheiro · não coloques o logótipo sobre fundos agitados sem a caixa escura · não pintes o peso de latão sobre fundos claros · não uses o símbolo ao lado do wordmark com N a prumo (dois prumos).

## 7. Site: a marca na meia-luz

Na página inicial, o cursor funciona como um foco de luz fraco que revela o nome e o logótipo. Regras: fundo `#0B0C10`; marca na versão acento-escuro; a área iluminada mostra a marca a 100 % e o resto fica entre 0 e 5 % de opacidade. Sugestão opcional: deixar o peso de latão sempre visível a 100 %, como único ponto fixo da página — o foco revela a letra à volta dele.

## 8. Contacto e originais

Dúvidas sobre o uso: André Pimenta de Castro, `geral@naptestul.pt`. Originais: pasta `kit/` (SVG + PNG), ficheiros de trabalho e geradores em `tools/` (Python; regeneram todo o kit a partir dos parâmetros), fonte Manrope e licença em `fonts/`.
