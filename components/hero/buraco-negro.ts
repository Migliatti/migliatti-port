// Buraco negro ao fundo da Hero, no estilo do Gargantua de Interestelar, com
// perspectiva 3D de verdade: o disco é um plano de círculos concêntricos que o
// navegador deita (`rotateX`) e inclina (`rotateZ`), visto com a câmera
// ELEVACAO graus acima dele. O anime.js conduz tudo, inclusive a pose: o disco
// entra deitando de pé até a pose final e depois deriva alguns graus, como uma
// câmera à deriva.
// Animado por cima do céu estrelado e atrás do texto.
//
// Só é importado (via `import()`) por BuracoNegroDaHero depois da montagem, e
// nunca com movimento reduzido; vive num chunk próprio, com os módulos do
// anime.js que usa. Regras em docs/adr/0003-editorial-espacial-animejs.md
// (emenda da issue #57).
//
// A moldura chega vazia do servidor: a cena nasce aqui. A cor é fixa
// (`--cor-buraco-negro`, complementar ao dourado), aplicada em `color` da
// moldura pelo CSS; o SVG usa `currentColor` e `--cor-buraco-negro-nucleo`.
// Só `transform` e `opacity` se movem.
//
// Camadas, de trás para frente (cada uma ocupa a cena inteira):
//   halo → arco de luz → metade de trás do disco → sombra e anel de fótons →
//   metade da frente do disco.
// As duas metades do disco são o mesmo plano com cortes opostos, na mesma
// pose, animadas juntas; a sombra fica entre elas, então o disco passa atrás
// dela em cima e na frente dela embaixo.
//
// Cada metade tem três elementos aninhados, para o anime.js animar um ângulo
// por elemento sem depender da ordem das funções de transformação:
//   rolagem (rotateZ, a inclinação na tela)
//     └ perspectiva (CSS `perspective`)
//         └ plano (rotateX, a elevação da câmera)
//
// Celular fraco: versão leve, com menos filetes, sem órbita e sem deriva.

import { animate, createTimeline, stagger, type JSAnimation, type Timeline } from "animejs";
import { versaoParaEsteAparelho, type Versao } from "../animacao/aparelho";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DO_BURACO_NEGRO = "buraco-negro-animado";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Raio da sombra (o centro preto), em unidades do viewBox. */
const R = 64;
/** Raios interno e externo do disco, em unidades do viewBox. */
const RAIO_INTERNO = R * 1.12;
const RAIO_EXTERNO = R * 4.2;

/** Quantos graus a câmera está acima do plano do disco. */
const ELEVACAO = 25;
/** `rotateX` do plano: 90° seria o disco de pé (visto de lado); 0°, de frente. */
const TOMBAMENTO = 90 - ELEVACAO;
/** `rotateZ` da inclinação na tela; negativo = o lado direito sobe. */
const INCLINACAO = -12;
/** Quantos graus a pose deriva depois da entrada. */
const DERIVA = 3;

const NUCLEO = "var(--cor-buraco-negro-nucleo)";

/** Anel de luz que o disco curva por cima da sombra. */
const CAMADAS_DO_ANEL: Array<{ largura: number; opacidade: number; miolo: boolean }> = [
  { largura: 26, opacidade: 0.12, miolo: false },
  { largura: 12, opacidade: 0.4, miolo: false },
  { largura: 4.5, opacidade: 0.95, miolo: true },
];
/** Raio do anel de luz, em unidades de R: rente à sombra. */
const RAIO_DO_ANEL = 1.22;
/** Fios finos no plano do disco (em unidades de R): fazem a inclinação aparecer. */
const FIOS = [1.6, 1.95, 2.4, 2.95, 3.5];

/**
 * Filetes de luz: arcos brilhantes que orbitam no plano do disco. `raio` em
 * unidades de R, `arco` é a fração da volta, `volta` o tempo de uma volta (s).
 */
type Filete = { raio: number; arco: number; largura: number; opacidade: number; volta: number };

const FILETES: Record<Versao, Filete[]> = {
  completa: [
    { raio: 1.5, arco: 0.22, largura: 2, opacidade: 0.85, volta: 26 },
    { raio: 2.1, arco: 0.3, largura: 2.4, opacidade: 0.7, volta: 38 },
    { raio: 2.9, arco: 0.18, largura: 2, opacidade: 0.6, volta: 52 },
    { raio: 3.7, arco: 0.25, largura: 1.6, opacidade: 0.5, volta: 68 },
  ],
  leve: [
    { raio: 2.1, arco: 0.3, largura: 2.4, opacidade: 0.7, volta: 38 },
    { raio: 3.2, arco: 0.22, largura: 1.8, opacidade: 0.55, volta: 60 },
  ],
};

type Lado = "traseira" | "frontal";

function elemento<K extends keyof SVGElementTagNameMap>(
  nome: K,
  atributos: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, nome);
  for (const [chave, valor] of Object.entries(atributos)) el.setAttribute(chave, String(valor));
  return el;
}

function gradiente(
  tipo: "linearGradient" | "radialGradient",
  atributos: Record<string, string | number>,
  paradas: Array<[number, number]>,
  cor = "currentColor",
) {
  const g = elemento(tipo, atributos);
  for (const [offset, opacidade] of paradas) {
    const parada = elemento("stop", { offset, "stop-opacity": opacidade });
    parada.style.stopColor = cor;
    g.appendChild(parada);
  }
  return g;
}

function caixa(classe: string): HTMLDivElement {
  const div = document.createElement("div");
  div.className = classe;
  return div;
}

/** SVG plano que ocupa a camada inteira; o centro do buraco negro é a origem. */
function svgDaCamada(): SVGSVGElement {
  const svg = elemento("svg", { viewBox: "-520 -200 800 400", focusable: "false" });
  svg.setAttribute("class", "bn-svg");
  return svg;
}

function apagado<T extends HTMLElement | SVGElement>(el: T): T {
  el.style.opacity = "0";
  return el;
}

/** Halo difuso, de frente. */
function criarHalo() {
  const camada = apagado(caixa("bn-camada"));
  const svg = svgDaCamada();
  const defs = elemento("defs", {});
  defs.appendChild(
    gradiente(
      "radialGradient",
      { id: "bn-halo" },
      [
        [0.12, 0],
        [0.2, 0.22],
        [0.42, 0.08],
        [1, 0],
      ],
    ),
  );
  svg.append(defs, elemento("ellipse", { rx: 420, ry: 200, fill: "url(#bn-halo)" }));
  camada.appendChild(svg);
  return camada;
}

/**
 * Anel de luz curvado ao redor da sombra: o disco de trás visto por cima dela.
 * Forte em cima e quase apagado embaixo; é circular, porque é a imagem
 * entortada pela gravidade, não o plano do disco. Só segue a inclinação.
 */
function criarArco() {
  const rolagem = apagado(caixa("bn-camada"));
  const svg = svgDaCamada();
  const defs = elemento("defs", {});
  for (const id of ["bn-anel", "bn-anel-miolo"] as const) {
    defs.appendChild(
      gradiente(
        "linearGradient",
        { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: -100, x2: 0, y2: 100 },
        [
          [0, 1],
          [0.35, 0.7],
          [0.6, 0.2],
          [1, 0.04],
        ],
        id === "bn-anel-miolo" ? NUCLEO : "currentColor",
      ),
    );
  }
  svg.appendChild(defs);
  for (const c of CAMADAS_DO_ANEL) {
    svg.appendChild(
      elemento("circle", {
        r: R * RAIO_DO_ANEL,
        fill: "none",
        stroke: c.miolo ? "url(#bn-anel-miolo)" : "url(#bn-anel)",
        "stroke-width": c.largura,
        opacity: c.opacidade,
      }),
    );
  }
  rolagem.appendChild(svg);
  return rolagem;
}

/** Sombra e anel de fótons, de frente: a sombra de um buraco negro é esférica. */
function criarSombra() {
  const camada = caixa("bn-camada");
  const svg = svgDaCamada();
  const sombra = elemento("circle", { r: R });
  sombra.dataset.sombra = "";
  sombra.style.fill = "var(--background)";
  const fotons = elemento("circle", {
    r: R + 2,
    fill: "none",
    "stroke-width": 1.4,
    "stroke-opacity": 0.7,
  });
  fotons.style.stroke = NUCLEO;
  apagado(fotons).dataset.fotons = "";
  svg.append(sombra, fotons);
  camada.appendChild(svg);
  return { camada, fotons };
}

/**
 * Uma metade do disco: o plano de círculos concêntricos, cortado ao meio no
 * espaço do próprio plano (por isso o corte gira junto com ele). `traseira` é
 * a metade longe da câmera, `frontal` a próxima.
 */
function criarMetadeDoDisco(lado: Lado, filetes: Filete[]) {
  const rolagem = caixa("bn-camada");
  const perspectiva = caixa("bn-perspectiva");
  const plano = apagado(caixa("bn-plano"));
  rolagem.appendChild(perspectiva);
  perspectiva.appendChild(plano);
  rolagem.dataset[lado === "traseira" ? "discoTraseiro" : "discoFrontal"] = "";
  plano.dataset.planoDoDisco = "";
  if (lado === "frontal") plano.dataset.faixa = "";

  const svg = svgDaCamada();
  const defs = elemento("defs", {});
  // O disco é mais forte perto do buraco e se apaga para fora; o miolo claro
  // segue o mesmo desenho, mais estreito. Os raios são frações do círculo.
  const fracao = (r: number) => r / RAIO_EXTERNO;
  defs.append(
    gradiente(
      "radialGradient",
      { id: `bn-disco-${lado}` },
      [
        [fracao(RAIO_INTERNO) - 0.01, 0],
        [fracao(RAIO_INTERNO), 0.95],
        [0.32, 0.7],
        [0.45, 0.5],
        [0.62, 0.3],
        [0.8, 0.12],
        [1, 0],
      ],
    ),
    gradiente(
      "radialGradient",
      { id: `bn-miolo-${lado}` },
      [
        [fracao(RAIO_INTERNO) - 0.01, 0],
        [fracao(RAIO_INTERNO), 1],
        [0.3, 0.8],
        [0.38, 0.35],
        [0.48, 0],
      ],
      NUCLEO,
    ),
    // Brilho relativístico: o lado que vem na nossa direção (esquerdo) é mais
    // claro. Máscara de luminância no espaço do plano, então gira com ele.
    gradiente(
      "linearGradient",
      { id: `bn-doppler-${lado}`, gradientUnits: "userSpaceOnUse", x1: -RAIO_EXTERNO, y1: 0, x2: RAIO_EXTERNO, y2: 0 },
      [
        [0, 1],
        [0.5, 0.8],
        [1, 0.55],
      ],
      NUCLEO,
    ),
  );
  const mascara = elemento("mask", {
    id: `bn-mascara-${lado}`,
    maskUnits: "userSpaceOnUse",
    x: -300,
    y: -300,
    width: 600,
    height: 600,
  });
  mascara.appendChild(
    elemento("rect", { x: -300, y: -300, width: 600, height: 600, fill: `url(#bn-doppler-${lado})` }),
  );
  const corte = elemento("clipPath", { id: `bn-corte-${lado}` });
  corte.appendChild(
    elemento("rect", { x: -300, y: lado === "traseira" ? -300 : 0, width: 600, height: 300 }),
  );
  defs.append(mascara, corte);
  svg.appendChild(defs);

  const recortado = elemento("g", { "clip-path": `url(#bn-corte-${lado})` });
  const iluminado = elemento("g", { mask: `url(#bn-mascara-${lado})` });
  iluminado.append(
    elemento("circle", { r: RAIO_EXTERNO, fill: `url(#bn-disco-${lado})` }),
    elemento("circle", { r: RAIO_EXTERNO, fill: `url(#bn-miolo-${lado})`, opacity: 0.9 }),
  );
  for (const fio of FIOS) {
    const aro = elemento("circle", {
      r: fio * R,
      fill: "none",
      "stroke-width": 1,
      "stroke-opacity": 0.35,
    });
    aro.style.stroke = NUCLEO;
    iluminado.appendChild(aro);
  }

  // Filetes: o traço tracejado de um círculo inteiro; o anime.js gira o grupo
  // em torno do centro do plano (a caixa do grupo é o círculo, centrado em 0).
  const grupos = filetes.map((f) => {
    const raio = f.raio * R;
    const volta = 2 * Math.PI * raio;
    const grupo = apagado(elemento("g", {}));
    grupo.dataset[lado === "frontal" ? "filete" : "fileteTraseiro"] = "";
    grupo.style.transformBox = "fill-box";
    grupo.style.transformOrigin = "center";
    const traco = elemento("circle", {
      r: raio,
      fill: "none",
      "stroke-width": f.largura,
      "stroke-opacity": f.opacidade,
      "stroke-linecap": "round",
      "stroke-dasharray": `${volta * f.arco} ${volta * (1 - f.arco)}`,
    });
    traco.style.stroke = NUCLEO;
    grupo.appendChild(traco);
    iluminado.appendChild(grupo);
    return grupo;
  });

  recortado.appendChild(iluminado);
  svg.appendChild(recortado);
  plano.appendChild(svg);
  return { rolagem, plano, filetes: grupos };
}

export function iniciarBuracoNegro(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.buracoNegro = MARCA_DO_BURACO_NEGRO;
  moldura.dataset.versao = versao;

  const cena = caixa("hero-buraco-negro-cena");
  const halo = criarHalo();
  const arco = criarArco();
  const traseiro = criarMetadeDoDisco("traseira", FILETES[versao]);
  const { camada: sombra, fotons } = criarSombra();
  const frontal = criarMetadeDoDisco("frontal", FILETES[versao]);
  // A moldura mostra o conjunto de uma vez; cada camada nasce apagada.
  cena.append(halo, arco, traseiro.rolagem, sombra, frontal.rolagem);
  moldura.appendChild(cena);

  const planos = [traseiro.plano, frontal.plano];
  const rolagens = [arco, traseiro.rolagem, frontal.rolagem];
  // Mesmo filete nas duas metades: animados juntos, para nunca se desencontrarem.
  const pares = traseiro.filetes.map((t, i) => [t, frontal.filetes[i]]);

  const animacoes: Array<JSAnimation | Timeline> = [];
  let destruida = false;
  let pausada = false;

  // Depois da entrada: a pose deriva alguns graus (câmera à deriva) e o halo
  // respira. Criadas só aqui para não disputarem as mesmas propriedades com a
  // entrada.
  function iniciarMovimentoContinuo() {
    if (destruida || versao !== "completa") return;
    const continuas = [
      animate(planos, {
        rotateX: [`${TOMBAMENTO}deg`, `${TOMBAMENTO + DERIVA}deg`],
        duration: 9000,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }),
      animate(rolagens, {
        rotateZ: [`${INCLINACAO}deg`, `${INCLINACAO - DERIVA * 0.7}deg`],
        duration: 13000,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }),
      animate(halo, {
        opacity: [1, 0.78],
        duration: 4200,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }),
    ];
    animacoes.push(...continuas);
    if (pausada) for (const a of continuas) a.pause();
  }

  const entrada = createTimeline({
    defaults: { ease: "outQuad" },
    onComplete: iniciarMovimentoContinuo,
  });
  entrada
    .add(halo, { opacity: [0, 1], duration: 1200 })
    .add(arco, { opacity: [0, 1], duration: 1000 }, "-=800")
    // O disco entra deitando: de pé (visto de lado) até a pose final, e a
    // inclinação na tela abre junto.
    .add(
      planos,
      { opacity: [0, 1], rotateX: ["90deg", `${TOMBAMENTO}deg`], duration: 1800, ease: "outCubic" },
      "-=500",
    )
    .add(
      rolagens,
      { rotateZ: ["0deg", `${INCLINACAO}deg`], duration: 1800, ease: "outCubic" },
      "<<",
    )
    .add(fotons, { opacity: [0, 1], duration: 700 }, "-=900");
  for (const lado of [traseiro.filetes, frontal.filetes]) {
    entrada.add(lado, { opacity: [0, 1], duration: 800, delay: stagger(140) }, "-=1200");
  }
  animacoes.push(entrada);

  // Órbita: cada filete gira no plano do disco (sentido anti-horário visto de
  // cima, o lado esquerdo vem na nossa direção), mais rápido perto do buraco.
  if (versao === "completa") {
    pares.forEach((par, i) => {
      animacoes.push(
        animate(par, {
          rotate: ["0deg", "-360deg"],
          duration: FILETES[versao][i].volta * 1000,
          ease: "linear",
          loop: true,
        }),
      );
    });
  }

  function aplicar() {
    for (const a of animacoes) {
      if (pausada) a.pause();
      else a.resume();
    }
  }

  return {
    pausar() {
      pausada = true;
      aplicar();
    },
    retomar() {
      pausada = false;
      aplicar();
    },
    destruir() {
      destruida = true;
      for (const a of animacoes) a.revert();
      cena.remove();
      delete moldura.dataset.buracoNegro;
      delete moldura.dataset.versao;
    },
  };
}
