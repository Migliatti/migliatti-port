// Validação estrutural do conteúdo bruto lido dos arquivos JSON.
// Cada função acumula mensagens em `erros` em vez de parar no primeiro
// problema, para que o build mostre tudo o que falta de uma vez.

export type Erros = string[];

export function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export function texto(
  obj: Record<string, unknown>,
  campo: string,
  onde: string,
  erros: Erros,
): string {
  const valor = obj[campo];
  if (typeof valor !== "string" || valor.trim() === "") {
    erros.push(`${onde}: campo obrigatório "${campo}" ausente ou vazio`);
    return "";
  }
  return valor;
}

export function listaDeTextos(
  obj: Record<string, unknown>,
  campo: string,
  onde: string,
  erros: Erros,
): string[] {
  const valor = obj[campo];
  if (!Array.isArray(valor) || valor.length === 0) {
    erros.push(`${onde}: campo obrigatório "${campo}" deve ser uma lista não vazia`);
    return [];
  }
  valor.forEach((item, i) => {
    if (typeof item !== "string" || item.trim() === "") {
      erros.push(`${onde}: "${campo}[${i}]" ausente ou vazio`);
    }
  });
  return valor as string[];
}

export function link(
  obj: Record<string, unknown>,
  campo: string,
  onde: string,
  erros: Erros,
): string {
  const valor = texto(obj, campo, onde, erros);
  if (valor === "") return valor;
  if (!ehUrlHttp(valor)) {
    erros.push(`${onde}: "${campo}" não é um link http(s) válido: "${valor}"`);
  }
  return valor;
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Endereço de e-mail simples (sem `mailto:`), usado para montar o link. */
export function email(
  obj: Record<string, unknown>,
  campo: string,
  onde: string,
  erros: Erros,
): string {
  const valor = texto(obj, campo, onde, erros);
  if (valor !== "" && !EMAIL_VALIDO.test(valor)) {
    erros.push(`${onde}: "${campo}" não é um e-mail válido: "${valor}"`);
  }
  return valor;
}

export function umDe<T extends string>(
  obj: Record<string, unknown>,
  campo: string,
  opcoes: readonly T[],
  onde: string,
  erros: Erros,
): T {
  const valor = obj[campo];
  if (typeof valor !== "string" || !(opcoes as readonly string[]).includes(valor)) {
    erros.push(
      `${onde}: "${campo}" deve ser um de ${opcoes.map((o) => `"${o}"`).join(", ")}`,
    );
    return opcoes[0];
  }
  return valor as T;
}

function ehUrlHttp(valor: string): boolean {
  try {
    const url = new URL(valor);
    return (url.protocol === "https:" || url.protocol === "http:") && url.host !== "";
  } catch {
    return false;
  }
}
