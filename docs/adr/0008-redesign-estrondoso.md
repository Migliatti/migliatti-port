# Redesign "estrondoso"

Status: proposto (aguardando aprovação do dono na branch `redesign/estrondoso`)

## Contexto

O **Portfólio** funciona, mas lê como uma página de cartões equivalentes: a mesma ilha, o mesmo peso e a mesma entrada ao rolar em todas as seções. O dono quer um redesign mais forte, guiado pela taste-skill (kit em `.taste-skill/`, fora do repositório), sem perder o que já é regra: conteúdo verdadeiro, pt/en equivalentes, AA, alvos de 44px, foco visível e o caminho reduzido do ADR 0007. O plano completo e o sorteio da skill estão em `docs/redesign/PLANO.md`.

## Decisão

1. **Tipografia Chivo.** Chivo (títulos e corpo) e Chivo Mono (números, rótulos e HUD) substituem Bricolage Grotesque, Geist e Geist Mono. Títulos em peso 400 com `letter-spacing: -0.03em`; o tamanho e o espaçamento apertado carregam a hierarquia, não o negrito. As fontes vêm de `next/font/google` com `display: swap` e mantêm as variáveis `--fonte-titulo`, `--fonte-corpo` e `--fonte-mono`.
2. **O azul é a ação primária.** `.botao-primario` passa a ser a pílula azul (`--azul`, texto `--on-azul`); a pílula neutra (`--accent`) vira o estilo secundário. Os tokens de cor não mudam e `#66a4f5` continua vivendo só em `--azul`. Os botões ficam com no mínimo 44px de altura.
3. **Buraco negro e céu continuam.** A cena da Hero (buraco negro em CSS 3D + anime.js, com o céu ao fundo) é o efeito único da página no sentido da taste-skill; nenhum shader WebGL novo entra. A emenda #57 do ADR 0003 segue valendo, assim como a Hero em `100svh` (emenda do ADR 0006). O layout `centred` sorteado pela skill não serve, porque o buraco negro precisa de espaço ao lado do texto: a Hero mantém texto de um lado e buraco negro do outro, mais forte (maior, com entrada única `data-enter`), e a captura do Kepler Lab vai para o capítulo dele em Projetos em destaque.
4. **Menos movimento, mais momento.** As entradas ao rolar por seção (`animacao-ao-rolar`, o escalonamento de listas e o parallax do fundo de pontos) saem em favor de uma entrada única da Hero e de dois momentos: `pinned-chapters` (um capítulo fixado por Projeto em destaque, com a evidência grande) e `counter-rolls` (números verificáveis calculados de `content/`). É regra da taste-skill: toda página entra uma vez e tem um ou dois momentos.
5. **O que fica.** A **Vitrine**, o **HUD** e a regra de movimento reduzido (ADR 0007) continuam. Cada animação nova traz seu caminho reduzido.
6. **Direção visual.** O resto segue a taste-skill conforme `docs/redesign/PLANO.md`: tipo de página `software`, raio `soft`, botões `pill` (declarados em `<html data-type data-radius data-buttons>` e nas metas `page-type` e `site-kind`), tema escuro único (ADR 0004).

## O que revisa

- ADR 0004, item 2: o acento neutro deixa de ser a ação principal; a pílula invertida vira o estilo secundário. O resto do tema grafite fica.
- ADR 0005, item 2: o azul deixa de ser só o "segundo acento" de UI e passa a marcar a ação primária (botão primário). Continua fora de texto corrido.
- ADR 0005, item 4, e emenda #60 do ADR 0003: as entradas ao rolar, o escalonamento e o parallax do fundo saem (item 4 daqui), na fase 3 do plano.
- ADR 0004, "Consequências" ("fontes mantidas; revisão em outra rodada"): esta é a revisão.

## Aplicação em fases

A fase 1 (este ADR, fontes, papéis de cor, alvos de toque e rótulos de no mínimo 13px, atributos da skill) entra primeiro. Os itens 3 e 4 entram nas fases 2 (Hero) e 3 (seções da home); até lá o código das entradas ao rolar continua como está.

## Consequências

- `tests/e2e/identidade.spec.ts`, `tests/e2e/azul-na-ui.spec.ts` e `tests/e2e/layout-editorial.spec.ts` passam a esperar Chivo/Chivo Mono e o botão primário azul.
- `lib/design/contraste.test.ts` já cobre `--on-azul` sobre `--azul` (AA) e o azul sobre fundo e superfícies.
