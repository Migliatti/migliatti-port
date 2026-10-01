import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * SHA do commit do build, para o HUD. Vem do git; na falta dele (build sem
 * repositório) tenta as variáveis da plataforma. Sem nenhuma fonte, fica vazio
 * e o HUD mostra "indisponível": o valor nunca é inventado.
 */
function shaDoBuild(): string {
  try {
    const sha = execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (/^[0-9a-f]{7,40}$/i.test(sha)) return sha;
  } catch {
    // Sem git: cai nas variáveis da plataforma.
  }
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "";
}

const nextConfig: NextConfig = {
  env: {
    BUILD_SHA: shaDoBuild(),
    // Data do build em UTC (AAAA-MM-DD), igual em qualquer idioma.
    BUILD_DATA: new Date().toISOString().slice(0, 10),
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pt",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
