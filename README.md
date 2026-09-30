# portfolio
Portfólio de Gabriel Migliatti: automações, integrações e APIs com Node.js, Python e TypeScript.

## Desenvolvimento

```bash
npm install
npm run dev          # http://localhost:3000 (redireciona para /pt)
npm run lint
npm run typecheck
npm run build
npx playwright install chromium   # uma vez
npm run test:e2e     # smoke test da home em /pt e /en
npx vitest run       # testes do módulo de conteúdo (requer vitest instalado)
```

## Conteúdo

Textos e projetos ficam em `content/`, um arquivo JSON por idioma:

```
content/home/{pt,en}.json            nome, Posicionamento, título e descrição
content/experiencia/{pt,en}.json     Experiência profissional
content/competencias/{pt,en}.json    competências agrupadas
content/projetos/<id>/projeto.json   tipo, estado, stack, repositório, Demo, Evidências
content/projetos/<id>/{pt,en}.json   título, resumo e Estudo de caso (só destaques)
```

As páginas leem tudo pelo módulo `lib/content` (`listarDestaques`,
`listarOutrosProjetos`, `obterProjeto`, `obterTextosHome`...), nunca pelo
sistema de arquivos. O módulo valida o conteúdo inteiro e `npm run build`
falha listando o que estiver faltando (idioma ausente, campo ou link vazio,
Estudo de caso fora de um destaque, projeto sem Demo e sem Evidência).
