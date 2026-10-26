# Naptestul — notas de entrega (kit final, 24-10-2026)

## O que está no kit

```
kit/
├── 01-marca-principal/   «Naptestul» com o N a prumo — preto · branco · latão · acento-escuro (+ png/ 600 e 2400 px)
├── 02-simbolo/           o N a prumo isolado, nas mesmas quatro cores; corte pequeno (-pequeno) para 16–32 px (+ png/ 256 e 1024 px)
├── 03-wordmark/          «Naptestul» com N normal (para usar ao lado do símbolo)
├── 04-empilhado/         símbolo sobre o wordmark, para formatos quadrados
├── 05-naptestul-luz/     «Naptestul · LUZ»
├── 06-icones-web/        favicon.ico (16/32/48), favicon.svg, favicon-16/32/48.png, apple-touch-icon.png (180),
│                         icon-192/512.png, maskable-512.png, site.webmanifest, head-snippet.html,
│                         ícone de app (quadrado escuro arredondado) e avatar quadrado, com e sem acento
├── 07-apresentacao/      apresentacao.html (board com maquetes) + slides/ em PNG + spec.json
├── diretrizes.md / .html / .pdf   diretrizes compactas em português europeu
├── notas-de-entrega.md   este ficheiro
└── geometria.json        medidas de construção (para quem quiser reconstruir ou animar)
```

Ficheiros de trabalho (fora do kit): `tools/` (geradores em Python — `build_final.py` regenera todo o kit a partir dos parâmetros; `text2path.py` converte texto em contornos com fontTools; `halflight.py` simula o foco de luz), `fonts/` (Manrope e licença OFL), `round1/` (folhas de conceitos e testes das rondas anteriores), `brief.md` e `conceitos.md`.

## Racional em três frases

A Naptestul é a empresa calma e precisa por trás da LUZ. Um fio-de-prumo é o instrumento de quem mede antes de fazer, e «a prumo» é compostura e exatidão em português — por isso a primeira perna do N é um prumo, pendurado do braço da letra por uma pequena folga. O símbolo é a inicial do nome, o peso tem exatamente a largura da haste e, sobre o quase-preto do site, é o único ponto em latão: a luz fica para a LUZ.

## Construção (para reconstruir ou animar)

- Tudo deriva do tipo de letra Manrope: altura de maiúscula 108, haste 18,05 (peso 700) ou 17,11 (660, versão para escuro), largura do N 86,7, diagonal 4 % mais fina que a haste, ângulo resultante 56,6°.
- Fio: 45 % da haste, centrado no eixo da haste, pendurado do braço com uma folga de 3,4 % da altura (perpendicular ao corte, paralelo à diagonal).
- Peso: anel 0,65 × 0,25 hastes; corpo 1,0 × 0,7 hastes; ponta a 70°; a ponta desce 4 % da altura abaixo da linha de base (overshoot de forma pontiaguda).
- Corte pequeno: fio a 70 %, sem anel, corpo 0,85, ponta a 60°, folga 4,5 %, N a 78 % da tela.
- Símbolo: tela 256, N com 184 de altura (72 %). Lockups: altura de tela = maiúscula + descendente do «p» + 2 × ½ maiúscula.
- Empilhado: símbolo com 1,9 × altura de maiúscula, intervalo de 0,45 × maiúscula, tudo centrado.

## Testes feitos

- `svg_audit.py`: 100/100 nos símbolos, 99/100 nos lockups (o aviso de ângulo no lockup «· LUZ» é a diagonal do Z da fonte).
- Escada de tamanhos 16→256 px e teste de pixel a 16/32/48: o N lê-se em todos; abaixo de 32 px o corte pequeno mantém o fio a ≥ 1 px.
- Uma cor, invertido, cinzento, desfocado, espelhado (И com prumo — sem leitura indesejada), rodado 180° (N com seta para cima — só de pernas para o ar).
- Teste de prateleira contra 11 marcas de IA/ML da biblioteca: destaca-se por ser sólido e a uma cor.
- Teste de meia-luz sobre #0B0C10 (foco parcial): reconhece-se iluminado só no peso, só no braço ou só na haste direita.
- Contrastes: branco quente/quase-preto 17,1:1; latão/quase-preto 8,3:1; cinza/quase-preto 6,1:1; preto/branco 18,9:1.

## Pontos em aberto

1. **Marca registada.** Não posso garantir disponibilidade. Antes de usar em público: pesquisa no INPI e na EUIPO (classes 9, 35, 42) e pesquisa por imagem. Marcas próximas a verificar: N em fita (Netflix, Namecheap), N com diagonal prolongada (Next.js) — diferentes, mas convém confirmar.
2. **Pantone / prova de cor.** Os CMYK são conversões; para impressão séria pede uma prova e fixa o Pantone do latão com a gráfica.
3. **LUZ.** Quando o produto tiver marca própria, o lockup «Naptestul · LUZ» deve ser revisto com o novo símbolo; a regra «a luz é da LUZ» mantém-se (o latão da Naptestul é cor de instrumento, não de lâmpada).
4. **Versão a uma cor em latão sobre branco** existe por completude (gravação, relevo), mas não cumpre contraste para ecrã — não a uses em texto ou interfaces.
5. **Animação do site.** A folga entre o braço e o fio permite animar o prumo a estabilizar (uma oscilação curta até ficar vertical) sem alterar a geometria final — ideia para depois.
6. **Fontes.** Os ficheiros não dependem de fontes; para títulos e texto do site instala a Manrope (OFL) ou usa-a via Google Fonts.
