// Fundo estrelado da Hero: duas camadas de estrelas em <canvas>, ligadas à
// rolagem em parallax e com um cintilar lento.
//
// Só é importado (via `import()`) por CeuDaHero depois da montagem, e nunca
// com movimento reduzido; vive num chunk próprio, pequeno e sem anime.js.
// Regras em docs/adr/0003-editorial-espacial-animejs.md.
//
// Custo: as estrelas são desenhadas uma vez (e de novo só quando a Hero muda
// de tamanho). A rolagem e o cintilar mexem apenas em `transform` e
// `opacity` das camadas, sem layout nem repintura contínua. Tudo pausa fora
// da tela e com a aba oculta.
//
// Celular fraco: versão leve, com uma camada só, menos estrelas, sem cintilar
// e sem alta densidade de pixels.

import { versaoParaEsteAparelho, type Versao } from "../animacao/aparelho";
import { corAleatoria } from "../animacao/cor-aleatoria";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DO_CEU = "ceu-estrelado";

type Estrela = {
  /** Posição como fração da largura e da altura da Hero. */
  x: number;
  y: number;
  /** Raio em px CSS. */
  r: number;
  alfa: number;
  /** Cor própria, sorteada na montagem. */
  cor: string;
};

type DefinicaoDaCamada = {
  quantidade: number;
  raio: [number, number];
  alfa: [number, number];
  /** Fração da rolagem que a camada acompanha (parallax). */
  fator: number;
  /** Cintilar: opacidade mínima da camada e duração de meio ciclo (ms). */
  cintilar?: { minimo: number; duracao: number };
};

const CAMADAS: Record<Versao, DefinicaoDaCamada[]> = {
  completa: [
    { quantidade: 150, raio: [0.4, 0.9], alfa: [0.18, 0.45], fator: 0.12, cintilar: { minimo: 0.75, duracao: 5200 } },
    { quantidade: 45, raio: [0.8, 1.5], alfa: [0.3, 0.6], fator: 0.3, cintilar: { minimo: 0.5, duracao: 3400 } },
  ],
  leve: [{ quantidade: 70, raio: [0.5, 1.2], alfa: [0.22, 0.5], fator: 0.2 }],
};

/** Gerador pseudoaleatório com semente: o mesmo céu a cada visita. */
function sorteador(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gerarEstrelas(def: DefinicaoDaCamada, semente: number): Estrela[] {
  const sortear = sorteador(semente);
  const entre = ([min, max]: [number, number]) => min + sortear() * (max - min);
  return Array.from({ length: def.quantidade }, () => ({
    x: sortear(),
    y: sortear(),
    r: entre(def.raio),
    alfa: entre(def.alfa),
    cor: corAleatoria(),
  }));
}

type Camada = {
  canvas: HTMLCanvasElement;
  estrelas: Estrela[];
  fator: number;
  cintilar: Animation | null;
};

export function iniciarCeu(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.ceu = MARCA_DO_CEU;
  moldura.dataset.versao = versao;

  const densidadeMaxima = versao === "leve" ? 1 : 2;

  const camadas: Camada[] = CAMADAS[versao].map((def, i) => {
    const canvas = document.createElement("canvas");
    canvas.className = "hero-ceu-camada";
    canvas.dataset.camada = String(i);
    moldura.appendChild(canvas);
    const cintilar = def.cintilar
      ? canvas.animate([{ opacity: 1 }, { opacity: def.cintilar.minimo }], {
          duration: def.cintilar.duracao,
          direction: "alternate",
          iterations: Infinity,
          easing: "ease-in-out",
        })
      : null;
    return { canvas, estrelas: gerarEstrelas(def, 41 + i * 17), fator: def.fator, cintilar };
  });

  // Entrada suave da camada (decorativa; o texto da Hero não depende dela).
  const entrada = moldura.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 900,
    easing: "ease-out",
  });

  function desenhar() {
    const largura = moldura.clientWidth;
    const altura = moldura.clientHeight;
    const densidade = Math.min(window.devicePixelRatio || 1, densidadeMaxima);
    for (const { canvas, estrelas } of camadas) {
      canvas.width = Math.max(1, Math.round(largura * densidade));
      canvas.height = Math.max(1, Math.round(altura * densidade));
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.setTransform(densidade, 0, 0, densidade, 0, 0);
      ctx.clearRect(0, 0, largura, altura);
      for (const e of estrelas) {
        ctx.globalAlpha = e.alfa;
        ctx.fillStyle = e.cor;
        ctx.beginPath();
        ctx.arc(e.x * largura, e.y * altura, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Redesenho por mudança de tamanho, no máximo uma vez por quadro.
  let quadroDoDesenho = 0;
  const agendarDesenho = () => {
    if (quadroDoDesenho) return;
    quadroDoDesenho = requestAnimationFrame(() => {
      quadroDoDesenho = 0;
      desenhar();
    });
  };
  const observadorDeTamanho = new ResizeObserver(agendarDesenho);
  observadorDeTamanho.observe(moldura);
  desenhar();

  // Parallax: cada camada desce uma fração do quanto a Hero já subiu.
  let quadroDaRolagem = 0;
  function aplicarRolagem() {
    quadroDaRolagem = 0;
    const subida = Math.max(0, -moldura.getBoundingClientRect().top);
    for (const { canvas, fator } of camadas) {
      canvas.style.transform = `translate3d(0, ${(subida * fator).toFixed(1)}px, 0)`;
    }
  }
  const aoRolar = () => {
    if (!quadroDaRolagem) quadroDaRolagem = requestAnimationFrame(aplicarRolagem);
  };

  let rodando = false;
  function retomar() {
    if (rodando) return;
    rodando = true;
    window.addEventListener("scroll", aoRolar, { passive: true });
    aplicarRolagem();
    for (const { cintilar } of camadas) cintilar?.play();
  }
  function pausar() {
    rodando = false;
    window.removeEventListener("scroll", aoRolar);
    cancelAnimationFrame(quadroDaRolagem);
    quadroDaRolagem = 0;
    for (const { cintilar } of camadas) cintilar?.pause();
  }

  retomar();

  return {
    pausar,
    retomar,
    destruir() {
      pausar();
      cancelAnimationFrame(quadroDoDesenho);
      observadorDeTamanho.disconnect();
      entrada.cancel();
      for (const { canvas, cintilar } of camadas) {
        cintilar?.cancel();
        canvas.remove();
      }
      delete moldura.dataset.ceu;
      delete moldura.dataset.versao;
    },
  };
}
