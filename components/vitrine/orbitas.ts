// Peça da Vitrine: o sistema orbital em SVG, animado com anime.js v4.
//
// Este módulo é a parte pesada da Vitrine. Só é importado (via `import()`)
// por PecaDaVitrine quando a seção entra na tela; por isso vive num chunk separado, junto com os módulos
// do anime.js que usa. Regras em docs/adr/0002-vitrine.md e
// docs/adr/0003-editorial-espacial-animejs.md.
//
// Não cria elementos: move o quadro parado que já veio do servidor
// (os atributos `data-*` de PecaDaVitrine.tsx são o contrato).
//
// Celular fraco (`pointer: coarse`, poucos núcleos ou pouca memória): versão
// leve, sem as órbitas extras e sem filtros. Não se mede FPS em runtime.
// Só a versão completa pede o chunk da constelação e do parallax
// (constelacao.ts), que segue a mesma pausa desta peça.

import { animate, createTimeline, stagger, svg, type JSAnimation, type Timeline } from "animejs";
import type { Camadas } from "./constelacao";
import { corAleatoria } from "../animacao/cor-aleatoria";
import { versaoParaEsteAparelho } from "../animacao/aparelho";
import { pontoNaOrbita } from "./geometria";

/** Marca gravada na moldura; o e2e usa para achar o chunk desta peça. */
export const MARCA_DA_PECA = "vitrine-orbitas";

export type Peca = {
  pausar(): void;
  retomar(): void;
  /** Para a animação, devolve o quadro parado e solta todos os recursos. */
  destruir(): void;
};

// A classificação do aparelho é compartilhada com o céu da Hero e o pulso
// das ilustrações (components/animacao/aparelho.ts).
export { versaoParaEsteAparelho, type Versao } from "../animacao/aparelho";

/** Lê a órbita gravada no elemento pelo quadro parado. */
function lerOrbita(el: Element) {
  const numero = (nome: string) => Number(el.getAttribute(`data-${nome}`));
  return {
    rx: numero("rx"),
    ry: numero("ry"),
    inicio: numero("inicio"),
    volta: numero("volta"),
  };
}

export function iniciarPeca(moldura: HTMLElement): Peca {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.peca = MARCA_DA_PECA;
  moldura.dataset.versao = versao;

  const corpos = Array.from(moldura.querySelectorAll<SVGGElement>("[data-corpo]"));
  const satelites =
    versao === "completa"
      ? Array.from(moldura.querySelectorAll<SVGCircleElement>("[data-satelite]"))
      : [];
  const astros = Array.from(moldura.querySelectorAll<SVGCircleElement>("[data-astro]"));
  const nucleo = moldura.querySelector<SVGCircleElement>("[data-nucleo]");
  const rastros = Array.from(moldura.querySelectorAll<SVGPathElement>("[data-rastro]"));

  // Posições do quadro parado, devolvidas em `destruir`.
  const posicoesIniciais = new Map<Element, string | null>(
    [...corpos, ...satelites].map((el) => [el, el.getAttribute("transform")]),
  );

  // Cada corpo ganha o próprio matiz; sem a peça animada fica azul.
  for (const corpo of corpos) corpo.style.color = corAleatoria();

  if (versao === "completa") {
    for (const astro of astros) astro.setAttribute("filter", "url(#vitrine-brilho)");
  }

  const animacoes: (JSAnimation | Timeline)[] = [];

  // Cada corpo (e satélite) dá voltas na própria elipse, partindo do ângulo
  // em que o quadro parado o desenhou.
  for (const el of [...corpos, ...satelites]) {
    const orbita = lerOrbita(el);
    const estado = { angulo: orbita.inicio };
    animacoes.push(
      animate(estado, {
        angulo: orbita.inicio + 360,
        duration: orbita.volta,
        ease: "linear",
        loop: true,
        onUpdate: () => {
          const { x, y } = pontoNaOrbita(orbita, estado.angulo);
          el.setAttribute("transform", `translate(${x} ${y})`);
        },
      }),
    );
  }

  // Rastro de luz que percorre cada órbita dos pilares, um depois do outro.
  const desenhaveis = svg.createDrawable(rastros);
  animacoes.push(
    animate(desenhaveis, {
      draw: ["0 0", "0 0.2", "0.8 1", "1 1"],
      duration: (_alvo: unknown, i = 0) => {
        const corpo = corpos[i];
        return corpo ? lerOrbita(corpo).volta / 2 : 8000;
      },
      delay: stagger(900),
      ease: "linear",
      loop: true,
    }),
  );

  // Entrada: núcleo e corpos pulsam uma vez, em sequência.
  const entrada = createTimeline({ defaults: { ease: "outQuad" } });
  if (nucleo) entrada.add(nucleo, { r: [11, 14, 11], duration: 700 });
  entrada.add(astros, { r: [9, 13, 9], duration: 600, delay: stagger(160) }, "-=350");
  animacoes.push(entrada);

  // Quem passa o mouse ou foca um corpo consegue lê-lo parado.
  let pausadaPorFora = false;
  let emDestaque = false;
  let destruida = false;

  // Só a versão completa ganha a constelação e o parallax, num chunk à parte:
  // a versão leve nem chega a pedi-lo. Se a peça for pausada ou destruída
  // antes de o chunk chegar, o estado é aplicado (ou nada é criado) na chegada.
  let camadas: Camadas | null = null;
  if (versao === "completa") {
    import("./constelacao")
      .then(({ iniciarCamadas }) => {
        if (destruida) return;
        camadas = iniciarCamadas(moldura);
        if (pausadaPorFora) camadas?.pausar();
      })
      .catch(() => {
        // Sem as camadas extras, a peça segue só com as órbitas.
      });
  }

  function aplicar() {
    const rodar = !pausadaPorFora && !emDestaque;
    for (const a of animacoes) {
      if (rodar) a.resume();
      else a.pause();
    }
  }

  const aoDestacar = () => {
    emDestaque = true;
    aplicar();
  };
  const aoSoltar = () => {
    emDestaque = moldura.querySelector("[data-corpo]:is(:hover, :focus)") !== null;
    aplicar();
  };

  for (const corpo of corpos) {
    corpo.addEventListener("pointerenter", aoDestacar);
    corpo.addEventListener("pointerleave", aoSoltar);
    corpo.addEventListener("focus", aoDestacar);
    corpo.addEventListener("blur", aoSoltar);
  }

  return {
    pausar() {
      pausadaPorFora = true;
      aplicar();
      camadas?.pausar();
    },
    retomar() {
      pausadaPorFora = false;
      aplicar();
      camadas?.retomar();
    },
    destruir() {
      destruida = true;
      camadas?.destruir();
      camadas = null;
      for (const a of animacoes) a.revert();
      for (const corpo of corpos) {
        corpo.removeEventListener("pointerenter", aoDestacar);
        corpo.removeEventListener("pointerleave", aoSoltar);
        corpo.removeEventListener("focus", aoDestacar);
        corpo.removeEventListener("blur", aoSoltar);
      }
      for (const [el, transform] of posicoesIniciais) {
        if (transform === null) el.removeAttribute("transform");
        else el.setAttribute("transform", transform);
      }
      for (const astro of astros) astro.removeAttribute("filter");
      for (const corpo of corpos) corpo.style.removeProperty("color");
      delete moldura.dataset.peca;
      delete moldura.dataset.versao;
    },
  };
}
