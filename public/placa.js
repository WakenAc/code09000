// naptestul.pt — a placa de circuito por trás da página inicial.
// A marca fica num encapsulamento central; de cada pino sai uma pista até à margem.
// Geometria procedimental com semente fixa (igual em cada visita para a mesma janela).
// Em repouso tudo está a 0 %; a corrente entra onde o ponteiro passa e propaga-se.
(() => {
  'use strict';

  const tela = document.getElementById('placa');
  const marca = document.querySelector('.marca svg');
  const ligacao = document.querySelector('.em-breve');
  if (!tela || !marca || !tela.getContext) return;

  const ctx = tela.getContext('2d');
  const contraste = matchMedia('(prefers-contrast: more), (forced-colors: active)');
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');

  const BRANCO = '#F4EFE6';
  const LATAO = '#C9A45C';
  const SEMENTE = 0x4e415054;
  const ALCANCE = 160;          // px: o ponteiro "toca" numa pista a menos disto
  const VELOCIDADE = 0.6;       // px/ms (600 px/s)
  const PERCURSO = 600;         // px que a corrente do ponteiro percorre antes de se esgotar
  const DESCIDA = 1500;         // ms de carga 1 a 0
  const DESCIDA_IGNICAO = 600;  // a ignição é um impulso curto
  const IGNICAO = 1500;         // ms até a ignição chegar ao fim da pista mais longa
  const ESTATICA = 0.3;         // pistas junto à marca, com movimento reduzido
  const NIVEIS = 6;             // níveis de alfa (um caminho por nível e por frame)
  // Direções em sentido horário: E, SE, S, SO, O, NO, N, NE.
  const D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

  let dpr = 1;
  let largura = 0;
  let altura = 0;
  let pistas = [];
  let pacote = null;
  let zona = null;
  let frentes = [];
  let cargaPacote = 0;
  let taxaPacote = 1 / DESCIDA;
  let ativo = false;
  let primeira = true;
  let frame = 0;
  let ultimo = 0;

  function aleatorio(semente) {
    let a = semente >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- Geometria ----

  function gerar() {
    const g = largura < 640 ? 8 : 10;            // célula da grelha de ocupação
    const total = largura < 640 ? 20 : 48;       // pistas principais
    const rnd = aleatorio(SEMENTE);
    const M = 4;                                 // células para lá das margens
    const ox = -M * g;
    const oy = -M * g;
    const cols = Math.ceil((largura + 2 * M * g) / g);
    const lins = Math.ceil((altura + 2 * M * g) / g);
    const ocupado = new Int32Array(cols * lins);
    const dentro = (i, j) => i >= 0 && j >= 0 && i < cols && j < lins;
    const livre = (i, j) => dentro(i, j) && ocupado[j * cols + i] === 0;
    const ocupar = (i, j, v) => { if (dentro(i, j)) ocupado[j * cols + i] = v; };
    const celula = (x, y) => [Math.floor((x - ox) / g), Math.floor((y - oy) / g)];
    const centro = ([i, j]) => [ox + (i + 0.5) * g, oy + (j + 0.5) * g];

    // Zona livre: o SVG já inclui ½ altura do N à volta das letras.
    const m = marca.getBoundingClientRect();
    zona = { x0: m.left, y0: m.top, x1: m.right, y1: m.bottom };
    const folga = 10;
    const [a0, b0] = celula(zona.x0 - folga, zona.y0 - folga);
    const [a1, b1] = celula(zona.x1 + folga, zona.y1 + folga);
    pacote = { x0: ox + a0 * g, y0: oy + b0 * g, x1: ox + (a1 + 1) * g, y1: oy + (b1 + 1) * g, raio: Math.round(g * 1.2) };
    // O encapsulamento e o anel dos pinos ficam vedados.
    for (let j = b0 - 1; j <= b1 + 1; j++) for (let i = a0 - 1; i <= a1 + 1; i++) ocupar(i, j, -1);
    // «Em breve…» também: as pistas contornam-no.
    if (ligacao) {
      const r = ligacao.getBoundingClientRect();
      const cx = (r.left + r.right) / 2;
      const meia = r.width / 2 + 8;
      const [c0, l0] = celula(cx - meia, r.top - 8);
      const [c1, l1] = celula(cx + meia, r.bottom + 8);
      for (let j = l0; j <= l1; j++) for (let i = c0; i <= c1; i++) ocupar(i, j, -1);
    }

    // Pinos ao longo dos quatro lados, em proporção ao comprimento de cada um.
    const w = a1 - a0 + 1;
    const h = b1 - b0 + 1;
    const porLado = (n) => Math.max(1, Math.round((total * n) / (2 * w + 2 * h)));
    const lados = [
      { n: Math.min(porLado(w), w >> 1), comp: w, dir: 6, lat: [1, 0], pos: (k) => [a0 + k, b0 - 1], base: (x) => [x, pacote.y0] },
      { n: Math.min(porLado(w), w >> 1), comp: w, dir: 2, lat: [1, 0], pos: (k) => [a0 + k, b1 + 1], base: (x) => [x, pacote.y1] },
      { n: Math.min(porLado(h), h >> 1), comp: h, dir: 4, lat: [0, 1], pos: (k) => [a0 - 1, b0 + k], base: (_, y) => [pacote.x0, y] },
      { n: Math.min(porLado(h), h >> 1), comp: h, dir: 0, lat: [0, 1], pos: (k) => [a1 + 1, b0 + k], base: (_, y) => [pacote.x1, y] },
    ];
    const pinos = [];
    for (const lado of lados) {
      // Só posições com saída livre (por baixo, o «Em breve…» tapa as do meio).
      const [dx, dy] = D[lado.dir];
      const livres = [];
      for (let k = 0; k < lado.comp; k++) {
        const [i, j] = lado.pos(k);
        if (livre(i + dx, j + dy) && livre(i + 2 * dx, j + 2 * dy)) livres.push(k);
      }
      const n = Math.min(lado.n, livres.length >> 1);
      const meio = (lado.comp - 1) / 2 || 1;
      const lista = [];
      for (let q = 0; q < n; q++) {
        const k = livres[Math.round(((q + 0.5) * livres.length) / n - 0.5)];
        lista.push({ lado, cel: lado.pos(k), t: (k - meio) / meio });
      }
      // Do centro para fora: as pistas centrais saem direitas, as outras abrem em leque.
      lista.sort((p, q) => Math.abs(p.t) - Math.abs(q.t));
      pinos.push(lista);
    }
    const ordem = [];
    for (let k = 0; ordem.length < pinos.flat().length; k++) for (const l of pinos) if (l[k]) ordem.push(l[k]);

    function tracar(inicio, dir0, lat, t, dirInicial, maxPassos, id) {
      const celulas = [inicio];
      const c1 = (dir0 + 1) % 8;
      const c2 = (dir0 + 7) % 8;
      const dot = (d) => D[d][0] * lat[0] + D[d][1] * lat[1];
      const [mais, menos] = dot(c1) > 0 ? [c1, c2] : [c2, c1];
      const preferido = () => (rnd() < 0.5 + 0.45 * Math.abs(t) ? (t >= 0 ? mais : menos) : (t >= 0 ? menos : mais));
      let dir = dirInicial;
      let corrida = 2 + Math.floor(rnd() * 3);
      let [ci, cj] = inicio;
      let saiu = false;
      for (let passo = 0; passo < maxPassos; passo++) {
        if (corrida <= 0) {
          if (dir !== dir0) { dir = dir0; corrida = 3 + Math.floor(rnd() * 10); }
          else if (rnd() < 0.45 + 0.3 * Math.abs(t)) { dir = preferido(); corrida = 1 + Math.floor(rnd() * (4 + 10 * Math.abs(t))); }
          else corrida = 2 + Math.floor(rnd() * 8);
        }
        const opcoes = dir === dir0 ? [dir, preferido()] : [dir, dir0];
        if (!opcoes.includes(mais)) opcoes.push(mais);
        if (!opcoes.includes(menos)) opcoes.push(menos);
        let avancou = false;
        for (const d of opcoes) {
          const ni = ci + D[d][0];
          const nj = cj + D[d][1];
          if (!dentro(ni, nj)) { saiu = true; break; }
          if (!livre(ni, nj)) continue;
          // Duas diagonais não se cruzam: recusa se ambos os vizinhos ortogonais estão ocupados.
          if (D[d][0] && D[d][1] && !livre(ci + D[d][0], cj) && !livre(ci, cj + D[d][1])) continue;
          ocupar(ni, nj, id);
          celulas.push([ni, nj]);
          ci = ni; cj = nj;
          if (d !== dir) corrida = Math.min(corrida, 2);
          dir = d;
          corrida--;
          avancou = true;
          break;
        }
        if (saiu || !avancou) break;
      }
      return { celulas, saiu };
    }

    function criarPista(celulas, extra) {
      const n = celulas.length;
      const x = new Float32Array(n);
      const y = new Float32Array(n);
      const s = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        [x[i], y[i]] = centro(celulas[i]);
        if (i) s[i] = s[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);
      }
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < n; i++) {
        x0 = Math.min(x0, x[i]); x1 = Math.max(x1, x[i]);
        y0 = Math.min(y0, y[i]); y1 = Math.max(y1, y[i]);
      }
      return {
        x, y, s, n, x0, y0, x1, y1,
        c: new Float32Array(n), taxa: new Float32Array(n),
        ativa: false, ramos: new Map(), ...extra,
      };
    }

    const lista = [];
    let id = 1;
    for (const pino of ordem) {
      const { lado, cel, t } = pino;
      ocupar(cel[0], cel[1], id);
      // Um quarto das pistas acaba antes da margem, num ponto: comprimentos variados.
      const distancia = lado.dir === 6 ? cel[1] : lado.dir === 2 ? lins - cel[1] : lado.dir === 4 ? cel[0] : cols - cel[0];
      const max = rnd() < 0.25 ? Math.max(6, Math.round(distancia * (0.35 + rnd() * 0.45))) : 4000;
      const r = tracar(cel, lado.dir, lado.lat, t, lado.dir, max, id);
      if (r.celulas.length >= 3) {
        const [bx, by] = centro(cel);
        lista.push(criarPista(r.celulas, { principal: true, dir0: lado.dir, lat: lado.lat, t, base: lado.base(bx, by) }));
      }
      id++;
    }
    // Ramificações: algumas pistas abrem um ramo curto a 45°.
    for (const p of lista.slice()) {
      if (rnd() > 0.35 || p.n < 14) continue;
      const k = 4 + Math.floor(rnd() * (p.n - 10));
      const ida = [Math.round((p.x[k + 1] - p.x[k]) / Math.abs(p.x[k + 1] - p.x[k] || 1)), Math.round((p.y[k + 1] - p.y[k]) / Math.abs(p.y[k + 1] - p.y[k] || 1))];
      const dk = D.findIndex(([dx, dy]) => dx === ida[0] && dy === ida[1]);
      const dirRamo = dk === p.dir0 ? (rnd() < 0.5 ? (p.dir0 + 1) % 8 : (p.dir0 + 7) % 8) : p.dir0;
      const [ci, cj] = celula(p.x[k], p.y[k]);
      const r = tracar([ci, cj], p.dir0, p.lat, p.t, dirRamo, 6 + Math.floor(rnd() * 16), id++);
      if (r.celulas.length < 5) continue;
      const ramo = criarPista(r.celulas, { principal: false, pai: p, k });
      if (!p.ramos.has(k)) p.ramos.set(k, []);
      p.ramos.get(k).push(ramo);
      lista.push(ramo);
    }
    pistas = lista;
  }

  // ---- Desenho ----

  function pintar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, tela.width, tela.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const caminhos = [];
    for (const p of pistas) {
      if (!p.ativa) continue;
      for (let i = 0; i < p.n - 1; i++) {
        const a = (p.c[i] + p.c[i + 1]) / 2;
        if (a < 0.01) continue;
        const b = Math.min(NIVEIS - 1, Math.floor(a * NIVEIS));
        if (!caminhos[b]) caminhos[b] = new Path2D();
        caminhos[b].moveTo(p.x[i], p.y[i]);
        caminhos[b].lineTo(p.x[i + 1], p.y[i + 1]);
      }
    }
    // Pistas: brilho numa passagem larga e ténue, depois o traço (até 80 %).
    ctx.strokeStyle = BRANCO;
    caminhos.forEach((caminho, b) => {
      if (!caminho) return;
      const nivel = ((b + 1) / NIVEIS) * 0.8;
      ctx.globalAlpha = nivel * 0.16;
      ctx.lineWidth = 5;
      ctx.stroke(caminho);
      ctx.globalAlpha = nivel;
      ctx.lineWidth = 1.25;
      ctx.stroke(caminho);
    });

    // Pinos, pontos terminais e encapsulamento: latão até 70 %.
    ctx.strokeStyle = LATAO;
    ctx.lineWidth = 1.5;
    for (const p of pistas) {
      if (!p.ativa) continue;
      if (p.principal && p.c[0] > 0.01) {
        ctx.globalAlpha = p.c[0] * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.base[0], p.base[1]);
        ctx.lineTo(p.x[0], p.y[0]);
        ctx.stroke();
      }
      // Ponto terminal (via): halo numa passagem ténue, depois o anel com centro.
      const f = p.c[p.n - 1];
      if (f > 0.01) {
        const vx = p.x[p.n - 1];
        const vy = p.y[p.n - 1];
        ctx.fillStyle = LATAO;
        ctx.globalAlpha = f * 0.7 * 0.22;
        ctx.beginPath();
        ctx.arc(vx, vy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = f * 0.7;
        ctx.beginPath();
        ctx.arc(vx, vy, 1.8, 0, Math.PI * 2);
        ctx.arc(vx, vy, 0.7, 0, Math.PI * 2, true);
        ctx.fill();
      }
    }
    if (cargaPacote > 0.01) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pacote.x0, pacote.y0, pacote.x1 - pacote.x0, pacote.y1 - pacote.y0, pacote.raio);
      else ctx.rect(pacote.x0, pacote.y0, pacote.x1 - pacote.x0, pacote.y1 - pacote.y0);
      ctx.globalAlpha = cargaPacote * 0.7 * 0.2;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = cargaPacote * 0.7;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---- Corrente ----

  function acender(p, i, amp, taxa) {
    if (amp > p.c[i]) { p.c[i] = amp; p.taxa[i] = taxa; }
    p.ativa = true;
  }

  function lancar(p, i, dir, amp0, vel, limite, taxa) {
    acender(p, i, amp0, taxa);
    frentes.push({ p, s: p.s[i], i: i + dir, dir, amp0, vel, limite, taxa, gasto: 0 });
  }

  function carregarPacote(amp, taxa) {
    if (amp > cargaPacote) { cargaPacote = amp; taxaPacote = taxa; }
  }

  // Avança uma frente; devolve false quando se esgota.
  function avancar(f, dt) {
    const p = f.p;
    const passo = f.vel * dt;
    const s1 = f.s + f.dir * passo;
    f.s = s1;
    f.gasto += passo;
    const amp = f.limite === Infinity ? f.amp0 : f.amp0 * (1 - 0.7 * Math.min(1, f.gasto / f.limite));
    while (f.i >= 0 && f.i < p.n && (f.dir > 0 ? p.s[f.i] <= s1 : p.s[f.i] >= s1)) {
      acender(p, f.i, amp, f.taxa);
      // Num cruzamento com um ramo, a corrente também segue por ele.
      const ramos = p.ramos.get(f.i);
      if (ramos) for (const r of ramos) if (r.c[0] < amp * 0.8) lancar(r, 0, 1, amp, f.vel, f.limite - f.gasto, f.taxa);
      f.i += f.dir;
    }
    if (f.i < 0) {
      if (p.principal) carregarPacote(amp, f.taxa);
      else if (p.pai.c[p.k] < amp * 0.8) {
        lancar(p.pai, p.k, 1, amp, f.vel, f.limite - f.gasto, f.taxa);
        lancar(p.pai, p.k, -1, amp, f.vel, f.limite - f.gasto, f.taxa);
      }
      return false;
    }
    return f.i < p.n && f.gasto < f.limite;
  }

  function passo(agora) {
    frame = 0;
    const dt = Math.min(50, ultimo ? agora - ultimo : 16);
    ultimo = agora;

    for (let i = frentes.length - 1; i >= 0; i--) if (!avancar(frentes[i], dt)) frentes.splice(i, 1);

    let vivas = false;
    for (const p of pistas) {
      if (!p.ativa) continue;
      let maior = 0;
      for (let i = 0; i < p.n; i++) {
        if (p.c[i] <= 0) continue;
        p.c[i] -= dt * p.taxa[i];
        if (p.c[i] < 0.01) p.c[i] = 0;
        else if (p.c[i] > maior) maior = p.c[i];
      }
      p.ativa = maior > 0;
      vivas = vivas || p.ativa;
    }
    cargaPacote -= dt * taxaPacote;
    if (cargaPacote < 0.01) cargaPacote = 0;

    pintar();
    if (frentes.length || vivas || cargaPacote > 0) pedirFrame();
    else ultimo = 0; // parada: nada de frames em vazio
  }

  function pedirFrame() {
    if (ativo && !frame) frame = requestAnimationFrame(passo);
  }

  // A corrente entra no ponto de cada pista mais perto do ponteiro (a menos de ALCANCE).
  function injetar(x, y) {
    const r2 = ALCANCE * ALCANCE;
    for (const p of pistas) {
      if (x < p.x0 - ALCANCE || x > p.x1 + ALCANCE || y < p.y0 - ALCANCE || y > p.y1 + ALCANCE) continue;
      let melhor = -1;
      let menor = r2;
      for (let i = 0; i < p.n; i++) {
        const d = (p.x[i] - x) ** 2 + (p.y[i] - y) ** 2;
        if (d < menor) { menor = d; melhor = i; }
      }
      if (melhor < 0 || p.c[melhor] >= 0.5) continue;
      lancar(p, melhor, 1, 1, VELOCIDADE, PERCURSO, 1 / DESCIDA);
      lancar(p, melhor, -1, 1, VELOCIDADE, PERCURSO, 1 / DESCIDA);
    }
    pedirFrame();
  }

  // Ignição: um impulso sai do encapsulamento por todas as pistas e apaga.
  function ignicao() {
    let maior = 0;
    for (const p of pistas) maior = Math.max(maior, (p.principal ? 0 : p.pai.s[p.k]) + p.s[p.n - 1]);
    const vel = maior / IGNICAO;
    carregarPacote(1, 1 / DESCIDA_IGNICAO);
    for (const p of pistas) if (p.principal) lancar(p, 0, 1, 1, vel, Infinity, 1 / DESCIDA_IGNICAO);
    pintar(); // já no primeiro desenho da página: a camada do canvas compõe-se antes do FCP
    pedirFrame();
  }

  // Movimento reduzido: sem corrente; as pistas junto à marca ficam acesas a 30 %.
  function estatica() {
    const m = marca.getBoundingClientRect();
    const cx = m.left + m.width / 2;
    const cy = m.top + m.height / 2;
    const raio = m.width * 0.72;
    for (const p of pistas) {
      for (let i = 0; i < p.n; i++) if (Math.hypot(p.x[i] - cx, p.y[i] - cy) < raio) p.c[i] = ESTATICA;
      p.ativa = p.c.some((v) => v > 0);
    }
    cargaPacote = ESTATICA;
    pintar();
  }

  // ---- Entradas: a mesma posição do ponteiro que move a luz ----

  function aoPonteiro(e) { injetar(e.clientX, e.clientY); }
  function aoTocar(e) { for (const t of e.touches) injetar(t.clientX, t.clientY); }

  // ---- Configuração ----

  function configurar() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    ultimo = 0;
    frentes = [];
    cargaPacote = 0;
    ativo = false;
    window.removeEventListener('pointermove', aoPonteiro);
    window.removeEventListener('pointerdown', aoPonteiro);
    window.removeEventListener('touchmove', aoTocar);
    if (contraste.matches) { pistas = []; return; }  // o canvas nem é mostrado

    dpr = Math.min(window.devicePixelRatio || 1, 2); // traços finos não ganham com mais
    largura = window.innerWidth;
    altura = window.innerHeight;
    tela.width = Math.round(largura * dpr);
    tela.height = Math.round(altura * dpr);
    gerar();

    if (reduzido.matches) { primeira = false; estatica(); return; }

    ativo = true;
    window.addEventListener('pointermove', aoPonteiro, { passive: true });
    window.addEventListener('pointerdown', aoPonteiro, { passive: true });
    window.addEventListener('touchmove', aoTocar, { passive: true });
    if (primeira) { primeira = false; ignicao(); } else pintar();
  }

  // Geometria para os testes (só leitura).
  tela.geometria = () => ({
    zona, pacote,
    pistas: pistas.map((p) => ({ principal: p.principal, x: [...p.x], y: [...p.y], s: [...p.s] })),
  });

  // Mudanças de preferências ou de janela: reconfigura numa tarefa à parte, uma vez.
  let pendente = 0;
  const agendar = () => {
    clearTimeout(pendente);
    pendente = setTimeout(configurar, 0);
  };
  for (const q of [contraste, reduzido]) q.addEventListener('change', agendar);
  window.addEventListener('resize', agendar);
  // O primeiro aviso chega na primeira disposição, antes do primeiro desenho: a placa
  // arranca aí mesmo, para a sua primeira composição entrar no desenho inicial.
  let arrancou = false;
  new ResizeObserver(() => {
    if (arrancou) agendar();
    else { arrancou = true; configurar(); }
  }).observe(marca);
})();
