// Ilustrações dos estudos de caso como SVG inline.
//
// Uma <img> não deixa animar o desenho por fora; por isso o SVG de
// `public/ilustracoes/` é lido no build (as páginas são estáticas) e entra
// direto no HTML. Sem JavaScript e com movimento reduzido ele aparece parado,
// igual ao arquivo. O pulso (components/ilustracao/pulso.ts) só acrescenta
// decoração sobre as marcas que este módulo grava:
//
// - `data-conector="solido"`: seta contínua ("depende de", "segue para");
// - `data-conector="tracejado"`: seta tracejada ("implementa");
// - `data-no`: caixa do diagrama.
//
// Como várias ilustrações podem dividir a mesma página, ids e classes de cada
// uma ganham um prefixo próprio (os arquivos usam nomes como `#seta`, `#t`,
// `.linha` e `.det` com regras diferentes). O nome acessível passa a ser o
// texto alternativo do conteúdo, no idioma da página.

import { readFileSync } from "node:fs";
import path from "node:path";

/** Classes dos arquivos que marcam setas, e o tipo de traço de cada uma. */
const CLASSES_DE_CONECTOR: Record<string, "solido" | "tracejado"> = {
  linha: "solido",
  tracejada: "tracejado",
};

/** Classes dos arquivos que marcam caixas do diagrama. */
const CLASSES_DE_NO = new Set(["caixa", "centro", "passo", "decisao", "ok", "erro"]);

/** Atributos do <svg> raiz trocados pelo nome acessível e pelo CSS da página. */
const ATRIBUTOS_DA_RAIZ_DESCARTADOS = [
  "width",
  "height",
  "role",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
];

type Opcoes = {
  /** Prefixo único na página para ids e classes (ex.: `ilustracao-0`). */
  prefixo: string;
  /** Texto alternativo: vira o nome acessível do SVG. */
  alt: string;
};

function escaparAtributo(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lerAtributo(atributos: string, nome: string): string | undefined {
  return new RegExp(`\\s${escaparRegex(nome)}="([^"]*)"`).exec(atributos)?.[1];
}

/** Grava as marcas de conector e de caixa nas formas do desenho. */
function marcarFormas(svg: string): string {
  return svg.replace(
    /<(rect|line|path)\b([^>]*?)(\s*\/?)>/g,
    (tag, nome: string, atributos: string, fim: string) => {
      const classes = (lerAtributo(atributos, "class") ?? "").split(/\s+/).filter(Boolean);
      let marca = "";
      if (nome === "rect") {
        const ehNo =
          classes.some((c) => CLASSES_DE_NO.has(c)) ||
          (classes.length === 0 && lerAtributo(atributos, "stroke") !== undefined);
        if (ehNo) marca = " data-no=\"\"";
      } else {
        const tipo =
          classes.map((c) => CLASSES_DE_CONECTOR[c]).find(Boolean) ??
          (lerAtributo(atributos, "marker-end") !== undefined ? "solido" : undefined);
        if (tipo) marca = ` data-conector="${tipo}"`;
      }
      return marca ? `<${nome}${atributos}${marca}${fim}>` : tag;
    },
  );
}

/** Prefixa ids (e as referências a eles) e classes (e as regras do <style>). */
function prefixarNomes(svg: string, prefixo: string): string {
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const classes = new Set(
    [...svg.matchAll(/\sclass="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/).filter(Boolean)),
  );

  let saida = svg;
  for (const id of ids) {
    const novo = `${prefixo}-${id}`;
    const nome = escaparRegex(id);
    saida = saida
      .replace(new RegExp(`(\\sid=")${nome}(")`, "g"), `$1${novo}$2`)
      .replace(new RegExp(`url\\(#${nome}\\)`, "g"), `url(#${novo})`)
      .replace(new RegExp(`((?:xlink:)?href=")#${nome}(")`, "g"), `$1#${novo}$2`);
  }

  saida = saida.replace(/(\sclass=")([^"]+)(")/g, (_m, antes: string, valor: string, depois: string) =>
    `${antes}${valor
      .split(/\s+/)
      .filter(Boolean)
      .map((c) => `${prefixo}-${c}`)
      .join(" ")}${depois}`,
  );

  saida = saida.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (_m, abre: string, css: string, fecha: string) => {
    let novoCss = css;
    for (const classe of classes) {
      novoCss = novoCss.replace(
        new RegExp(`\\.${escaparRegex(classe)}(?![\\w-])`, "g"),
        `.${prefixo}-${classe}`,
      );
    }
    return `${abre}${novoCss}${fecha}`;
  });

  return saida;
}

/** Troca os atributos do <svg> raiz pelo nome acessível vindo do conteúdo. */
function ajustarRaiz(svg: string, alt: string): string {
  return svg.replace(/<svg\b([^>]*)>/, (_m, atributos: string) => {
    let limpos = atributos;
    for (const nome of ATRIBUTOS_DA_RAIZ_DESCARTADOS) {
      limpos = limpos.replace(new RegExp(`\\s${escaparRegex(nome)}="[^"]*"`, "g"), "");
    }
    return `<svg${limpos} role="img" aria-label="${escaparAtributo(alt)}" focusable="false">`;
  });
}

/**
 * Prepara o texto de um SVG de `public/ilustracoes/` para entrar inline.
 * Função pura (testada em lib/ilustracoes.test.ts): não toca em nenhum texto
 * do desenho, só em nomes internos, no nome acessível e nas marcas `data-*`.
 */
export function prepararIlustracao(bruto: string, { prefixo, alt }: Opcoes): string {
  const limpo = bruto
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // O nome acessível passa a ser o `alt` do conteúdo, no idioma da página.
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, "")
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g, "")
    .trim();
  return ajustarRaiz(prefixarNomes(marcarFormas(limpo), prefixo), alt);
}

/**
 * Lê a ilustração local (`url` como `/ilustracoes/x.svg`, já validada pelo
 * carregador de conteúdo) e a prepara para entrar inline. Roda no build.
 */
export function carregarIlustracao(url: string, opcoes: Opcoes): string {
  const arquivo = path.join(process.cwd(), "public", ...url.split("/").filter(Boolean));
  return prepararIlustracao(readFileSync(arquivo, "utf8"), opcoes);
}
