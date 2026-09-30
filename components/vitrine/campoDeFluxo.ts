// Peça da Vitrine: um campo de fluxo em Canvas 2D, sem bibliotecas.
//
// Este módulo é a parte pesada da Vitrine. Só é importado (via `import()`)
// quando a seção entra na tela e o leitor não pediu movimento reduzido; por
// isso vive num chunk separado. Regra em docs/adr/0002-vitrine.md.
//
// Leve no celular: DPR limitado, número de traços proporcional à área,
// 30 quadros por segundo em aparelhos modestos e pausa fora da tela.

/** Marca gravada no canvas; o e2e usa para achar o chunk desta peça. */
export const MARCA_DA_PECA = "vitrine-campo-de-fluxo";

export type Peca = {
  pausar(): void;
  retomar(): void;
  /** Para a animação e solta todos os recursos. */
  destruir(): void;
};

type Traco = { x: number; y: number; vida: number };

const DPR_MAXIMO = 1.5;
/** Área (em px CSS) por traço: quanto maior, menos traços. */
const AREA_POR_TRACO = 1400;
const TRACOS_MAXIMOS = 700;
const VIDA_MAXIMA = 240;

function aparelhoModesto(): boolean {
  const nucleos = navigator.hardwareConcurrency ?? 4;
  return nucleos <= 4 || window.matchMedia("(pointer: coarse)").matches;
}

/** Ângulo do fluxo no ponto (x, y) no instante t: soma de senos, barata. */
function angulo(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 0.0045 + t * 0.00021) * 1.6 +
    Math.cos(y * 0.0052 - t * 0.00017) * 1.6 +
    Math.sin((x + y) * 0.0018 + t * 0.00009)
  );
}

export function iniciarPeca(canvas: HTMLCanvasElement): Peca {
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.dataset.peca = MARCA_DA_PECA;
  if (!ctx) {
    return { pausar() {}, retomar() {}, destruir() {} };
  }

  const intervaloMinimo = aparelhoModesto() ? 1000 / 30 : 0;
  let largura = 0;
  let altura = 0;
  let tracos: Traco[] = [];
  let quadro = 0;
  let ultimo = 0;
  let rodando = false;
  let cores = lerCores();

  function lerCores() {
    const estilo = getComputedStyle(canvas);
    return {
      fundo: estilo.getPropertyValue("--background").trim() || "#ffffff",
      traco: estilo.getPropertyValue("--foreground").trim() || "#171717",
      destaque: estilo.getPropertyValue("--accent-text").trim() || "#3f5a00",
    };
  }

  function novoTraco(): Traco {
    return {
      x: Math.random() * largura,
      y: Math.random() * altura,
      vida: Math.floor(Math.random() * VIDA_MAXIMA),
    };
  }

  function redimensionar() {
    const caixa = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);
    largura = Math.max(1, Math.round(caixa.width));
    altura = Math.max(1, Math.round(caixa.height));
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const quantidade = Math.min(
      TRACOS_MAXIMOS,
      Math.round((largura * altura) / AREA_POR_TRACO),
    );
    tracos = Array.from({ length: quantidade }, novoTraco);
    cores = lerCores();
    ctx!.fillStyle = cores.fundo;
    ctx!.fillRect(0, 0, largura, altura);
  }

  function desenhar(agora: number) {
    if (!rodando) return;
    quadro = requestAnimationFrame(desenhar);
    if (agora - ultimo < intervaloMinimo) return;
    ultimo = agora;

    // Rastro: cobre o quadro anterior com o fundo quase transparente.
    ctx!.globalAlpha = 0.08;
    ctx!.fillStyle = cores.fundo;
    ctx!.fillRect(0, 0, largura, altura);

    ctx!.lineWidth = 1;
    ctx!.globalAlpha = 0.55;
    ctx!.beginPath();
    ctx!.strokeStyle = cores.traco;
    for (let i = 0; i < tracos.length; i++) {
      const p = tracos[i];
      if (i % 5 === 0) continue;
      avancar(p, agora);
    }
    ctx!.stroke();

    // Um em cada cinco traços na cor de destaque, para dar profundidade.
    ctx!.beginPath();
    ctx!.strokeStyle = cores.destaque;
    for (let i = 0; i < tracos.length; i += 5) avancar(tracos[i], agora);
    ctx!.stroke();
    ctx!.globalAlpha = 1;
  }

  function avancar(p: Traco, agora: number) {
    const a = angulo(p.x, p.y, agora);
    const nx = p.x + Math.cos(a) * 1.4;
    const ny = p.y + Math.sin(a) * 1.4;
    ctx!.moveTo(p.x, p.y);
    ctx!.lineTo(nx, ny);
    p.x = nx;
    p.y = ny;
    p.vida += 1;
    if (p.vida > VIDA_MAXIMA || nx < 0 || ny < 0 || nx > largura || ny > altura) {
      Object.assign(p, novoTraco(), { vida: 0 });
    }
  }

  function pausar() {
    rodando = false;
    cancelAnimationFrame(quadro);
  }

  function retomar() {
    if (rodando) return;
    rodando = true;
    quadro = requestAnimationFrame(desenhar);
  }

  const observador = new ResizeObserver(redimensionar);
  observador.observe(canvas);
  const temaEscuro = window.matchMedia("(prefers-color-scheme: dark)");
  const aoMudarTema = () => redimensionar();
  temaEscuro.addEventListener("change", aoMudarTema);

  redimensionar();
  retomar();

  return {
    pausar,
    retomar,
    destruir() {
      pausar();
      observador.disconnect();
      temaEscuro.removeEventListener("change", aoMudarTema);
    },
  };
}
