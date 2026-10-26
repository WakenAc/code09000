// naptestul.pt — o foco de luz da página inicial.
// O conteúdo está sempre no DOM; isto só move a máscara (--x/--y em .palco).
(() => {
  'use strict';

  const palco = document.getElementById('palco');
  const marca = palco && palco.querySelector('.marca svg');
  const peso = marca && marca.querySelector('#peso');
  if (!palco || !marca || !peso) return;

  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const tatil = matchMedia('(hover: none), (pointer: coarse)');

  const PERIODO = 5200;      // ms por volta da deriva (meia volta = nome revelado de ponta a ponta)
  const ESPERA_TOQUE = 1400; // ms depois do último toque até a luz voltar a derivar
  const SUAVE = 0.12;        // aproximação por frame quando a luz viaja sozinha

  let pos = null;            // posição atual da luz (px no palco)
  let alvo = null;           // para onde vai
  let suave = 1;             // 1 = salto imediato (rato, dedo)
  let derivaDesde = 0;       // instante de arranque da deriva; 0 = parada
  let temporizador = 0;
  let frame = 0;
  let raio = 140;            // --r do CSS, lido só quando o modo muda (não em cada frame)

  const caixa = () => palco.getBoundingClientRect();

  // Centro e amplitude da deriva, a partir das letras do logótipo (sem a zona livre).
  function geometria() {
    const c = caixa();
    const m = marca.getBoundingClientRect();
    const unidade = m.width / 816;
    const esquerda = m.left - c.left + 64.5 * unidade;
    const direita = m.left - c.left + 749.7 * unidade;
    return {
      cx: (esquerda + direita) / 2,
      cy: m.top - c.top + m.height / 2,
      ax: Math.max(0, (direita - esquerda) / 2 - raio * 0.2),
      ay: m.height * 0.14,
    };
  }

  function escrever(p) {
    palco.style.setProperty('--x', p.x.toFixed(1) + 'px');
    palco.style.setProperty('--y', p.y.toFixed(1) + 'px');
  }

  // Segunda camada da máscara, do tamanho do peso de latão: dá-lhe uma luz própria em repouso (hoje 0 %).
  function fixarPeso() {
    const c = caixa();
    const r = peso.getBoundingClientRect();
    palco.style.setProperty('--px', (r.left - c.left - 1).toFixed(1) + 'px');
    palco.style.setProperty('--py', (r.top - c.top).toFixed(1) + 'px');
    palco.style.setProperty('--pw', (r.width + 2).toFixed(1) + 'px');
    palco.style.setProperty('--ph', (r.height + 1).toFixed(1) + 'px');
  }

  function pedirFrame() {
    if (!frame) frame = requestAnimationFrame(passo);
  }

  function passo(agora) {
    frame = 0;
    if (derivaDesde) {
      const g = geometria();
      const fase = ((agora - derivaDesde) / PERIODO) * Math.PI * 2;
      // Elipse em torno do nome, a começar na ponta esquerda.
      alvo = { x: g.cx - g.ax * Math.cos(fase), y: g.cy - g.ay * Math.sin(fase) };
    }
    if (!alvo) return;
    if (!pos) pos = { ...alvo };
    pos.x += (alvo.x - pos.x) * suave;
    pos.y += (alvo.y - pos.y) * suave;
    if (Math.hypot(alvo.x - pos.x, alvo.y - pos.y) < 0.5) {
      pos = { ...alvo };
      if (derivaDesde) suave = 1;
    }
    escrever(pos);
    if (derivaDesde || pos.x !== alvo.x || pos.y !== alvo.y) pedirFrame();
  }

  function irPara(x, y, imediato) {
    alvo = { x, y };
    suave = imediato ? 1 : SUAVE;
    pedirFrame();
  }

  function derivar(desdeAgora) {
    clearTimeout(temporizador);
    if (desdeAgora) {
      derivaDesde = performance.now();
      if (pos) suave = SUAVE; // vem de onde o dedo a deixou, sem saltos
      pedirFrame();
    } else {
      temporizador = setTimeout(() => derivar(true), ESPERA_TOQUE);
    }
  }

  function pararDeriva() {
    derivaDesde = 0;
    clearTimeout(temporizador);
  }

  function pontoDoEvento(clientX, clientY) {
    const c = caixa();
    return [clientX - c.left, clientY - c.top];
  }

  // ---- Entradas ----

  function aoPonteiro(e) {
    if (reduzido.matches) return;
    if (e.pointerType === 'touch') { pararDeriva(); }
    const [x, y] = pontoDoEvento(e.clientX, e.clientY);
    irPara(x, y, true);
  }

  function aoTocar(e) {
    if (reduzido.matches || !e.touches.length) return;
    pararDeriva();
    const t = e.touches[0];
    const [x, y] = pontoDoEvento(t.clientX, t.clientY);
    irPara(x, y, true);
  }

  function aoLargar(e) {
    if (reduzido.matches) return;
    if (e.pointerType === 'touch' || e.type === 'touchend') derivar(false);
  }

  function aoFoco(e) {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches(':focus-visible')) return;
    // Com movimento reduzido, a luz só salta para o que estiver fora dela (o rodapé).
    if (reduzido.matches && !el.closest('.rodape')) return;
    pararDeriva();
    const r = el.getBoundingClientRect();
    const [x, y] = pontoDoEvento(r.left + r.width / 2, r.top + r.height / 2);
    irPara(x, y, reduzido.matches);
  }

  function aoSairDoFoco() {
    if (reduzido.matches) {
      requestAnimationFrame(() => {
        if (!palco.contains(document.activeElement)) limpar();
      });
    } else if (tatil.matches) {
      derivar(false);
    }
  }

  function limpar() {
    pararDeriva();
    pos = alvo = null;
    palco.style.removeProperty('--x');
    palco.style.removeProperty('--y');
  }

  // ---- Modo conforme o dispositivo e as preferências ----

  function configurar() {
    limpar();
    raio = parseFloat(getComputedStyle(palco).getPropertyValue('--r')) || 140;
    fixarPeso();
    if (reduzido.matches) return;             // luz fixa definida no CSS
    if (tatil.matches) {
      const g = geometria();
      pos = { x: g.cx - g.ax, y: g.cy };      // onde o CSS a deixou: início do nome
      derivar(true);
    }
  }

  palco.addEventListener('pointermove', aoPonteiro, { passive: true });
  palco.addEventListener('pointerdown', aoPonteiro, { passive: true });
  palco.addEventListener('pointerup', aoLargar, { passive: true });
  palco.addEventListener('pointercancel', aoLargar, { passive: true });
  palco.addEventListener('touchstart', aoTocar, { passive: true });
  palco.addEventListener('touchmove', aoTocar, { passive: true });
  palco.addEventListener('touchend', aoLargar, { passive: true });
  palco.addEventListener('focusin', aoFoco);
  palco.addEventListener('focusout', aoSairDoFoco);

  reduzido.addEventListener('change', configurar);
  tatil.addEventListener('change', configurar);
  new ResizeObserver(fixarPeso).observe(palco);
  if (document.fonts) document.fonts.ready.then(fixarPeso);

  configurar();
})();
