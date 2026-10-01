// Dados do build exibidos no HUD. SHA e data entram por `env` em
// next.config.ts e são trocados por texto na compilação: não há consulta em
// tempo de execução nem serviço externo.

export type InfoDoBuild = {
  /** SHA curto (7 caracteres) do commit, ou `null` se o build não o conhecia. */
  sha: string | null;
  /** Data do build, AAAA-MM-DD, ou `null`. */
  data: string | null;
};

export function infoDoBuild(): InfoDoBuild {
  const sha = process.env.BUILD_SHA?.trim();
  const data = process.env.BUILD_DATA?.trim();
  return {
    sha: sha ? sha.slice(0, 7) : null,
    data: data || null,
  };
}
