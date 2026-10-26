// naptestul.pt — o foco de luz da página inicial.
// O conteúdo está sempre no DOM; isto só move a máscara (--x/--y em .palco).
// Rato, dedo e foco do teclado levam a luz; parada, ela fica onde foi deixada.
(() => {
  'use strict';

  const palco = document.getElementById('palco');
  const marca = palco && palco.querySelector('.marca svg');
  const peso = marca && marca.querySelector('#peso');
  if (!palco || !marca || !peso) return;

  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');

  const SUAVE = 0.12;        // aproximação por frame quando a luz viaja sozinha (foco do teclado)

  let pos = null;            // posição atual da luz (px no palco)
  let alvo = null;           // para onde vai
  let suave = 1;             // 1 = salto imediato (rato, dedo)
  let frame = 0;

  const caixa = () => palco.getBoundingClientRect();

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

  function passo() {
    frame = 0;
    if (!alvo) return;
    if (!pos) pos = { ...alvo };
    pos.x += (alvo.x - pos.x) * suave;
    pos.y += (alvo.y - pos.y) * suave;
    if (Math.hypot(alvo.x - pos.x, alvo.y - pos.y) < 0.5) pos = { ...alvo };
    escrever(pos);
    if (pos.x !== alvo.x || pos.y !== alvo.y) pedirFrame();
  }

  function irPara(x, y, imediato) {
    alvo = { x, y };
    suave = imediato ? 1 : SUAVE;
    pedirFrame();
  }

  function pontoDoEvento(clientX, clientY) {
    const c = caixa();
    return [clientX - c.left, clientY - c.top];
  }

  // ---- Entradas ----

  function aoPonteiro(e) {
    if (reduzido.matches) return;
    const [x, y] = pontoDoEvento(e.clientX, e.clientY);
    irPara(x, y, true);
  }

  function aoTocar(e) {
    if (reduzido.matches || !e.touches.length) return;
    const t = e.touches[0];
    const [x, y] = pontoDoEvento(t.clientX, t.clientY);
    irPara(x, y, true);
  }

  function aoFoco(e) {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches(':focus-visible')) return;
    // Com movimento reduzido, a luz só salta para o que estiver fora dela (o rodapé).
    if (reduzido.matches && !el.closest('.rodape')) return;
    const r = el.getBoundingClientRect();
    const [x, y] = pontoDoEvento(r.left + r.width / 2, r.top + r.height / 2);
    irPara(x, y, reduzido.matches);
  }

  function aoSairDoFoco() {
    if (!reduzido.matches) return;
    requestAnimationFrame(() => {
      if (!palco.contains(document.activeElement)) limpar();
    });
  }

  function limpar() {
    pos = alvo = null;
    palco.style.removeProperty('--x');
    palco.style.removeProperty('--y');
  }

  // ---- Modo conforme as preferências ----

  function configurar() {
    limpar();
    fixarPeso();
  }

  palco.addEventListener('pointermove', aoPonteiro, { passive: true });
  palco.addEventListener('pointerdown', aoPonteiro, { passive: true });
  palco.addEventListener('touchstart', aoTocar, { passive: true });
  palco.addEventListener('touchmove', aoTocar, { passive: true });
  palco.addEventListener('focusin', aoFoco);
  palco.addEventListener('focusout', aoSairDoFoco);

  reduzido.addEventListener('change', configurar);
  new ResizeObserver(fixarPeso).observe(palco);
  if (document.fonts) document.fonts.ready.then(fixarPeso);

  configurar();
})();
