// Gera o CV público (um PDF por idioma) a partir do conteúdo do Portfólio.
//
//   node scripts/gerar-cv.mjs
//
// Escreve `public/<caminho de contato.json cvPublico>` para cada idioma.
// O CV público deriva do Portfólio: os textos vêm de `content/` (Canais de
// contato, Experiência profissional, Projetos em destaque, competências,
// formação), inclusive o Posicionamento (`content/home`). Só o nível fica
// aqui, porque aparece apenas no CV público (ver CONTEXT.md). Nunca inclui telefone; a
// cidade é só "São Paulo, SP".
//
// Sem dependências: escreve um PDF simples, com fontes padrão (Helvetica) e
// streams sem compressão, para que o texto possa ser conferido nos testes.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const CONTEUDO = path.join(RAIZ, "content");
const PUBLICO = path.join(RAIZ, "public");

const TEXTOS = {
  pt: {
    nivel: "Em busca de estágio ou vaga júnior em desenvolvimento. Também aberto a projetos freelance.",
    cidade: "São Paulo, SP",
    secoes: {
      experiencia: "Experiência profissional",
      projetos: "Projetos em destaque",
      competencias: "Competências técnicas",
      formacao: "Formação",
    },
    previsao: "previsão de conclusão",
  },
  en: {
    nivel: "Looking for an internship or junior developer role. Also open to freelance projects.",
    cidade: "São Paulo, SP",
    secoes: {
      experiencia: "Work experience",
      projetos: "Featured projects",
      competencias: "Technical skills",
      formacao: "Education",
    },
    previsao: "expected graduation",
  },
};

function lerJson(...partes) {
  return JSON.parse(readFileSync(path.join(CONTEUDO, ...partes), "utf8"));
}

function lerJsonOpcional(...partes) {
  const arquivo = path.join(CONTEUDO, ...partes);
  return existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, "utf8")) : undefined;
}

function projetosEmDestaque(lang) {
  const pasta = path.join(CONTEUDO, "projetos");
  return readdirSync(pasta)
    .map((id) => ({ id, comum: lerJson("projetos", id, "projeto.json") }))
    .filter((p) => p.comum.tipo === "destaque")
    .sort((a, b) => a.comum.ordem - b.comum.ordem)
    .map((p) => ({ ...p.comum, ...lerJson("projetos", p.id, `${lang}.json`) }));
}

// ---------------------------------------------------------------------------
// Montagem das linhas do CV

function linhasDoCv(lang) {
  const t = TEXTOS[lang];
  const home = lerJson("home", `${lang}.json`);
  const contato = lerJson("contato", "contato.json");
  const experiencia = lerJson("experiencia", `${lang}.json`);
  const competencias = lerJson("competencias", `${lang}.json`);
  const formacao = lerJsonOpcional("formacao", `${lang}.json`);

  const linhas = [];
  const titulo = (texto) => linhas.push({ texto, fonte: "F2", tamanho: 12, antes: 14 });
  const paragrafo = (texto, extra = {}) => linhas.push({ texto, fonte: "F1", tamanho: 10, antes: 2, ...extra });

  linhas.push({ texto: home.nome, fonte: "F2", tamanho: 20, antes: 0 });
  paragrafo(home.posicionamento, { tamanho: 11, antes: 6 });
  paragrafo(t.nivel, { antes: 4 });
  paragrafo(`${t.cidade}  •  ${contato.email}`, { antes: 8 });
  paragrafo(`LinkedIn: ${contato.linkedin}`);
  paragrafo(`GitHub: ${contato.github}`);

  titulo(t.secoes.experiencia);
  for (const cargo of experiencia) {
    paragrafo(`${cargo.cargo} | ${cargo.empresa}`, { fonte: "F2", antes: 6 });
    paragrafo(cargo.periodo);
    for (const atividade of cargo.atividades) paragrafo(`•  ${atividade}`, { recuo: 10 });
  }

  titulo(t.secoes.projetos);
  for (const projeto of projetosEmDestaque(lang)) {
    paragrafo(`${projeto.titulo} | ${projeto.stack.join(", ")}`, { fonte: "F2", antes: 6 });
    paragrafo(projeto.resumo);
    paragrafo(projeto.repositorio);
  }

  titulo(t.secoes.competencias);
  for (const grupo of competencias) paragrafo(`${grupo.nome}: ${grupo.itens.join(", ")}`);

  if (formacao) {
    titulo(t.secoes.formacao);
    paragrafo(`${formacao.curso} | ${formacao.instituicao} (${t.previsao}: ${formacao.previsao})`);
    paragrafo(formacao.ingles);
  }

  return linhas;
}

// ---------------------------------------------------------------------------
// Escrita do PDF

const LARGURA = 595;
const ALTURA = 842;
const MARGEM = 45;

/** Caracteres fora do ASCII que existem em WinAnsiEncoding além de Latin-1. */
const WIN_ANSI = { "–": 0x96, "—": 0x97, "•": 0x95, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "…": 0x85 };

function textoPdf(texto) {
  let saida = "";
  for (const c of texto) {
    const codigo = WIN_ANSI[c] ?? c.codePointAt(0);
    if (codigo > 0xff) throw new Error(`Caractere sem suporte no CV: "${c}"`);
    if (c === "(" || c === ")" || c === "\\") saida += `\\${c}`;
    else if (codigo < 0x20 || codigo > 0x7e) saida += `\\${codigo.toString(8).padStart(3, "0")}`;
    else saida += c;
  }
  return `(${saida})`;
}

/** Quebra aproximada pela largura média da Helvetica (conservadora). */
function quebrar(texto, tamanho, largura) {
  const maximo = Math.floor(largura / (tamanho * 0.47));
  const linhas = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    const candidato = atual === "" ? palavra : `${atual} ${palavra}`;
    if (candidato.length > maximo && atual !== "") {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = candidato;
    }
  }
  if (atual !== "") linhas.push(atual);
  return linhas;
}

function paginas(linhas) {
  const resultado = [[]];
  let y = ALTURA - MARGEM;
  for (const linha of linhas) {
    const recuo = linha.recuo ?? 0;
    const pedacos = quebrar(linha.texto, linha.tamanho, LARGURA - 2 * MARGEM - recuo);
    y -= linha.antes;
    pedacos.forEach((pedaco, i) => {
      const altura = linha.tamanho * 1.25;
      if (y - altura < MARGEM) {
        resultado.push([]);
        y = ALTURA - MARGEM;
      }
      y -= altura;
      // Continuação de item com marcador fica alinhada ao texto.
      const x = MARGEM + recuo + (i > 0 && linha.texto.startsWith("•") ? 10 : 0);
      resultado.at(-1).push(
        `BT /${linha.fonte} ${linha.tamanho} Tf ${x} ${y.toFixed(1)} Td ${textoPdf(pedaco)} Tj ET`,
      );
    });
  }
  return resultado;
}

function montarPdf(linhas, lang) {
  const objetos = [];
  const adicionar = (corpo) => objetos.push(corpo) && objetos.length;

  const catalogo = adicionar(null);
  const arvore = adicionar(null);
  const helvetica = adicionar("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const negrito = adicionar("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const filhos = paginas(linhas).map((comandos) => {
    const stream = comandos.join("\n");
    const conteudo = adicionar(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    return adicionar(
      `<< /Type /Page /Parent ${arvore} 0 R /MediaBox [0 0 ${LARGURA} ${ALTURA}] ` +
        `/Resources << /Font << /F1 ${helvetica} 0 R /F2 ${negrito} 0 R >> >> /Contents ${conteudo} 0 R >>`,
    );
  });

  objetos[catalogo - 1] = `<< /Type /Catalog /Pages ${arvore} 0 R /Lang (${lang === "pt" ? "pt-BR" : "en"}) >>`;
  objetos[arvore - 1] = `<< /Type /Pages /Kids [${filhos.map((f) => `${f} 0 R`).join(" ")}] /Count ${filhos.length} >>`;
  const info = adicionar(`<< /Title ${textoPdf(`${linhas[0].texto} - CV`)} /Author ${textoPdf(linhas[0].texto)} >>`);

  let pdf = "%PDF-1.4\n";
  const posicoes = [];
  objetos.forEach((corpo, i) => {
    posicoes.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${corpo}\nendobj\n`;
  });
  const inicioXref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const posicao of posicoes) pdf += `${String(posicao).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root ${catalogo} 0 R /Info ${info} 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

const contato = lerJson("contato", "contato.json");
for (const lang of Object.keys(TEXTOS)) {
  const destino = path.join(PUBLICO, contato.cvPublico[lang]);
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, montarPdf(linhasDoCv(lang), lang));
  console.log(`CV público (${lang}): ${path.relative(RAIZ, destino)}`);
}
