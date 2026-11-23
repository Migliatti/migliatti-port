# Redesign "estrondoso" — plano

**Linha 1 (kind):** software (page-type software, site-kind software).

**Linha 2 (deal):** hero `centred` sorteado, **com desvio**: o hero mantém texto de um lado e o buraco negro do outro, porque o buraco negro precisa de espaço ao lado do texto (decisão do dono); brand com o azul `#66a4f5` (papéis reequilibrados: azul é a ação principal — botão primário pílula azul com texto `#171717`; pílula neutra `#e6e6e6` vira secundária; tokens de cor existentes mantidos); pairing `chivo` (Chivo display 400, tracking -0.03em; Chivo Mono para números, rótulos e HUD); radius soft; botões pill; nav-centre; footer-columns; close-type; rhythm space; mark stack (monograma "GM" empilhado); sem lit ground (tema escuro único, ADR 0004); efeito único: o buraco negro existente (CSS 3D + anime.js) com o céu ao fundo, formando uma só cena no hero (nenhum shader WebGL novo; o `fluted-glass` sorteado sai); moments: `pinned-chapters` (Projetos em destaque, um capítulo por projeto com a evidência grande) + `counter-rolls` (números verificáveis calculados de `content/`: projetos, estudos de caso, tecnologias distintas).

**Por que a paleta serve:** grafite escuro + um azul frio de sinal é a linguagem de ferramentas técnicas; o azul agora carrega a ação.

## Seções da home

Cada uma 1 ou 2 telas a 1440x900, `--h`.

- **hero** (1): texto de um lado (nome + Posicionamento, um fato verificável, 2 ações: Ver projetos / Falar comigo) e o buraco negro do outro, mais forte (maior, com entrada `data-enter`), com o céu ao fundo na mesma cena; sem moldura de app no hero.
- **destaques** (pinned-chapters, 3–4 telas): Kepler Lab (com a captura real `public/evidencias/kepler-lab.jpg` em moldura de app), LabReserve, Grimoire, cada um com evidência real grande, resumo, stack, links ≥44px.
- **numeros** (1): counter-rolls com dados reais do build.
- **vitrine** (1–2): peça orbital + HUD (mantidos; são conteúdo pelo CONTEXT.md).
- **outros-projetos** (1), **experiencia** (1), **competencias** (1), **formacao+contato** → fechamento close-type com o e-mail grande (1), rodapé footer-columns.

## Estudo de caso

Cabeçalho como hero do caso (título, resumo, Demo/Repositório ≥44px, evidência principal grande); narrativa em seções numeradas; stack com ícones reais (`icons.mjs`); evidências em largura total.

## Regras mantidas

ADR 0007 (tudo tem caminho reduzido), AA, alvos 44px, alt, foco visível, sem rolagem horizontal em 390/320, conteúdo verdadeiro e pt/en equivalentes, ilustrações e evidências reais (nada de foto de banco).

## Waivers previstos (`.taste-skill/waivers.json`)

- Rótulo "ILUSTRAÇÃO" (CONTEXT.md, Evidência).
- E-mail real em vez de `.example` (Canal de contato).
- Vitrine/HUD com loop e ponteiro (CONTEXT.md, Vitrine/HUD).

## Fases

1. Fundação
2. Hero
3. Seções da home
4. Estudo de caso
5. Texto pt/en
6. Movimento (skills choreograph/animate/animation-performance/emil-design-eng)
7. Checagens da skill, gate, testes e capturas depois
